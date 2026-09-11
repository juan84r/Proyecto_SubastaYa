using Application.Interfaces;
using Domain.Entities;
using Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using System;
using System.Linq;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;

namespace Infrastructure.Services
{
    public class AuctionStatusWorker : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<AuctionStatusWorker> _logger;

        public AuctionStatusWorker(IServiceProvider serviceProvider, ILogger<AuctionStatusWorker> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("AuctionStatusWorker iniciado.");

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await ProcessAuctionsAsync(stoppingToken);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error durante el ciclo de procesamiento de subastas.");
                }

                await Task.Delay(TimeSpan.FromSeconds(10), stoppingToken);
            }
        }

        private async Task ProcessAuctionsAsync(CancellationToken cancellationToken)
        {
            using var scope = _serviceProvider.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var walletRepo = scope.ServiceProvider.GetRequiredService<IWalletRepository>();
            var unitOfWork = scope.ServiceProvider.GetRequiredService<IUnitOfWork>();

            var now = DateTime.UtcNow;

            var toActivate = await context.Auctions
                .Where(a => a.Status == "PROGRAMADA" && a.StartDate <= now)
                .ToListAsync(cancellationToken);

            foreach (var auction in toActivate)
            {
                auction.Status = "ACTIVA";

                await context.Set<AudithLog>().AddAsync(new AudithLog
                {
                    Entity = "Auction",
                    EntityId = auction.Id,
                    Action = "ACTIVATED",
                    UserId = auction.SellerId,
                    DetailJson = JsonSerializer.Serialize(new { auction.Id, auction.Title, Status = "ACTIVA" }),
                    Date = now
                }, cancellationToken);

                _logger.LogInformation("Subasta #{Id} ({Title}) pasó a ACTIVA.", auction.Id, auction.Title);
            }

            var toClose = await context.Auctions
                .Include(a => a.Bids)
                .Where(a => a.Status == "ACTIVA" && a.EndDate <= now)
                .ToListAsync(cancellationToken);

            foreach (var auction in toClose)
            {
                auction.Status = "FINALIZADA";

                var winningBid = auction.Bids
                    .OrderByDescending(b => b.Amount)
                    .FirstOrDefault();

                if (winningBid != null)
                {
                    var buyerWallet = await walletRepo.GetByUserIdAsync(winningBid.BuyerId, cancellationToken);
                    var sellerWallet = await walletRepo.GetByUserIdAsync(auction.SellerId, cancellationToken);

                    if (buyerWallet != null && sellerWallet != null)
                    {
                        var winningAmount = winningBid.Amount;

                        buyerWallet.LockedBalance -= winningAmount;
                        buyerWallet.TotalBalance -= winningAmount;
                        buyerWallet.Version++;
                        walletRepo.Update(buyerWallet);

                        await context.Set<LedgerTransaction>().AddAsync(new LedgerTransaction
                        {
                            WalletId = buyerWallet.Id,
                            Type = "DEBITO_SUBASTA",
                            Amount = winningAmount,
                            Date = now,
                            AuctionId = auction.Id
                        }, cancellationToken);

                        sellerWallet.TotalBalance += winningAmount;
                        sellerWallet.Version++;
                        walletRepo.Update(sellerWallet);

                        await context.Set<LedgerTransaction>().AddAsync(new LedgerTransaction
                        {
                            WalletId = sellerWallet.Id,
                            Type = "CREDITO_SUBASTA",
                            Amount = winningAmount,
                            Date = now,
                            AuctionId = auction.Id
                        }, cancellationToken);

                        await context.Set<AudithLog>().AddAsync(new AudithLog
                        {
                            Entity = "Auction",
                            EntityId = auction.Id,
                            Action = "SETTLED",
                            UserId = winningBid.BuyerId,
                            DetailJson = JsonSerializer.Serialize(new
                            {
                                AuctionId = auction.Id,
                                WinnerUserId = winningBid.BuyerId,
                                SellerUserId = auction.SellerId,
                                Amount = winningAmount
                            }),
                            Date = now
                        }, cancellationToken);

                        _logger.LogInformation(
                            "Subasta #{Id} LIQUIDADA. Ganador: Usuario #{BuyerId}, Vendedor: Usuario #{SellerId}, Monto: ${Amount}.",
                            auction.Id, winningBid.BuyerId, auction.SellerId, winningAmount);
                    }
                    else
                    {
                        _logger.LogWarning("No se encontraron las billeteras para liquidar la subasta #{Id}.", auction.Id);
                    }
                }
                else
                {
                    await context.Set<AudithLog>().AddAsync(new AudithLog
                    {
                        Entity = "Auction",
                        EntityId = auction.Id,
                        Action = "CLOSED_DESERTED",
                        UserId = auction.SellerId,
                        DetailJson = JsonSerializer.Serialize(new { auction.Id, Reason = "Sin ofertas" }),
                        Date = now
                    }, cancellationToken);

                    _logger.LogInformation("Subasta #{Id} FINALIZADA sin ofertas (desierta).", auction.Id);
                }
            }

            if (toActivate.Any() || toClose.Any())
            {
                await unitOfWork.SaveChangesAsync(cancellationToken);
            }
        }
    }
}
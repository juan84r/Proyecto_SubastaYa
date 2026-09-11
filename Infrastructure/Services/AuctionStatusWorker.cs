using Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using System;
using System.Linq;
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
                    await UpdateAuctionStatusesAsync(stoppingToken);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error al actualizar estados de subastas en background.");
                }

                await Task.Delay(TimeSpan.FromSeconds(10), stoppingToken);
            }
        }

        private async Task UpdateAuctionStatusesAsync(CancellationToken cancellationToken)
        {
            using var scope = _serviceProvider.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();

            var now = DateTime.UtcNow;

            var toActivate = await context.Auctions
                .Where(a => a.Status == "PROGRAMADA" && a.StartDate <= now)
                .ToListAsync(cancellationToken);

            foreach (var auction in toActivate)
            {
                auction.Status = "ACTIVA";
                _logger.LogInformation("Subasta #{Id} ({Title}) cambió a ACTIVA.", auction.Id, auction.Title);
            }

            var toClose = await context.Auctions
                .Where(a => a.Status == "ACTIVA" && a.EndDate <= now)
                .ToListAsync(cancellationToken);

            foreach (var auction in toClose)
            {
                auction.Status = "FINALIZADA";
                _logger.LogInformation("Subasta #{Id} ({Title}) cambió a FINALIZADA.", auction.Id, auction.Title);
            }

            if (toActivate.Any() || toClose.Any())
            {
                await context.SaveChangesAsync(cancellationToken);
            }
        }
    }
}
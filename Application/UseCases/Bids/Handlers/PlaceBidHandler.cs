
using Application.Interfaces;
using Application.UseCases.Bids.Commands;
using Domain.Entities;
using Domain.Exceptions;
using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace Application.UseCases.Bids.Handlers
{
    public class PlaceBidHandler
    {
        private readonly IAuctionRepository _auctionRepository;
        private readonly IBidRepository _bidRepository;
        private readonly IWalletRepository _walletRepository;
        private readonly IUnitOfWork _unitOfWork;

        public PlaceBidHandler(
            IAuctionRepository auctionRepository,
            IBidRepository bidRepository,
            IWalletRepository walletRepository,
            IUnitOfWork unitOfWork)
        {
            _auctionRepository = auctionRepository;
            _bidRepository = bidRepository;
            _walletRepository = walletRepository;
            _unitOfWork = unitOfWork;
        }

        public async Task<int> HandleAsync(PlaceBidCommand command, CancellationToken cancellationToken = default)
        {
            var dto = command.Dto;

            var auction = await _auctionRepository.GetByIdAsync(dto.AuctionId, cancellationToken);
            if (auction == null)
            {
                throw new NotFoundException($"La subasta con ID '{dto.AuctionId}' no existe.");
            }

            var now = DateTime.UtcNow;
            if (auction.Status != "ACTIVA" || now < auction.StartDate || now > auction.EndDate)
            {
                throw new InvalidOperationException("La subasta no está activa o se encuentra fuera de su horario permitido.");
            }

            if (auction.SellerId == command.BuyerId)
            {
                throw new InvalidOperationException("El vendedor no puede pujar en su propia subasta.");
            }

            if (auction.Version != dto.ExpectedVersion)
            {
                throw new ConcurrencyConflictException("La subasta ha sido actualizada por otra oferta. Por favor, recargá la página.");
            }

            var highestBid = await _bidRepository.GetHighestBidAsync(dto.AuctionId, cancellationToken);

            decimal minimumAllowedAmount;
            if (highestBid == null)
            {
                minimumAllowedAmount = auction.StartingPrice;
            }
            else
            {
                if (highestBid.BuyerId == command.BuyerId)
                {
                    throw new InvalidOperationException("Ya sos el máximo postor en esta subasta.");
                }

                minimumAllowedAmount = highestBid.Amount + auction.MinimumIncrement;
            }

            if (dto.Amount < minimumAllowedAmount)
            {
                throw new InvalidAmountException($"El monto ofertado (${dto.Amount}) debe ser igual o superior a ${minimumAllowedAmount}.");
            }

            var buyerWallet = await _walletRepository.GetByUserIdAsync(command.BuyerId, cancellationToken);
            if (buyerWallet == null)
            {
                throw new NotFoundException("No se encontró la billetera del comprador.");
            }

            if (buyerWallet.AvailableBalance < dto.Amount)
            {
                throw new InsufficientFundsException("Saldo insuficiente en la billetera para cubrir la oferta.");
            }

            buyerWallet.LockedBalance += dto.Amount;
            _walletRepository.Update(buyerWallet);

            if (highestBid != null)
            {
                var previousBidderWallet = await _walletRepository.GetByUserIdAsync(highestBid.BuyerId, cancellationToken);
                if (previousBidderWallet != null)
                {
                    previousBidderWallet.LockedBalance -= highestBid.Amount;
                    _walletRepository.Update(previousBidderWallet);
                }
            }

            var bid = new Bid
            {
                AuctionId = auction.Id,
                BuyerId = command.BuyerId,
                Amount = dto.Amount,
                BidDate = now
            };
            await _bidRepository.AddAsync(bid, cancellationToken);

            var utcEndDate = auction.EndDate.Kind == DateTimeKind.Unspecified
                ? DateTime.SpecifyKind(auction.EndDate, DateTimeKind.Utc)
                : auction.EndDate.ToUniversalTime();

            var remainingTime = utcEndDate - now;

            if (remainingTime > TimeSpan.Zero && remainingTime <= TimeSpan.FromMinutes(1))
            {
                auction.EndDate = DateTime.SpecifyKind(utcEndDate.AddMinutes(2), DateTimeKind.Utc);
            }

            auction.Version++;
            _auctionRepository.Update(auction);

            await _unitOfWork.SaveChangesAsync(cancellationToken);

            return bid.Id;
        }
    }
}
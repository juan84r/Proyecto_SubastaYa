using Application.Interfaces;
using Application.UseCases.Auctions.Commands;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Application.UseCases.Auctions.Handlers
{
    public class CloseExpiredAuctionsHandler
    {
        private readonly IAuctionRepository _auctionRepository;
        private readonly IBidRepository _bidRepository;
        private readonly IWalletRepository _walletRepository;
        private readonly IUnitOfWork _unitOfWork;

        public CloseExpiredAuctionsHandler(
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

        public async Task<int> HandleAsync(CloseExpiredAuctionsCommand command, CancellationToken cancellationToken = default)
        {
            var now = DateTime.UtcNow;

            var expiredAuctions = await _auctionRepository.GetAuctionsToCloseAsync(now, cancellationToken);

            if (expiredAuctions.Count == 0)
            {
                return 0;
            }

            int closedCount = 0;

            foreach (var auction in expiredAuctions)
            {
                var winningBid = await _bidRepository.GetHighestBidAsync(auction.Id, cancellationToken);

                if (winningBid != null)
                {
                    var winningBuyerWallet = await _walletRepository.GetByUserIdAsync(winningBid.BuyerId, cancellationToken);
                    var sellerWallet = await _walletRepository.GetByUserIdAsync(auction.SellerId, cancellationToken);

                    if (winningBuyerWallet != null && sellerWallet != null)
                    {
                        winningBuyerWallet.LockedBalance -= winningBid.Amount;
                        winningBuyerWallet.TotalBalance -= winningBid.Amount;
                        _walletRepository.Update(winningBuyerWallet);

                        sellerWallet.TotalBalance += winningBid.Amount;
                        _walletRepository.Update(sellerWallet);
                    }
                }

                auction.Status = "FINALIZADA";
                _auctionRepository.Update(auction);

                closedCount++;
            }

            await _unitOfWork.SaveChangesAsync(cancellationToken);

            return closedCount;
        }
    }
}

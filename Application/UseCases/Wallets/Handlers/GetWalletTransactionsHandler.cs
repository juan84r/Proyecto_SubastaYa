using Application.DTOs.Wallets;
using Application.Interfaces;
using Application.UseCases.Wallets.Queries;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace Application.UseCases.Wallets.Handlers
{
    public class GetWalletTransactionsHandler
    {
        private readonly IWalletRepository _walletRepository;

        public GetWalletTransactionsHandler(IWalletRepository walletRepository)
        {
            _walletRepository = walletRepository;
        }

        public async Task<IReadOnlyList<TransactionResponseDto>> HandleAsync(
            GetWalletTransactionsQuery query,
            CancellationToken cancellationToken = default)
        {
            var wallet = await _walletRepository.GetByUserIdWithTransactionsAsync(query.UserId, cancellationToken);

            if (wallet == null)
            {
                return new List<TransactionResponseDto>();
            }

            return wallet.Transactions
                .OrderByDescending(t => t.Date)
                .Select(t => new TransactionResponseDto
                {
                    Id = t.Id,
                    Type = t.Type,
                    Amount = t.Amount,
                    Date = t.Date,
                    AuctionId = t.AuctionId,
                    AuctionTitle = t.Auction?.Title ?? string.Empty
                })
                .ToList();
        }
    }
}
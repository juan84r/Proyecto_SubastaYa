using Domain.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Application.Interfaces
{
    public interface IBidRepository
    {
        Task<Bid?> GetHighestBidAsync(int auctionId, CancellationToken cancellationToken = default);
        Task<IReadOnlyList<Bid>> GetBidsByAuctionIdAsync(int auctionId, CancellationToken cancellationToken = default);
        Task AddAsync(Bid bid, CancellationToken cancellationToken = default);
    }
}

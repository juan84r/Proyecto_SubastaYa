using Domain.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Application.Interfaces
{
    public interface IAuctionRepository
    {
        Task<Auction?> GetByIdAsync(int id, CancellationToken cancellationToken = default);
        Task<Auction?> GetByIdWithBidsAsync(int id, CancellationToken cancellationToken = default);
        Task<IReadOnlyList<Auction>> GetActiveAuctionsAsync(CancellationToken cancellationToken = default);
        Task<IReadOnlyList<Auction>> GetAuctionsToCloseAsync(DateTime currentDate, CancellationToken cancellationToken = default);
        Task AddAsync(Auction auction, CancellationToken cancellationToken = default);
        void Update(Auction auction);
    }
}

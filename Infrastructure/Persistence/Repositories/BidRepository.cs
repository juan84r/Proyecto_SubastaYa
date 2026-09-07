using Application.Interfaces;
using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Infrastructure.Persistence.Repositories
{
    public class BidRepository : IBidRepository
    {
        private readonly AppDbContext _context;

        public BidRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<Bid?> GetHighestBidAsync(int auctionId, CancellationToken cancellationToken = default)
        {
            return await _context.Bids
                .Include(b => b.Buyer)
                .Where(b => b.AuctionId == auctionId)
                .OrderByDescending(b => b.Amount)
                .FirstOrDefaultAsync(cancellationToken);
        }

        public async Task<IReadOnlyList<Bid>> GetBidsByAuctionIdAsync(int auctionId, CancellationToken cancellationToken = default)
        {
            return await _context.Bids
                .AsNoTracking()
                .Include(b => b.Buyer)
                .Where(b => b.AuctionId == auctionId)
                .OrderByDescending(b => b.BidDate)
                .ToListAsync(cancellationToken);
        }

        public async Task AddAsync(Bid bid, CancellationToken cancellationToken = default)
        {
            await _context.Bids.AddAsync(bid, cancellationToken);
        }
    }
}
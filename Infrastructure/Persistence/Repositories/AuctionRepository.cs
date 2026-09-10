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
    public class AuctionRepository : IAuctionRepository
    {
        private readonly AppDbContext _context;

        public AuctionRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<Auction?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
        {
            return await _context.Auctions
                .Include(a => a.Seller)
                .Include(a => a.Category)
                .FirstOrDefaultAsync(a => a.Id == id, cancellationToken);
        }

        public async Task<Auction?> GetByIdWithBidsAsync(int id, CancellationToken cancellationToken = default)
        {
            return await _context.Auctions
                .Include(a => a.Seller)
                .Include(a => a.Category)
                .Include(a => a.Bids.OrderByDescending(b => b.Amount))
                .FirstOrDefaultAsync(a => a.Id == id, cancellationToken);
        }

        public async Task<IReadOnlyList<Auction>> GetActiveAuctionsAsync(CancellationToken cancellationToken = default)
        {
            return await _context.Auctions
                .AsNoTracking()
                .Include(a => a.Category)
                .Where(a => a.Status == "ACTIVE")
                .OrderByDescending(a => a.StartDate)
                .ToListAsync(cancellationToken);
        }

        public async Task<IReadOnlyList<Auction>> GetAuctionsToCloseAsync(DateTime currentDate, CancellationToken cancellationToken = default)
        {
            return await _context.Auctions
                .Where(a => a.Status == "ACTIVA" && a.EndDate <= currentDate)
                .ToListAsync(cancellationToken);
        }

        public async Task AddAsync(Auction auction, CancellationToken cancellationToken = default)
        {
            await _context.Auctions.AddAsync(auction, cancellationToken);
        }

        public void Update(Auction auction)
        {
            _context.Auctions.Update(auction);
        }
    }
}
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
	public class WalletRepository : IWalletRepository
	{
		private readonly AppDbContext _context;

		public WalletRepository(AppDbContext context)
		{
			_context = context;
		}

		public async Task<Wallet?> GetByUserIdAsync(int userId, CancellationToken cancellationToken = default)
		{
			return await _context.Wallets
				.FirstOrDefaultAsync(w => w.UserId == userId, cancellationToken);
		}

		public async Task AddAsync(Wallet wallet, CancellationToken cancellationToken = default)
		{
			await _context.Wallets.AddAsync(wallet, cancellationToken);
		}

		public void Update(Wallet wallet)
		{
			_context.Wallets.Update(wallet);
		}
	}
}
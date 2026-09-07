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
	public class UserRepository : IUserRepository
	{
		private readonly AppDbContext _context;

		public UserRepository(AppDbContext context)
		{
			_context = context;
		}

		public async Task<User?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
		{
			return await _context.Users
				.Include(u => u.Wallet)
				.FirstOrDefaultAsync(u => u.Id == id, cancellationToken);
		}

		public async Task<User?> GetByEmailAsync(string email, CancellationToken cancellationToken = default)
		{
			return await _context.Users
				.FirstOrDefaultAsync(u => u.Email == email, cancellationToken);
		}

		public async Task<bool> ExistsByEmailAsync(string email, CancellationToken cancellationToken = default)
		{
			return await _context.Users
				.AnyAsync(u => u.Email == email, cancellationToken);
		}

		public async Task AddAsync(User user, CancellationToken cancellationToken = default)
		{
			await _context.Users.AddAsync(user, cancellationToken);
		}
	}
}
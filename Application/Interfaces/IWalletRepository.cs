using Domain.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Application.Interfaces
{
	public interface IWalletRepository
	{
		Task<Wallet?> GetByUserIdAsync(int userId, CancellationToken cancellationToken = default);
		Task AddAsync(Wallet wallet, CancellationToken cancellationToken = default);
		void Update(Wallet wallet);
	}
}
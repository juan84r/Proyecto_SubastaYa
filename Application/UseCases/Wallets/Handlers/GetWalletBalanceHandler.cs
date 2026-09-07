using Application.DTOs.Wallets;
using Application.Interfaces;
using Application.UseCases.Wallets.Queries;
using Domain.Exceptions;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Application.UseCases.Wallets.Handlers
{
	public class GetWalletBalanceHandler
	{
		private readonly IWalletRepository _walletRepository;

		public GetWalletBalanceHandler(IWalletRepository walletRepository)
		{
			_walletRepository = walletRepository;
		}

		public async Task<WalletResponseDto> HandleAsync(GetWalletBalanceQuery query, CancellationToken cancellationToken = default)
		{
			var wallet = await _walletRepository.GetByUserIdAsync(query.UserId, cancellationToken);

			if (wallet == null)
			{
				throw new NotFoundException($"No se encontró la billetera para el usuario con ID '{query.UserId}'.");
			}

			return new WalletResponseDto
			{
				Id = wallet.Id,
				UserId = wallet.UserId,
				TotalBalance = wallet.TotalBalance,
				LockedBalance = wallet.LockedBalance,
				AvailableBalance = wallet.AvailableBalance
			};
		}
	}
}
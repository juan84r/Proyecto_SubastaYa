using Application.Interfaces;
using Application.UseCases.Wallets.Commands;
using Domain.Exceptions;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Application.UseCases.Wallets.Handlers
{
	public class DepositFundsHandler
	{
		private readonly IWalletRepository _walletRepository;
		private readonly IUnitOfWork _unitOfWork;

		public DepositFundsHandler(IWalletRepository walletRepository, IUnitOfWork unitOfWork)
		{
			_walletRepository = walletRepository;
			_unitOfWork = unitOfWork;
		}

		public async Task<decimal> HandleAsync(DepositFundsCommand command, CancellationToken cancellationToken = default)
		{
			if (command.Dto.Amount <= 0)
			{
				throw new InvalidAmountException("El monto a depositar debe ser mayor a cero.");
			}

			var wallet = await _walletRepository.GetByUserIdAsync(command.UserId, cancellationToken);

			if (wallet == null)
			{
				throw new NotFoundException($"No se encontró la billetera para el usuario con ID '{command.UserId}'.");
			}

			wallet.TotalBalance += command.Dto.Amount;
			_walletRepository.Update(wallet);

			await _unitOfWork.SaveChangesAsync(cancellationToken);

			return wallet.TotalBalance;
		}
	}
}
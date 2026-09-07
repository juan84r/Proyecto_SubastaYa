using Application.DTOs.Wallets;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Application.UseCases.Wallets.Commands
{
	public class DepositFundsCommand
	{
		public DepositFundsRequestDto Dto { get; }
		public int UserId { get; }

		public DepositFundsCommand(DepositFundsRequestDto dto, int userId)
		{
			Dto = dto;
			UserId = userId;
		}
	}
}
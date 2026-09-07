using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Application.UseCases.Wallets.Queries
{
	public class GetWalletBalanceQuery
	{
		public int UserId { get; }

		public GetWalletBalanceQuery(int userId)
		{
			UserId = userId;
		}
	}
}
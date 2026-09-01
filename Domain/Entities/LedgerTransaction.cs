using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Domain.Entities
{
	public class LedgerTransaction
	{
		public int Id { get; set; }
		public int WalletId { get; set; }
		public string Type { get; set; } = string.Empty;
		public decimal Amount { get; set; }
		public DateTime Date { get; set; }
		public int? AuctionId { get; set; }
		public Wallet Wallet { get; set; } = null!;
		public Auction? Auction { get; set; }
	}
}

using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Domain.Entities
{
	internal class Wallet
	{
		public int Id { get; set; }
		public int UserId { get; set; }
		public decimal TotalBalance { get; set; }
		public decimal LockedBalance { get; set; }
		public decimal AvailableBalance => TotalBalance - LockedBalance;
		public int Version { get; set; }
		public User User { get; set; } = null!;
		public ICollection<LedgerTransaction> Transactions { get; set; } = new List<LedgerTransaction>();
	}
}

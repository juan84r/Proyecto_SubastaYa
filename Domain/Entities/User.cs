using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Domain.Entities
{
	internal class User
	{
		public int Id { get; set; }
		public string Email { get; set; } = string.Empty;
		public string Name { get; set; } = string.Empty;
		public string PasswordHash { get; set; } = string.Empty;
		public DateTime RegistrationDate { get; set; }
		public Wallet? Wallet { get; set; }
		public ICollection<Auction> PublishedAuctions { get; set; } = new List<Auction>();
		public ICollection<Bid> Bids { get; set; } = new List<Bid>();
		public ICollection<AudithLog> AudithLogs { get; set; } = new List<AudithLog>();
	}
}

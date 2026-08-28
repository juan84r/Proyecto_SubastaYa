using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;

namespace Domain.Entities
{
    public class Auction
    {
        public int Id { get; set; }
        public int SellerId { get; set; }
        public int CategoryId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string ImageUrl { get; set; } = string.Empty;
        public decimal StartingPrice { get; set; }
        public decimal MinimumIncrement { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public AuctionStatus Status { get; set; }
        public byte[] Version { get; set; } = Array.Empty<byte>();
        public Category Category { get; set; } = null!;
        public ICollection<Bid> Bids { get; set; } = new List<Bid>();
    }
}

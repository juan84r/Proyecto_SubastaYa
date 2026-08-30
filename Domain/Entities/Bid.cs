using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Domain.Entities
{
    public class Bid
    {
        public int Id { get; set; } 
        public int AuctionId { get; set; } 
        public int BuyerId { get; set; } 
        public decimal Amount { get; set; } 
        public DateTime BidDate { get; set; }
        public Auction Auction { get; set; } = null!;
        public User Buyer { get; set; } = null!;

    }
}
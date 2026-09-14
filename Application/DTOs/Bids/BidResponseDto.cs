using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Application.DTOs.Bids
{
    public class BidResponseDto
    {
        public int Id { get; set; }
        public int AuctionId { get; set; }
        public int BuyerId { get; set; }
        public string BuyerName { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public DateTime BidDate { get; set; }
    }
}
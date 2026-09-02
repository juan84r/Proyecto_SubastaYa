using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Application.DTOs.Bids
{
    public class PlaceBidRequestDto
    {
        public int AuctionId { get; set; }
        public decimal Amount { get; set; }
        public int ExpectedVersion { get; set; }
    }
}

using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Application.DTOs.Bids
{
    public class WalletResponseDto
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public decimal TotalBalance { get; set; }
        public decimal LockedBalance { get; set; }
        public decimal AvailableBalance { get; set; }
    }
}

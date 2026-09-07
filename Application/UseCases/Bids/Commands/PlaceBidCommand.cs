using Application.DTOs.Bids;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Application.UseCases.Bids.Commands
{
    public class PlaceBidCommand
    {
        public PlaceBidRequestDto Dto { get; }
        public int BuyerId { get; }

        public PlaceBidCommand(PlaceBidRequestDto dto, int buyerId)
        {
            Dto = dto;
            BuyerId = buyerId;
        }
    }
}

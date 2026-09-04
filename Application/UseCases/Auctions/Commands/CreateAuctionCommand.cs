using Application.DTOs.Auctions;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Application.UseCases.Auctions.Commands
{
	public class CreateAuctionCommand
	{
		public CreateAuctionRequestDto Dto { get; }
		public int SellerId { get; }

		public CreateAuctionCommand(CreateAuctionRequestDto dto, int sellerId)
		{
			Dto = dto;
			SellerId = sellerId;
		}
	}
}
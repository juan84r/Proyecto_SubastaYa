using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Application.UseCases.Auctions.Queries
{
	public class GetAuctionByIdQuery
	{
		public int AuctionId { get; }

		public GetAuctionByIdQuery(int auctionId)
		{
			AuctionId = auctionId;
		}
	}
}

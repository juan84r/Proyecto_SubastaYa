using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Application.UseCases.Auctions.Queries
{
	public class GetActiveAuctionsQuery
	{
		public int? CategoryId { get; }

		public GetActiveAuctionsQuery(int? categoryId = null)
		{
			CategoryId = categoryId;
		}
	}
}
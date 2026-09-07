using Application.DTOs.Auctions;
using Application.Interfaces;
using Application.UseCases.Auctions.Queries;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Application.UseCases.Auctions.Handlers
{
	public class GetActiveAuctionsHandler
	{
		private readonly IAuctionRepository _auctionRepository;

		public GetActiveAuctionsHandler(IAuctionRepository auctionRepository)
		{
			_auctionRepository = auctionRepository;
		}

		public async Task<IReadOnlyList<AuctionListResponseDto>> HandleAsync(
			GetActiveAuctionsQuery query, CancellationToken cancellationToken = default)
		{
			var auctions = await _auctionRepository.GetActiveAuctionsAsync(cancellationToken);

			if (query.CategoryId.HasValue)
			{
				auctions = auctions.Where(a => a.CategoryId == query.CategoryId.Value).ToList();
			}

			var response = auctions.Select(auction =>
			{
				var highestBid = auction.Bids.OrderByDescending(b => b.Amount).FirstOrDefault();
				var currentPrice = highestBid != null ? highestBid.Amount : auction.StartingPrice;

				return new AuctionListResponseDto
				{
					Id = auction.Id,                                       // Id
					Title = auction.Title,                                 // Titulo
					CurrentPrice = currentPrice,                           // Precio Actual
					EndDate = auction.EndDate,                             // Fecha de finalizacion
					Status = auction.Status,                               // Estado
					CategoryName = auction.Category?.Name ?? string.Empty, // Nombre de la categoria
					TotalBids = auction.Bids.Count                         // Total de ofertas (pujas)
				};
			}).ToList();

			return response;
		}
	}
}
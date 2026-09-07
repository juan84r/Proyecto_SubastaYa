using Application.DTOs.Auctions;
using Application.Interfaces;
using Application.UseCases.Auctions.Queries;
using Domain.Exceptions;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Application.UseCases.Auctions.Handlers
{
	public class GetAuctionByIdHandler
	{
		private readonly IAuctionRepository _auctionRepository;

		public GetAuctionByIdHandler(IAuctionRepository auctionRepository)
		{
			_auctionRepository = auctionRepository;
		}

		public async Task<AuctionDetailResponseDto> HandleAsync(
			GetAuctionByIdQuery query,
			CancellationToken cancellationToken = default)
		{
			var auction = await _auctionRepository.GetByIdWithBidsAsync(query.AuctionId, cancellationToken);

			if (auction == null)
			{
				throw new NotFoundException($"La subasta con ID '{query.AuctionId}' no fue encontrada.");
			}

			var highestBid = auction.Bids.OrderByDescending(b => b.Amount).FirstOrDefault();
			var currentPrice = highestBid != null ? highestBid.Amount : auction.StartingPrice;
			var highestBidderName = highestBid?.Buyer?.Name;

			return new AuctionDetailResponseDto
			{
				Id = auction.Id,                                         // Id
				Title = auction.Title,                                   // Titulo
				Description = auction.Description,                       // Descripcion
				StartingPrice = auction.StartingPrice,                   // Precio inicial
				CurrentPrice = currentPrice,                             // Precio actual
				MinimumIncrement = auction.MinimumIncrement,             // Minimo incremento
				StartDate = auction.StartDate,                           // Fecha de inicio
				EndDate = auction.EndDate,                               // Fecha de finalizacion
				Status = auction.Status,                                 // Estado
				Version = auction.Version,                               // Version
				SellerId = auction.SellerId,                             // Id del vendedor
				SellerName = auction.Seller?.Name ?? string.Empty,       // Nombre del vendedor
				CategoryId = auction.CategoryId,                         // Id de la categoria
				CategoryName = auction.Category?.Name ?? string.Empty,   // Nombre de la categoria
				HighestBidderName = highestBidderName                    // Nombre del mejor postor
			};
		}
	}
}
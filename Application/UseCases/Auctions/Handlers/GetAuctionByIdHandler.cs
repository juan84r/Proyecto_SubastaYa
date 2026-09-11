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
				Id = auction.Id,                                     
				Title = auction.Title,                                
				Description = auction.Description,                    
				ImageUrl = auction.ImageUrl,
				StartingPrice = auction.StartingPrice,              
				CurrentPrice = currentPrice,                          
				MinimumIncrement = auction.MinimumIncrement,           
				StartDate = auction.StartDate,                         
				EndDate = auction.EndDate,                            
				Status = auction.Status,                           
				Version = auction.Version,                              
				SellerId = auction.SellerId,                             
				SellerName = auction.Seller?.Name ?? string.Empty,       
				CategoryId = auction.CategoryId,                         
				CategoryName = auction.Category?.Name ?? string.Empty,   
				HighestBidderName = highestBidderName                    
			};
		}
	}
}
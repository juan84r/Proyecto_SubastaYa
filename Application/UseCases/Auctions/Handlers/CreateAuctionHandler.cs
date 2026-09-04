using Application.Interfaces;
using Application.UseCases.Auctions.Commands;
using Domain.Entities;
using Domain.Exceptions;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Application.UseCases.Auctions.Handlers
{
	public class CreateAuctionHandler
	{
		private readonly IAuctionRepository _auctionRepository;
		private readonly ICategoryRepository _categoryRepository;
		private readonly IUserRepository _userRepository;
		private readonly IUnitOfWork _unitOfWork;

		public CreateAuctionHandler(
			IAuctionRepository auctionRepository,
			ICategoryRepository categoryRepository,
			IUserRepository userRepository,
			IUnitOfWork unitOfWork)
		{
			_auctionRepository = auctionRepository;
			_categoryRepository = categoryRepository;
			_userRepository = userRepository;
			_unitOfWork = unitOfWork;
		}

		public async Task<int> HandleAsync(CreateAuctionCommand command, CancellationToken cancellationToken = default)
		{
			var dto = command.Dto;

			var categoryExists = await _categoryRepository.ExistsAsync(dto.CategoryId, cancellationToken);
			if (!categoryExists)
			{
				throw new NotFoundException($"La categoría con ID '{dto.CategoryId}' no existe.");
			}

			var seller = await _userRepository.GetByIdAsync(command.SellerId, cancellationToken);
			if (seller == null)
			{
				throw new NotFoundException($"El usuario vendedor con ID '{command.SellerId}' no fue encontrado.");
			}

			if (dto.StartingPrice <= 0m)
			{
				throw new InvalidAmountException("El precio inicial debe ser un monto mayor a cero.");
			}

			if (dto.MinimumIncrement <= 0m)
			{
				throw new InvalidAmountException("El incremento mínimo debe ser mayor a cero.");
			}

			if (dto.EndDate <= dto.StartDate)
			{
				throw new InvalidAuctionDateException("La fecha de finalización debe ser posterior a la fecha de inicio.");
			}

			var auction = new Auction
			{
				Title = dto.Title,
				Description = dto.Description,
				StartingPrice = dto.StartingPrice,
				MinimumIncrement = dto.MinimumIncrement,
				StartDate = dto.StartDate,
				EndDate = dto.EndDate,
				Status = dto.StartDate <= DateTime.UtcNow ? "ACTIVA" : "PROGRAMADA",
				SellerId = command.SellerId,
				CategoryId = dto.CategoryId,
				Version = 1
			};

			await _auctionRepository.AddAsync(auction, cancellationToken);
			await _unitOfWork.SaveChangesAsync(cancellationToken);

			return auction.Id;
		}
	}
}
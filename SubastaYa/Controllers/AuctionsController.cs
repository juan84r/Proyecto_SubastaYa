using System.Security.Claims;
using Application.DTOs.Auctions;
using Application.DTOs.Bids;
using Application.UseCases.Auctions.Commands;
using Application.UseCases.Auctions.Handlers;
using Application.UseCases.Auctions.Queries;
using Application.UseCases.Bids.Commands;
using Application.UseCases.Bids.Handlers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace SubastaYa.Controllers
{
	[ApiController]
	[Route("api/[controller]")]
	public class AuctionsController : ControllerBase
	{
		private readonly CreateAuctionHandler _createAuctionHandler;
		private readonly GetActiveAuctionsHandler _getActiveAuctionsHandler;
		private readonly GetAuctionByIdHandler _getAuctionByIdHandler;
		private readonly PlaceBidHandler _placeBidHandler;

		public AuctionsController(
			CreateAuctionHandler createAuctionHandler,
			GetActiveAuctionsHandler getActiveAuctionsHandler,
			GetAuctionByIdHandler getAuctionByIdHandler,
			PlaceBidHandler placeBidHandler)
		{
			_createAuctionHandler = createAuctionHandler;
			_getActiveAuctionsHandler = getActiveAuctionsHandler;
			_getAuctionByIdHandler = getAuctionByIdHandler;
			_placeBidHandler = placeBidHandler;
		}

        [HttpGet]
        [ProducesResponseType(StatusCodes.Status200OK)]
        public async Task<IActionResult> GetActive([FromQuery] int? categoryId, CancellationToken cancellationToken)
        {
            var query = new GetActiveAuctionsQuery(categoryId);
            var response = await _getActiveAuctionsHandler.HandleAsync(query, cancellationToken);
            return Ok(response);
        }

        [HttpGet("{id:int}")]
		[ProducesResponseType(StatusCodes.Status200OK)]
		[ProducesResponseType(StatusCodes.Status404NotFound)]
		public async Task<IActionResult> GetById(int id, CancellationToken cancellationToken)
		{
			var query = new GetAuctionByIdQuery(id);
			var response = await _getAuctionByIdHandler.HandleAsync(query, cancellationToken);
			return Ok(response);
		}

		[HttpPost]
		[Authorize]
		[ProducesResponseType(StatusCodes.Status201Created)]
		[ProducesResponseType(StatusCodes.Status400BadRequest)]
		[ProducesResponseType(StatusCodes.Status401Unauthorized)]
		public async Task<IActionResult> Create([FromBody] CreateAuctionRequestDto dto, CancellationToken cancellationToken)
		{
			var userId = GetCurrentUserId();
			var command = new CreateAuctionCommand(dto, userId);
			var response = await _createAuctionHandler.HandleAsync(command, cancellationToken);

			return StatusCode(StatusCodes.Status201Created, response);
		}

		[HttpPost("{id:int}/bids")]
		[Authorize]
		[ProducesResponseType(StatusCodes.Status200OK)]
		[ProducesResponseType(StatusCodes.Status400BadRequest)]
		[ProducesResponseType(StatusCodes.Status401Unauthorized)]
		[ProducesResponseType(StatusCodes.Status409Conflict)]
		[ProducesResponseType(StatusCodes.Status422UnprocessableEntity)]
		public async Task<IActionResult> PlaceBid(int id, [FromBody] PlaceBidRequestDto dto, CancellationToken cancellationToken)
		{
			var userId = GetCurrentUserId();
			dto.AuctionId = id;

			var command = new PlaceBidCommand(dto, userId);
			var response = await _placeBidHandler.HandleAsync(command, cancellationToken);

			return Ok(response);
		}

        [HttpPut("{id:int}")]
        [Authorize]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> Update(int id, [FromBody] CreateAuctionRequestDto dto, [FromServices] Infrastructure.Persistence.AppDbContext context, CancellationToken cancellationToken)
        {
            try
            {
                var userId = GetCurrentUserId();
                var auction = await context.Auctions.FindAsync(new object[] { id }, cancellationToken);

                if (auction == null)
                    return NotFound(new { message = "Subasta no encontrada." });

                if (auction.SellerId != userId)
                    return StatusCode(StatusCodes.Status403Forbidden, new { message = "No tenés permiso para modificar esta subasta." });

                if (auction.Status != "PROGRAMADA")
                    return BadRequest(new { message = "No podés modificar una subasta que ya inició o finalizó." });

                auction.Title = dto.Title;
                auction.Description = dto.Description;
                auction.ImageUrl = dto.ImageUrl ?? string.Empty;
                auction.StartingPrice = dto.StartingPrice;
                auction.MinimumIncrement = dto.MinimumIncrement;
                auction.StartDate = dto.StartDate;
                auction.EndDate = dto.EndDate;
                auction.CategoryId = dto.CategoryId;

                await context.SaveChangesAsync(cancellationToken);
                return Ok(new { message = "Subasta actualizada exitosamente." });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.InnerException?.Message ?? ex.Message });
            }
        }

        [HttpDelete("{id:int}")]
        [Authorize]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> Delete(int id, [FromServices] Infrastructure.Persistence.AppDbContext context, CancellationToken cancellationToken)
        {
            try
            {
                var userId = GetCurrentUserId();
                var auction = await context.Auctions.FindAsync(new object[] { id }, cancellationToken);

                if (auction == null)
                    return NotFound(new { message = "Subasta no encontrada." });

                if (auction.SellerId != userId)
                    return StatusCode(StatusCodes.Status403Forbidden, new { message = "No tenés permiso para eliminar esta subasta." });

                if (auction.Status != "PROGRAMADA")
                    return BadRequest(new { message = "No podés eliminar una subasta que ya se encuentra activa o finalizada." });

                context.Auctions.Remove(auction);
                await context.SaveChangesAsync(cancellationToken);

                return Ok(new { message = "Subasta eliminada exitosamente." });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.InnerException?.Message ?? ex.Message });
            }
        }

        private int GetCurrentUserId()
		{
			var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
						?? User.FindFirst(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub)?.Value
						?? User.FindFirst("sub")?.Value;

			if (string.IsNullOrEmpty(claim) || !int.TryParse(claim, out int userId))
			{
				throw new UnauthorizedAccessException("Usuario no autenticado o token inválido.");
			}
			return userId;
		}
	}
}
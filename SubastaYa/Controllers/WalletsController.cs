using System.Security.Claims;
using Application.DTOs.Wallets;
using Application.UseCases.Wallets.Commands;
using Application.UseCases.Wallets.Handlers;
using Application.UseCases.Wallets.Queries;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace SubastaYa.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class WalletsController : ControllerBase
    {
        private readonly GetWalletBalanceHandler _getBalanceHandler;
        private readonly DepositFundsHandler _depositFundsHandler;
        private readonly GetWalletTransactionsHandler _getTransactionsHandler;

        public WalletsController(
            GetWalletBalanceHandler getBalanceHandler,
            DepositFundsHandler depositFundsHandler,
            GetWalletTransactionsHandler getTransactionsHandler)
        {
            _getBalanceHandler = getBalanceHandler;
            _depositFundsHandler = depositFundsHandler;
            _getTransactionsHandler = getTransactionsHandler;
        }

        [HttpGet("me")]
        [ProducesResponseType(typeof(WalletResponseDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetMyBalance(CancellationToken cancellationToken)
        {
            var userId = GetCurrentUserId();
            var query = new GetWalletBalanceQuery(userId);
            var response = await _getBalanceHandler.HandleAsync(query, cancellationToken);

            return Ok(response);
        }

        [HttpPost("recharge")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<IActionResult> Recharge([FromBody] DepositFundsRequestDto dto, CancellationToken cancellationToken)
        {
            var userId = GetCurrentUserId();
            var command = new DepositFundsCommand(dto, userId);
            var newTotalBalance = await _depositFundsHandler.HandleAsync(command, cancellationToken);

            return Ok(new
            {
                message = "Fondos acreditados exitosamente.",
                totalBalance = newTotalBalance
            });
        }

        [HttpGet("transactions")]
        [ProducesResponseType(typeof(IReadOnlyList<TransactionResponseDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<IActionResult> GetMyTransactions(CancellationToken cancellationToken)
        {
            var userId = GetCurrentUserId();
            var query = new GetWalletTransactionsQuery(userId);
            var response = await _getTransactionsHandler.HandleAsync(query, cancellationToken);

            return Ok(response);
        }

        private int GetCurrentUserId()
        {
            var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                        ?? User.FindFirst("sub")?.Value;

            if (string.IsNullOrEmpty(claim) || !int.TryParse(claim, out int userId))
            {
                throw new UnauthorizedAccessException("Usuario no autenticado o token inválido.");
            }
            return userId;
        }
    }
}
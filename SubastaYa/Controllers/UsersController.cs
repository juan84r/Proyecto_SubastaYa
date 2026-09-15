using Application.DTOs.Users;
using Application.UseCases.Users.Commands;
using Application.UseCases.Users.Handlers;
using Domain.Exceptions;
using Microsoft.AspNetCore.Mvc;

namespace SubastaYa.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UsersController : ControllerBase
    {
        private readonly RegisterUserHandler _registerHandler;
        private readonly LoginHandler _loginHandler;

        public UsersController(
            RegisterUserHandler registerHandler,
            LoginHandler loginHandler)
        {
            _registerHandler = registerHandler;
            _loginHandler = loginHandler;
        }

        [HttpPost("register")]
        [ProducesResponseType(typeof(AuthResponseDto), StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status409Conflict)]
        public async Task<IActionResult> Register([FromBody] RegisterUserRequestDto dto, CancellationToken cancellationToken)
        {
            try
            {
                var command = new RegisterUserCommand(dto);
                var response = await _registerHandler.HandleAsync(command, cancellationToken);

                return StatusCode(StatusCodes.Status201Created, response);
            }
            catch (UserAlreadyExistsException ex)
            {
                return Conflict(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("login")]
        [ProducesResponseType(typeof(AuthResponseDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<IActionResult> Login([FromBody] LoginRequestDto dto, CancellationToken cancellationToken)
        {
            try
            {
                var command = new LoginCommand(dto);
                var response = await _loginHandler.HandleAsync(command, cancellationToken);

                return Ok(response);
            }
            catch (InvalidCredentialsException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}
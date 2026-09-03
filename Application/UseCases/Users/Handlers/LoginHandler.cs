using Application.DTOs.Users;
using Application.Interfaces;
using Application.UseCases.Users.Commands;
using Domain.Exceptions;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Application.UseCases.Users.Handlers
{
    public class LoginHandler
    {
        private readonly IUserRepository _userRepository;
        private readonly IPasswordHasher _passwordHasher;
        private readonly IJwtProvider _jwtProvider;

        public LoginHandler(
            IUserRepository userRepository,
            IPasswordHasher passwordHasher,
            IJwtProvider jwtProvider)
        {
            _userRepository = userRepository;
            _passwordHasher = passwordHasher;
            _jwtProvider = jwtProvider;
        }

        public async Task<AuthResponseDto> HandleAsync(LoginCommand command, CancellationToken cancellationToken = default)
        {
            var dto = command.Dto;

            var user = await _userRepository.GetByEmailAsync(dto.Email, cancellationToken);
            if (user == null)
            {
                throw new InvalidCredentialsException("Las credenciales proporcionadas son incorrectas.");
            }

            var isPasswordValid = _passwordHasher.VerifyPassword(dto.Password, user.PasswordHash);
            if (!isPasswordValid)
            {
                throw new InvalidCredentialsException("Las credenciales proporcionadas son incorrectas.");
            }

            var token = _jwtProvider.GenerateToken(user);

            return new AuthResponseDto
            {
                Id = user.Id,
                Email = user.Email,
                Name = user.Name,
                Token = token
            };
        }
    }
}

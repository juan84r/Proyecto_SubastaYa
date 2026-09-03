using Application.DTOs.Users;
using Application.Interfaces;
using Application.UseCases.Users.Commands;
using Domain.Entities;
using Domain.Exceptions;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Application.UseCases.Users.Handlers
{
    public class RegisterUserHandler
    {
        private readonly IUserRepository _userRepository;
        private readonly IWalletRepository _walletRepository;
        private readonly IUnitOfWork _unitOfWork;
        private readonly IPasswordHasher _passwordHasher;
        private readonly IJwtProvider _jwtProvider;

        public RegisterUserHandler(
            IUserRepository userRepository,
            IWalletRepository walletRepository,
            IUnitOfWork unitOfWork,
            IPasswordHasher passwordHasher,
            IJwtProvider jwtProvider)
        {
            _userRepository = userRepository;
            _walletRepository = walletRepository;
            _unitOfWork = unitOfWork;
            _passwordHasher = passwordHasher;
            _jwtProvider = jwtProvider;
        }

        public async Task<AuthResponseDto> HandleAsync(RegisterUserCommand command, CancellationToken cancellationToken = default)
        {
            var dto = command.Dto;

            var emailExists = await _userRepository.ExistsByEmailAsync(dto.Email, cancellationToken);
            if (emailExists)
            {
                throw new UserAlreadyExistsException($"El correo electrónico '{dto.Email}' ya se encuentra registrado en el sistema.");
            }

            var passwordHash = _passwordHasher.HashPassword(dto.Password);

            var user = new User
            {
                Email = dto.Email,
                Name = dto.Name,
                PasswordHash = passwordHash,
                RegistrationDate = DateTime.UtcNow
            };

            await _userRepository.AddAsync(user, cancellationToken);

            var wallet = new Wallet
            {
                User = user,
                TotalBalance = 0m,
                LockedBalance = 0m,
                Version = 1
            };

            await _walletRepository.AddAsync(wallet, cancellationToken);

            await _unitOfWork.SaveChangesAsync(cancellationToken);

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

using Application.DTOs.Users;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Application.UseCases.Users.Commands
{
    public class RegisterUserCommand
    {
        public RegisterUserRequestDto Dto { get; }

        public RegisterUserCommand(RegisterUserRequestDto dto)
        {
            Dto = dto;
        }
    }
}

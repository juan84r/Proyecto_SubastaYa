using Application.DTOs.Users;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Application.UseCases.Users.Commands
{
    public class LoginCommand
    {
        public LoginRequestDto Dto { get; }

        public LoginCommand(LoginRequestDto dto)
        {
            Dto = dto;
        }
    }
}

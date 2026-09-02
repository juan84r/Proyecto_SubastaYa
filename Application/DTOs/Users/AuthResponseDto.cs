using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Application.DTOs.Users
{
	public class AuthResponseDto
	{
		public int Id { get; set; }
		public string Email { get; set; } = string.Empty;
		public string Name { get; set; } = string.Empty;
		public string Token { get; set; } = string.Empty;
	}
}
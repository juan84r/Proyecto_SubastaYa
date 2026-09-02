using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Application.DTOs.Users
{
	public class UserResponseDto
	{
		public int Id { get; set; }
		public string Email { get; set; } = string.Empty;
		public string Name { get; set; } = string.Empty;
		public DateTime RegistrationDate { get; set; }
	}
}
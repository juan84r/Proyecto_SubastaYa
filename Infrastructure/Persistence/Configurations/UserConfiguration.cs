using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Infrastructure.Persistence.Configurations
{
	public class UserConfiguration : IEntityTypeConfiguration<User>
	{
		public void Configure(EntityTypeBuilder<User> builder)
		{
			builder.ToTable("Users");

			builder.HasKey(u => u.Id);

			builder.Property(u => u.Name)
				.IsRequired()
				.HasMaxLength(100);

			builder.Property(u => u.Email)
				.IsRequired()
				.HasMaxLength(150);

			builder.HasIndex(u => u.Email)
				.IsUnique();

			builder.Property(u => u.PasswordHash)
				.IsRequired();

			builder.Property(u => u.RegistrationDate)
				.IsRequired();

			builder.HasOne(u => u.Wallet)
				.WithOne(w => w.User)
				.HasForeignKey<Wallet>(w => w.UserId)
				.OnDelete(DeleteBehavior.Cascade);
		}
	}
}
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
	public class WalletConfiguration : IEntityTypeConfiguration<Wallet>
	{
		public void Configure(EntityTypeBuilder<Wallet> builder)
		{
			builder.ToTable("Wallets");

			builder.HasKey(w => w.Id);

			builder.Property(w => w.TotalBalance)
				.HasColumnType("numeric(18,2)")
				.IsRequired()
				.HasDefaultValue(0.00m);

			builder.Property(w => w.LockedBalance)
				.HasColumnType("numeric(18,2)")
				.IsRequired()
				.HasDefaultValue(0.00m);

			builder.Ignore(w => w.AvailableBalance);

			builder.Property(w => w.Version)
				.IsRequired()
				.HasDefaultValue(0);

			builder.HasOne(w => w.User)
				.WithOne(u => u.Wallet)
				.HasForeignKey<Wallet>(w => w.UserId)
				.OnDelete(DeleteBehavior.Cascade);

			builder.HasIndex(w => w.UserId)
				.IsUnique();
		}
	}
}
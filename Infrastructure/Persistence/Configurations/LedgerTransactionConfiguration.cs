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
	public class LedgerTransactionConfiguration : IEntityTypeConfiguration<LedgerTransaction>
	{
		public void Configure(EntityTypeBuilder<LedgerTransaction> builder)
		{
			builder.ToTable("LedgerTransactions");

			builder.HasKey(lt => lt.Id);

			builder.Property(lt => lt.Type)
				.IsRequired()
				.HasMaxLength(30);

			builder.Property(lt => lt.Amount)
				.HasColumnType("numeric(18,2)")
				.IsRequired();

			builder.Property(lt => lt.Date)
				.IsRequired();

			builder.HasOne(lt => lt.Wallet)
				.WithMany(w => w.Transactions)
				.HasForeignKey(lt => lt.WalletId)
				.OnDelete(DeleteBehavior.Restrict);

			builder.HasOne(lt => lt.Auction)
				.WithMany(a => a.Transactions)
				.HasForeignKey(lt => lt.AuctionId)
				.IsRequired(false)
				.OnDelete(DeleteBehavior.Restrict);

			builder.HasIndex(lt => new { lt.WalletId, lt.Date });
			builder.HasIndex(lt => lt.AuctionId);
		}
	}
}
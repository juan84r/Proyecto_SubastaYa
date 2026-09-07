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
    public class BidConfiguration : IEntityTypeConfiguration<Bid>
    {
        public void Configure(EntityTypeBuilder<Bid> builder)
        {
            builder.ToTable("Bids");

            builder.HasKey(b => b.Id);

            builder.Property(b => b.Amount)
                .HasColumnType("numeric(18,2)")
                .IsRequired();

            builder.Property(b => b.BidDate)
                .IsRequired();

            builder.HasOne(b => b.Auction)
                .WithMany(a => a.Bids)
                .HasForeignKey(b => b.AuctionId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.HasOne(b => b.Buyer)
                .WithMany(u => u.Bids)
                .HasForeignKey(b => b.BuyerId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.HasIndex(b => b.AuctionId);
        }
    }
}
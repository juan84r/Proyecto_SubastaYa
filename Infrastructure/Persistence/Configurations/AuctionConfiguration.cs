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
    public class AuctionConfiguration : IEntityTypeConfiguration<Auction>
    {
        public void Configure(EntityTypeBuilder<Auction> builder)
        {
            builder.ToTable("Auctions");

            builder.HasKey(a => a.Id);

            builder.Property(a => a.Title)
                .IsRequired()
                .HasMaxLength(150);

            builder.Property(a => a.Description)
                .IsRequired()
                .HasMaxLength(1000);

            builder.Property(a => a.ImageUrl)
                .HasMaxLength(500);

            builder.Property(a => a.Status)
                .IsRequired()
                .HasMaxLength(20)
                .HasDefaultValue("PROGRAMADA");

            builder.Property(a => a.Version)
                .IsRequired()
                .HasDefaultValue(0);

            builder.Property(a => a.StartingPrice)
                .HasColumnType("numeric(18,2)")
                .IsRequired();

            builder.Property(a => a.MinimumIncrement)
                .HasColumnType("numeric(18,2)")
                .IsRequired();

            builder.Property(a => a.StartDate)
                .IsRequired();

            builder.Property(a => a.EndDate)
                .IsRequired();
        
            builder.HasOne(a => a.Seller)
                .WithMany(u => u.PublishedAuctions)
                .HasForeignKey(a => a.SellerId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.HasOne(a => a.Category)
                .WithMany()
                .HasForeignKey(a => a.CategoryId)
                .OnDelete(DeleteBehavior.Restrict); 
        }
    }
}
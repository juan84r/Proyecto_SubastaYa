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
    public class AudithLogConfiguration : IEntityTypeConfiguration<AudithLog>
    {
        public void Configure(EntityTypeBuilder<AudithLog> builder)
        {
            builder.ToTable("AudithLogs");

            builder.HasKey(a => a.Id);

            builder.Property(a => a.Entity)
                .IsRequired()
                .HasMaxLength(50);

            builder.Property(a => a.EntityId)
                .IsRequired();

            builder.Property(a => a.Action)
                .IsRequired()
                .HasMaxLength(100);

            builder.Property(a => a.DetailJson)
                .HasColumnType("jsonb")
                .IsRequired();

            builder.Property(a => a.Date)
                .IsRequired();

            builder.HasOne(a => a.User)
                .WithMany(u => u.AudithLogs)
                .HasForeignKey(a => a.UserId)
                .IsRequired(false)
                .OnDelete(DeleteBehavior.SetNull);

            builder.HasIndex(a => new { a.Entity, a.EntityId });
            builder.HasIndex(a => a.Date);
        }
    }
}

using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations
{
    public class CategoryConfiguration : IEntityTypeConfiguration<Category>
    {
        public void Configure(EntityTypeBuilder<Category> builder)
        {
            builder.ToTable("Categories");

            builder.HasKey(c => c.Id);

            builder.Property(c => c.Name)
                .IsRequired()
                .HasMaxLength(100);

            builder.HasIndex(c => c.Name)
                .IsUnique();

            builder.Property(c => c.IconUrl)
                .HasMaxLength(500);

            builder.HasMany(c => c.Auctions)
                .WithOne(a => a.Category)
                .HasForeignKey(a => a.CategoryId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.HasData(
                new Category { Id = 1, Name = "Vehículos", IconUrl = "https://cdn-icons-png.flaticon.com/512/743/743912.png" },
                new Category { Id = 2, Name = "Tecnología", IconUrl = "https://cdn-icons-png.flaticon.com/512/689/689396.png" },
                new Category { Id = 3, Name = "Hogar y Muebles", IconUrl = "https://cdn-icons-png.flaticon.com/512/2933/2933758.png" },
                new Category { Id = 4, Name = "Arte y Antigüedades", IconUrl = "https://cdn-icons-png.flaticon.com/512/1048/1048953.png" },
                new Category { Id = 5, Name = "Joyas y Relojes", IconUrl = "https://cdn-icons-png.flaticon.com/512/2611/2611152.png" },
                new Category { Id = 6, Name = "Moda y Accesorios", IconUrl = "https://cdn-icons-png.flaticon.com/512/3050/3050239.png" },
                new Category { Id = 7, Name = "Deportes y Fitness", IconUrl = "https://cdn-icons-png.flaticon.com/512/857/857455.png" },
                new Category { Id = 8, Name = "Inmuebles", IconUrl = "https://cdn-icons-png.flaticon.com/512/609/609803.png" },
                new Category { Id = 9, Name = "Otros", IconUrl = "https://cdn-icons-png.flaticon.com/512/570/570223.png" }
            );
        }
    }
}
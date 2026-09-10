using Application.Interfaces;
using Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Persistence
{
    public static class DbSeeder
    {
        public static async Task SeedAsync(DbContext context, IPasswordHasher passwordHasher)
        {
            await context.Database.MigrateAsync();

            if (await context.Set<User>().AnyAsync())
            {
                return;
            }

            var commonPasswordHash = passwordHasher.HashPassword("Password123!");
            var now = DateTime.UtcNow;

            var seller = new User
            {
                Name = "Official Seller",
                Email = "vendedor@test.com",
                PasswordHash = commonPasswordHash,
                RegistrationDate = now
            };

            var buyer1 = new User
            {
                Name = "Leading Buyer",
                Email = "comprador1@test.com",
                PasswordHash = commonPasswordHash,
                RegistrationDate = now
            };

            var buyer2 = new User
            {
                Name = "Enabled Buyer",
                Email = "comprador2@test.com",
                PasswordHash = commonPasswordHash,
                RegistrationDate = now
            };

            var unfundedBuyer = new User
            {
                Name = "Unfunded Buyer",
                Email = "sinfondos@test.com",
                PasswordHash = commonPasswordHash,
                RegistrationDate = now
            };

            await context.Set<User>().AddRangeAsync(seller, buyer1, buyer2, unfundedBuyer);
            await context.SaveChangesAsync();

            var sellerWallet = new Wallet
            {
                UserId = seller.Id,
                TotalBalance = 0m,
                LockedBalance = 0m,
                Version = 1
            };

            var buyer1Wallet = new Wallet
            {
                UserId = buyer1.Id,
                TotalBalance = 150000m,
                LockedBalance = 45000m, 
                Version = 1
            };

            var buyer2Wallet = new Wallet
            {
                UserId = buyer2.Id,
                TotalBalance = 200000m,
                LockedBalance = 0m,
                Version = 1
            };

            var unfundedWallet = new Wallet
            {
                UserId = unfundedBuyer.Id,
                TotalBalance = 500m,
                LockedBalance = 0m,
                Version = 1
            };

            await context.Set<Wallet>().AddRangeAsync(sellerWallet, buyer1Wallet, buyer2Wallet, unfundedWallet);
            await context.SaveChangesAsync();

            var standardAuction = new Auction
            {
                SellerId = seller.Id,
                CategoryId = 2,
                Title = "PlayStation 5 with 2 Controllers",
                Description = "Console in mint condition with original retail packaging.",
                ImageUrl = "https://images.unsplash.com/photo-1606813907291-d86efa9b94db",
                StartingPrice = 30000m,
                MinimumIncrement = 5000m,
                StartDate = now.AddHours(-1),
                EndDate = now.AddMinutes(25),
                Status = "ACTIVE",
                Version = 1
            };

            var criticalAuction = new Auction
            {
                SellerId = seller.Id,
                CategoryId = 2,
                Title = "iPhone 15 Pro Max 256GB",
                Description = "Closing soon, test anti-sniping dynamic time extension.",
                ImageUrl = "https://images.unsplash.com/photo-1695048133142-1a20484d2569",
                StartingPrice = 50000m,
                MinimumIncrement = 5000m,
                StartDate = now.AddMinutes(-50),
                EndDate = now.AddSeconds(90),
                Status = "ACTIVE",
                Version = 1
            };

            var upcomingAuction = new Auction
            {
                SellerId = seller.Id,
                CategoryId = 4,
                Title = "Signed Lionel Messi Argentina Jersey",
                Description = "Includes official Certificate of Authenticity (COA).",
                ImageUrl = "https://images.unsplash.com/photo-1522778119026-d647f0596c20",
                StartingPrice = 100000m,
                MinimumIncrement = 10000m,
                StartDate = now.AddHours(24),
                EndDate = now.AddHours(48),
                Status = "SCHEDULED",
                Version = 1
            };

            var expiredAuctionWithWinner = new Auction
            {
                SellerId = seller.Id,
                CategoryId = 2,
                Title = "MacBook Pro M2 16GB RAM",
                Description = "Past end time with winning bid, ready for background settlement.",
                ImageUrl = "https://images.unsplash.com/photo-1517336714731-489689fd1ca8",
                StartingPrice = 80000m,
                MinimumIncrement = 5000m,
                StartDate = now.AddHours(-4),
                EndDate = now.AddMinutes(-15),
                Status = "ACTIVE",
                Version = 1
            };

            var expiredAuctionDeserted = new Auction
            {
                SellerId = seller.Id,
                CategoryId = 3,
                Title = "Vintage Wooden Wall Clock",
                Description = "Past end time without any bids.",
                ImageUrl = "https://images.unsplash.com/photo-1563861826100-9cb868fdbe1c",
                StartingPrice = 15000m,
                MinimumIncrement = 1000m,
                StartDate = now.AddHours(-5),
                EndDate = now.AddHours(-1),
                Status = "ACTIVE",
                Version = 1
            };

            await context.Set<Auction>().AddRangeAsync(
                standardAuction,
                criticalAuction,
                upcomingAuction,
                expiredAuctionWithWinner,
                expiredAuctionDeserted
            );
            await context.SaveChangesAsync();

            var bid1 = new Bid
            {
                AuctionId = standardAuction.Id,
                BuyerId = buyer2.Id,
                Amount = 35000m,
                BidDate = now.AddMinutes(-30)
            };

            var bid2 = new Bid
            {
                AuctionId = standardAuction.Id,
                BuyerId = buyer1.Id,
                Amount = 45000m,
                BidDate = now.AddMinutes(-10)
            };

            var winningBid = new Bid
            {
                AuctionId = expiredAuctionWithWinner.Id,
                BuyerId = buyer1.Id,
                Amount = 90000m,
                BidDate = now.AddMinutes(-20)
            };

            await context.Set<Bid>().AddRangeAsync(bid1, bid2, winningBid);
            await context.SaveChangesAsync();
        }
    }
}
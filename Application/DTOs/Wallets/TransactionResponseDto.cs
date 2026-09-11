using System;

namespace Application.DTOs.Wallets
{
    public class TransactionResponseDto
    {
        public int Id { get; set; }
        public string Type { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public DateTime Date { get; set; }
        public int? AuctionId { get; set; }
        public string AuctionTitle { get; set; } = string.Empty;
    }
}
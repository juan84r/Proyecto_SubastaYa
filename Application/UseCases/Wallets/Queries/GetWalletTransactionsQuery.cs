namespace Application.UseCases.Wallets.Queries
{
    public class GetWalletTransactionsQuery
    {
        public int UserId { get; set; }

        public GetWalletTransactionsQuery(int userId)
        {
            UserId = userId;
        }
    }
}
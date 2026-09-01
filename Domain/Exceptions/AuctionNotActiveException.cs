namespace Domain.Exceptions;

public class AuctionNotActiveException : DomainException
{
	public AuctionNotActiveException(string message) : base(message)
	{
	}
}
namespace Domain.Exceptions;

public class InvalidBidAmountException : DomainException
{
	public InvalidBidAmountException(string message) : base(message)
	{
	}
}
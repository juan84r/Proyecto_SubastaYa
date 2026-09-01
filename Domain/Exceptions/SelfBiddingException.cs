namespace Domain.Exceptions;

public class SelfBiddingException : DomainException
{
	public SelfBiddingException(string message) : base(message)
	{
	}
}
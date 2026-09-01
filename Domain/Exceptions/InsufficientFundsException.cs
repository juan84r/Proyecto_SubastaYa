namespace Domain.Exceptions;

public class InsufficientFundsException : DomainException
{
	public InsufficientFundsException(string message) : base(message)
	{
	}
}
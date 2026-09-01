using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Domain.Exceptions;

public class InvalidBidAmountException : DomainException
{
	public InvalidBidAmountException(string message) : base(message) { }
}
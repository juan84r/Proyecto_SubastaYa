using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Domain.Exceptions
{
    public class AuctionNotActiveException : DomainException
    {
        public AuctionNotActiveException(string message) : base(message) { }
    }
}
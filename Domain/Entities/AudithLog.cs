using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Domain.Entities
{
    public class AudithLog
    {
        public int Id { get; set; } 
        public string Entity { get; set; } = string.Empty; 
        public int EntityId { get; set; } 
        public string Action { get; set; } = string.Empty; 
        public int? UserId { get; set; } 
        public string DetailJson { get; set; } = string.Empty; 
        public DateTime Date { get; set; }
        public User? User { get; set; }
    }
}

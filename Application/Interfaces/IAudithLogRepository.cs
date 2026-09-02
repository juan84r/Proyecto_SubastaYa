using Domain.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Application.Interfaces
{
    public interface IAuditLogRepository
    {
        Task AddAsync(AudithLog auditLog, CancellationToken cancellationToken = default);
        Task<IReadOnlyList<AudithLog>> GetByEntityAsync(string entity, int entityId, CancellationToken cancellationToken = default);
    }
}

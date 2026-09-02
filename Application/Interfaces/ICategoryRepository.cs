using Domain.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Application.Interfaces
{
    public interface ICategoryRepository
    {
        Task<Category?> GetByIdAsync(int id, CancellationToken cancellationToken = default);
        Task<IReadOnlyList<Category>> GetAllAsync(CancellationToken cancellationToken = default);
        Task<bool> ExistsAsync(int id, CancellationToken cancellationToken = default);
    }
}

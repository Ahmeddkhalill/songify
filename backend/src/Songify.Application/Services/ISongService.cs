using Songify.Application.Contracts.Common;
using Songify.Application.Contracts.Songs;

namespace Songify.Application.Services;

public interface ISongService
{
    Task<Result<PagedResponse<SongResponse>>> SearchAsync(string? search, int page, int pageSize, CancellationToken cancellationToken = default);

    Task<Result<SongResponse>> GetByIdAsync(int songId, CancellationToken cancellationToken = default);

    Task<Result<SongResponse>> CreateAsync(int userId, CreateSongRequest request, CancellationToken cancellationToken = default);

    Task<Result> UpdateAsync(int userId, int songId, UpdateSongRequest request, CancellationToken cancellationToken = default);

    Task<Result> DeleteAsync(int userId, int songId, CancellationToken cancellationToken = default);
}

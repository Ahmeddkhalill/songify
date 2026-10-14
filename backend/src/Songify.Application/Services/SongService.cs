using Microsoft.EntityFrameworkCore;
using Songify.Application.Contracts.Common;
using Songify.Application.Contracts.Songs;
using Songify.Application.Errors;

namespace Songify.Application.Services;

public class SongService(IApplicationDbContext context) : ISongService
{
    private const int MaxPageSize = 50;

    public async Task<Result<PaginatedList<SongResponse>>> SearchAsync(RequestFilters filters, CancellationToken cancellationToken = default)
    {
        var pageNumber = Math.Max(filters.PageNumber, 1);
        var pageSize = Math.Clamp(filters.PageSize, 1, MaxPageSize);

        var query = context.Songs.AsNoTracking();

        var term = filters.SearchValue?.Trim().ToLower();

        if (!string.IsNullOrEmpty(term))
            query = query.Where(s => s.Title.ToLower().Contains(term) || s.Artist.ToLower().Contains(term));

        var projected = query
            .OrderBy(s => s.Title)
            .ThenBy(s => s.Id)
            .Select(s => new SongResponse(
                s.Id,
                s.Title,
                s.Artist,
                s.Album,
                s.DurationInSeconds,
                s.CoverImageUrl,
                s.PreviewUrl));

        var result = await PaginatedList<SongResponse>.CreateAsync(projected, pageNumber, pageSize, cancellationToken);

        return Result.Success(result);
    }

    public async Task<Result<SongResponse>> GetByIdAsync(int songId, CancellationToken cancellationToken = default)
    {
        var song = await context.Songs
            .AsNoTracking()
            .SingleOrDefaultAsync(s => s.Id == songId, cancellationToken);

        if (song is null)
            return Result.Failure<SongResponse>(SongErrors.NotFound);

        return Result.Success(ToResponse(song));
    }

    public async Task<Result<SongResponse>> CreateAsync(int userId, CreateSongRequest request, CancellationToken cancellationToken = default)
    {
        var song = new Song
        {
            Title = request.Title.Trim(),
            Artist = request.Artist.Trim(),
            Album = request.Album?.Trim(),
            DurationInSeconds = request.DurationInSeconds,
            CoverImageUrl = request.CoverImageUrl?.Trim(),
            PreviewUrl = request.PreviewUrl?.Trim(),
            CreatedByUserId = userId,
            CreatedAt = DateTime.UtcNow
        };

        context.Songs.Add(song);
        await context.SaveChangesAsync(cancellationToken);

        return Result.Success(ToResponse(song));
    }

    public async Task<Result> UpdateAsync(int userId, int songId, UpdateSongRequest request, CancellationToken cancellationToken = default)
    {
        var song = await context.Songs
            .SingleOrDefaultAsync(s => s.Id == songId, cancellationToken);

        var access = CheckAccess(song, userId);

        if (access.IsFailure)
            return access;

        song!.Title = request.Title.Trim();
        song.Artist = request.Artist.Trim();
        song.Album = request.Album?.Trim();
        song.DurationInSeconds = request.DurationInSeconds;
        song.CoverImageUrl = request.CoverImageUrl?.Trim();
        song.PreviewUrl = request.PreviewUrl?.Trim();

        await context.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }

    public async Task<Result> DeleteAsync(int userId, int songId, CancellationToken cancellationToken = default)
    {
        var song = await context.Songs
            .SingleOrDefaultAsync(s => s.Id == songId, cancellationToken);

        var access = CheckAccess(song, userId);

        if (access.IsFailure)
            return access;

        context.Songs.Remove(song!);
        await context.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }

    private static Result CheckAccess(Song? song, int userId)
    {
        if (song is null)
            return Result.Failure(SongErrors.NotFound);

        if (song.CreatedByUserId is null)
            return Result.Failure(SongErrors.CatalogSongImmutable);

        if (song.CreatedByUserId != userId)
            return Result.Failure(SongErrors.NotOwner);

        return Result.Success();
    }

    private static SongResponse ToResponse(Song song) =>
        new(
            song.Id,
            song.Title,
            song.Artist,
            song.Album,
            song.DurationInSeconds,
            song.CoverImageUrl,
            song.PreviewUrl);
}

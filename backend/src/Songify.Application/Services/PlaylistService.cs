using Microsoft.EntityFrameworkCore;
using Songify.Application.Contracts.Playlists;
using Songify.Application.Contracts.Songs;
using Songify.Application.Errors;

namespace Songify.Application.Services;

public class PlaylistService(IApplicationDbContext context) : IPlaylistService
{
    private const int CoverImageCount = 4;

    public async Task<Result<IReadOnlyList<PlaylistSummaryResponse>>> GetAllAsync(int userId, CancellationToken cancellationToken = default)
    {
        var playlists = await context.Playlists
            .AsNoTracking()
            .Where(p => p.OwnerId == userId)
            .OrderByDescending(p => p.UpdatedAt)
            .Select(p => new PlaylistSummaryResponse(
                p.Id,
                p.Name,
                p.Description,
                p.PlaylistSongs.Count,
                p.PlaylistSongs.Sum(ps => ps.Song.DurationInSeconds),
                p.PlaylistSongs
                    .Where(ps => ps.Song.CoverImageUrl != null)
                    .OrderBy(ps => ps.Position)
                    .Select(ps => ps.Song.CoverImageUrl!)
                    .Take(CoverImageCount)
                    .ToList(),
                p.CreatedAt,
                p.UpdatedAt))
            .ToListAsync(cancellationToken);

        return Result.Success<IReadOnlyList<PlaylistSummaryResponse>>(playlists);
    }

    public async Task<Result<PlaylistDetailResponse>> GetByIdAsync(int userId, int playlistId, CancellationToken cancellationToken = default)
    {
        var playlist = await context.Playlists
            .AsNoTracking()
            .SingleOrDefaultAsync(p => p.Id == playlistId, cancellationToken);

        if (playlist is null)
            return Result.Failure<PlaylistDetailResponse>(PlaylistErrors.NotFound);

        if (playlist.OwnerId != userId)
            return Result.Failure<PlaylistDetailResponse>(PlaylistErrors.NotOwner);

        var songs = await context.PlaylistSongs
            .AsNoTracking()
            .Where(ps => ps.PlaylistId == playlistId)
            .OrderBy(ps => ps.Position)
            .Select(ps => new PlaylistSongResponse(
                ps.Song.Id,
                ps.Song.Title,
                ps.Song.Artist,
                ps.Song.Album,
                ps.Song.DurationInSeconds,
                ps.Song.CoverImageUrl,
                ps.Song.PreviewUrl,
                ps.Position,
                ps.AddedAt))
            .ToListAsync(cancellationToken);

        var response = new PlaylistDetailResponse(
            playlist.Id,
            playlist.Name,
            playlist.Description,
            songs.Count,
            songs.Sum(s => s.DurationInSeconds),
            playlist.CreatedAt,
            playlist.UpdatedAt,
            songs);

        return Result.Success(response);
    }

    public async Task<Result<PlaylistSummaryResponse>> CreateAsync(int userId, CreatePlaylistRequest request, CancellationToken cancellationToken = default)
    {
        var name = request.Name.Trim();

        if (await IsNameTakenAsync(userId, name, null, cancellationToken))
            return Result.Failure<PlaylistSummaryResponse>(PlaylistErrors.DuplicateName);

        var now = DateTime.UtcNow;

        var playlist = new Playlist
        {
            Name = name,
            Description = request.Description?.Trim(),
            OwnerId = userId,
            CreatedAt = now,
            UpdatedAt = now
        };

        context.Playlists.Add(playlist);
        await context.SaveChangesAsync(cancellationToken);

        var response = new PlaylistSummaryResponse(
            playlist.Id,
            playlist.Name,
            playlist.Description,
            0,
            0,
            [],
            playlist.CreatedAt,
            playlist.UpdatedAt);

        return Result.Success(response);
    }

    public async Task<Result> UpdateAsync(int userId, int playlistId, UpdatePlaylistRequest request, CancellationToken cancellationToken = default)
    {
        var playlist = await context.Playlists
            .SingleOrDefaultAsync(p => p.Id == playlistId, cancellationToken);

        var access = CheckAccess(playlist, userId);

        if (access.IsFailure)
            return access;

        var name = request.Name.Trim();

        if (await IsNameTakenAsync(userId, name, playlistId, cancellationToken))
            return Result.Failure(PlaylistErrors.DuplicateName);

        playlist!.Name = name;
        playlist.Description = request.Description?.Trim();
        playlist.UpdatedAt = DateTime.UtcNow;

        await context.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }

    public async Task<Result> DeleteAsync(int userId, int playlistId, CancellationToken cancellationToken = default)
    {
        var playlist = await context.Playlists
            .SingleOrDefaultAsync(p => p.Id == playlistId, cancellationToken);

        var access = CheckAccess(playlist, userId);

        if (access.IsFailure)
            return access;

        context.Playlists.Remove(playlist!);
        await context.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }

    public async Task<Result> AddSongAsync(int userId, int playlistId, AddSongToPlaylistRequest request, CancellationToken cancellationToken = default)
    {
        var playlist = await LoadWithSongsAsync(playlistId, cancellationToken);

        var access = CheckAccess(playlist, userId);

        if (access.IsFailure)
            return access;

        var songExists = await context.Songs
            .AnyAsync(s => s.Id == request.SongId, cancellationToken);

        if (!songExists)
            return Result.Failure(SongErrors.NotFound);

        if (playlist!.PlaylistSongs.Any(ps => ps.SongId == request.SongId))
            return Result.Failure(PlaylistErrors.SongAlreadyAdded);

        var now = DateTime.UtcNow;

        playlist.PlaylistSongs.Add(new PlaylistSong
        {
            SongId = request.SongId,
            Position = playlist.PlaylistSongs.Count,
            AddedAt = now
        });
        playlist.UpdatedAt = now;

        await context.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }

    public async Task<Result> RemoveSongAsync(int userId, int playlistId, int songId, CancellationToken cancellationToken = default)
    {
        var playlist = await LoadWithSongsAsync(playlistId, cancellationToken);

        var access = CheckAccess(playlist, userId);

        if (access.IsFailure)
            return access;

        var entry = playlist!.PlaylistSongs.SingleOrDefault(ps => ps.SongId == songId);

        if (entry is null)
            return Result.Failure(PlaylistErrors.SongNotInPlaylist);

        playlist.PlaylistSongs.Remove(entry);
        context.PlaylistSongs.Remove(entry);

        Renumber(playlist.PlaylistSongs.OrderBy(ps => ps.Position).ToList());
        playlist.UpdatedAt = DateTime.UtcNow;

        await context.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }

    public async Task<Result> ReorderSongAsync(int userId, int playlistId, int songId, ReorderSongRequest request, CancellationToken cancellationToken = default)
    {
        var playlist = await LoadWithSongsAsync(playlistId, cancellationToken);

        var access = CheckAccess(playlist, userId);

        if (access.IsFailure)
            return access;

        var ordered = playlist!.PlaylistSongs.OrderBy(ps => ps.Position).ToList();
        var entry = ordered.SingleOrDefault(ps => ps.SongId == songId);

        if (entry is null)
            return Result.Failure(PlaylistErrors.SongNotInPlaylist);

        if (request.NewPosition < 0 || request.NewPosition >= ordered.Count)
            return Result.Failure(PlaylistErrors.InvalidPosition);

        ordered.Remove(entry);
        ordered.Insert(request.NewPosition, entry);

        Renumber(ordered);
        playlist.UpdatedAt = DateTime.UtcNow;

        await context.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }

    private Task<Playlist?> LoadWithSongsAsync(int playlistId, CancellationToken cancellationToken) =>
        context.Playlists
            .Include(p => p.PlaylistSongs)
            .SingleOrDefaultAsync(p => p.Id == playlistId, cancellationToken);

    private Task<bool> IsNameTakenAsync(int userId, string name, int? excludedPlaylistId, CancellationToken cancellationToken) =>
        context.Playlists
            .AnyAsync(
                p => p.OwnerId == userId
                    && p.Id != excludedPlaylistId
                    && p.Name.ToLower() == name.ToLower(),
                cancellationToken);

    private static Result CheckAccess(Playlist? playlist, int userId)
    {
        if (playlist is null)
            return Result.Failure(PlaylistErrors.NotFound);

        if (playlist.OwnerId != userId)
            return Result.Failure(PlaylistErrors.NotOwner);

        return Result.Success();
    }

    private static void Renumber(IReadOnlyList<PlaylistSong> ordered)
    {
        for (var i = 0; i < ordered.Count; i++)
            ordered[i].Position = i;
    }
}

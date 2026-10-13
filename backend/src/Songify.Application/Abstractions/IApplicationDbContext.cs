using Microsoft.EntityFrameworkCore;

namespace Songify.Application.Abstractions;

public interface IApplicationDbContext
{
    DbSet<User> Users { get; }
    DbSet<Song> Songs { get; }
    DbSet<Playlist> Playlists { get; }
    DbSet<PlaylistSong> PlaylistSongs { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
namespace Songify.Infrastructure.Persistence;

public class ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();
    public DbSet<Song> Songs => Set<Song>();
    public DbSet<Playlist> Playlists => Set<Playlist>();
    public DbSet<PlaylistSong> PlaylistSongs => Set<PlaylistSong>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(ApplicationDbContext).Assembly);
        base.OnModelCreating(modelBuilder);
    }
}
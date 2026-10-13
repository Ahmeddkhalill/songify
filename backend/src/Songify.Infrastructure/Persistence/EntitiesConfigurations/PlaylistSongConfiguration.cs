namespace Songify.Infrastructure.Persistence.EntitiesConfigurations;

public class PlaylistSongConfiguration : IEntityTypeConfiguration<PlaylistSong>
{
    public void Configure(EntityTypeBuilder<PlaylistSong> builder)
    {
        builder.ToTable("PlaylistSongs");

        builder.HasKey(ps => new { ps.PlaylistId, ps.SongId });

        builder.Property(ps => ps.Position)
            .IsRequired();

        builder.Property(ps => ps.AddedAt)
            .IsRequired();

        builder.HasOne(ps => ps.Playlist)
            .WithMany(p => p.PlaylistSongs)
            .HasForeignKey(ps => ps.PlaylistId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(ps => ps.Song)
            .WithMany(s => s.PlaylistSongs)
            .HasForeignKey(ps => ps.SongId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(ps => new { ps.PlaylistId, ps.Position });
    }
}
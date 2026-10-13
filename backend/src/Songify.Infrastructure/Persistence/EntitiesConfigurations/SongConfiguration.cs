namespace Songify.Infrastructure.Persistence.EntitiesConfigurations;

public class SongConfiguration : IEntityTypeConfiguration<Song>
{
    public void Configure(EntityTypeBuilder<Song> builder)
    {
        builder.ToTable("Songs");

        builder.HasKey(s => s.Id);

        builder.Property(s => s.Title)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(s => s.Artist)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(s => s.Album)
            .HasMaxLength(200);

        builder.Property(s => s.DurationInSeconds)
            .IsRequired();

        builder.Property(s => s.CreatedAt)
            .IsRequired();

        builder.HasIndex(s => s.Title);
        builder.HasIndex(s => s.Artist);

        builder.HasOne<User>()
            .WithMany()
            .HasForeignKey(s => s.CreatedByUserId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
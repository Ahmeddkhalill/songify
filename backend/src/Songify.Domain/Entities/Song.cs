namespace Songify.Domain.Entities;

public class Song
{
    public int Id { get; set; }
    public string Title { get; set; } = null!;
    public string Artist { get; set; } = null!;
    public string? Album { get; set; }
    public int DurationInSeconds { get; set; }
    public DateTime CreatedAt { get; set; }

    public int? CreatedByUserId { get; set; }

    public ICollection<PlaylistSong> PlaylistSongs { get; set; } = [];
}

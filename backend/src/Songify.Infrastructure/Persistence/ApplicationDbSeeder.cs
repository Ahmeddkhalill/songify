namespace Songify.Infrastructure.Persistence;

public static class ApplicationDbSeeder
{
    public static async Task SeedAsync(ApplicationDbContext context, CancellationToken cancellationToken = default)
    {
        if (await context.Songs.AnyAsync(cancellationToken))
            return;

        var seededAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc);

        var songs = new List<Song>
        {
            new() { Title = "Bohemian Rhapsody", Artist = "Queen", Album = "A Night at the Opera", DurationInSeconds = 354 },
            new() { Title = "Stairway to Heaven", Artist = "Led Zeppelin", Album = "Led Zeppelin IV", DurationInSeconds = 482 },
            new() { Title = "Hotel California", Artist = "Eagles", Album = "Hotel California", DurationInSeconds = 391 },
            new() { Title = "Smells Like Teen Spirit", Artist = "Nirvana", Album = "Nevermind", DurationInSeconds = 301 },
            new() { Title = "Billie Jean", Artist = "Michael Jackson", Album = "Thriller", DurationInSeconds = 294 },
            new() { Title = "Imagine", Artist = "John Lennon", Album = "Imagine", DurationInSeconds = 183 },
            new() { Title = "One", Artist = "Metallica", Album = "...And Justice for All", DurationInSeconds = 446 },
            new() { Title = "Sweet Child O' Mine", Artist = "Guns N' Roses", Album = "Appetite for Destruction", DurationInSeconds = 356 },
            new() { Title = "Wonderwall", Artist = "Oasis", Album = "Morning Glory", DurationInSeconds = 258 },
            new() { Title = "Lose Yourself", Artist = "Eminem", Album = "8 Mile", DurationInSeconds = 326 },
            new() { Title = "Rolling in the Deep", Artist = "Adele", Album = "21", DurationInSeconds = 228 },
            new() { Title = "Blinding Lights", Artist = "The Weeknd", Album = "After Hours", DurationInSeconds = 200 },
            new() { Title = "Shape of You", Artist = "Ed Sheeran", Album = "Divide", DurationInSeconds = 233 },
            new() { Title = "Bad Guy", Artist = "Billie Eilish", Album = "When We All Fall Asleep", DurationInSeconds = 194 },
            new() { Title = "Uptown Funk", Artist = "Mark Ronson", Album = "Uptown Special", DurationInSeconds = 269 },
            new() { Title = "Somebody That I Used to Know", Artist = "Gotye", Album = "Making Mirrors", DurationInSeconds = 244 },
            new() { Title = "Take Five", Artist = "Dave Brubeck", Album = "Time Out", DurationInSeconds = 324 },
            new() { Title = "So What", Artist = "Miles Davis", Album = "Kind of Blue", DurationInSeconds = 562 },
            new() { Title = "Clocks", Artist = "Coldplay", Album = "A Rush of Blood to the Head", DurationInSeconds = 307 },
            new() { Title = "Numb", Artist = "Linkin Park", Album = "Meteora", DurationInSeconds = 185 }
        };

        foreach (var song in songs)
            song.CreatedAt = seededAt;

        await context.Songs.AddRangeAsync(songs, cancellationToken);
        await context.SaveChangesAsync(cancellationToken);
    }
}
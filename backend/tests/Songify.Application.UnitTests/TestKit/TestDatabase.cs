namespace Songify.Application.UnitTests.TestKit;

public sealed class TestDatabase
{
    private readonly string _name = Guid.NewGuid().ToString();

    public TestDbContext NewContext()
    {
        var options = new DbContextOptionsBuilder<TestDbContext>()
            .UseInMemoryDatabase(_name)
            .Options;

        return new TestDbContext(options);
    }

    public async Task SeedAsync(params object[] entities)
    {
        await using var context = NewContext();
        context.AddRange(entities);
        await context.SaveChangesAsync();
    }
}

namespace Songify.Api.IntegrationTests.Infrastructure;

[CollectionDefinition(Name)]
public sealed class IntegrationTestCollection : ICollectionFixture<SongifyApiFactory>
{
    public const string Name = "Integration";
}

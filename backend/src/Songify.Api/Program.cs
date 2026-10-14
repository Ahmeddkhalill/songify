using Microsoft.EntityFrameworkCore;
using Serilog;
using Songify.Api;
using Songify.Infrastructure.Persistence;

var builder = WebApplication.CreateBuilder(args);

builder.Host.UseSerilog((context, configuration) =>
    configuration.ReadFrom.Configuration(context.Configuration));

builder.Services.AddApiServices(builder.Configuration);

var app = builder.Build();

try
{
    using var scope = app.Services.CreateScope();
    var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    await context.Database.MigrateAsync();
    await ApplicationDbSeeder.SeedAsync(context);
}
catch (Exception exception)
{
    Log.Fatal(exception, "Database migration or seeding failed during startup");
    throw;
}

app.UseExceptionHandler();
app.UseSerilogRequestLogging();

app.UseSwagger();
app.UseSwaggerUI(options =>
{
    options.SwaggerEndpoint("/swagger/v1/swagger.json", "Songify API v1");
    options.RoutePrefix = string.Empty;
});

app.UseHttpsRedirection();

app.UseCors("Frontend");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapHealthChecks("/health");

app.Run();
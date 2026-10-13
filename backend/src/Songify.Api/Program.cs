using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Songify.Infrastructure;
using Songify.Infrastructure.Persistence;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddInfrastructure(builder.Configuration);
builder.Services.AddControllers();
builder.Services.AddOpenApi();

var jwtSection = builder.Configuration.GetSection("Jwt");

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtSection["Issuer"],
            ValidAudience = jwtSection["Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(jwtSection["Key"]!)),
            ClockSkew = TimeSpan.Zero
        };
    });

builder.Services.AddAuthorization();

builder.Services.AddCors(options =>
{
    options.AddPolicy("Frontend", policy =>
        policy.WithOrigins("http://localhost:5173")
              .AllowAnyHeader()
              .AllowAnyMethod());
});

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    await context.Database.MigrateAsync();
    await ApplicationDbSeeder.SeedAsync(context);
}

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();

app.UseCors("Frontend");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
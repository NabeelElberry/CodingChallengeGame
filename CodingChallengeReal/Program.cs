using Amazon.DynamoDBv2;
using AutoMapper;
using CodingChallengeReal.Mapper;
using CodingChallengeReal.Misc;
using CodingChallengeReal.Repositories.Implementation;
using CodingChallengeReal.Repositories.Interface;
using CodingChallengeReal.Services;
using CodingChallengeReal.Settings;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using StackExchange.Redis;
using System.Net.WebSockets;
using System.Numerics;
var builder = WebApplication.CreateBuilder(args);
var config = builder.Configuration;
// Add services to the container.

builder.Services.AddControllers();
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddSingleton<ChatService>();


builder.Services.Configure<DatabaseSettings>(config.GetSection(DatabaseSettings.KeyName));
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IMatchRepository, MatchRepository>();

builder.Services.AddScoped<IQueueRepository, QueueRepository>();
builder.Services.AddScoped<IProblemSetRepository, ProblemSetRepository>();
builder.Services.AddScoped<IMatchService, MatchService>();
builder.Services.AddAutoMapper(typeof(MapperProfile));
builder.Services.AddSingleton<IAmazonDynamoDB>(_ => new AmazonDynamoDBClient(Amazon.RegionEndpoint.USEast1));

builder.Services.AddSingleton<IConnectionMultiplexer>(ConnectionMultiplexer.Connect("localhost:6379"));
builder.Services.AddScoped<EnqueueService>();
builder.Services.AddScoped<Matchmaker>();
builder.Services.AddScoped<MatchManager>();
builder.Logging.AddConsole();
var corsPolicy = "AllowLocalhostFrontend";

builder.Services.AddCors(options =>
{
    options.AddPolicy(name: corsPolicy,
        policy =>
        {
            policy.WithOrigins("http://localhost:5173")
                  .AllowAnyHeader()
                  .AllowAnyMethod()
                  .AllowCredentials();
        });
});
builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.Authority = "https://securetoken.google.com/code1v1authentication";
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = "https://securetoken.google.com/code1v1authentication",
            ValidateAudience = true,
            ValidAudience = "code1v1authentication",
            ValidateLifetime = true,
            NameClaimType = "sub",
            
        };

        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                var accessToken = context.Request.Query["access_token"];
                var path = context.HttpContext.Request.Path;

                if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/matchhub"))
                {
                    context.Token = accessToken;
                }

                return Task.CompletedTask;
            }
        };
    });

builder.Services.AddSignalR(e => { 
    e.EnableDetailedErrors = true;
    e.MaximumReceiveMessageSize = 102400000;
});
builder.Services.AddAuthorization();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new() { Title = "API", Version = "v1" });

    c.AddSecurityDefinition("Bearer", new()
    {
        Description = "Enter your Firebase ID token below (without 'Bearer ' prefix).",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.Http,
        Scheme = "Bearer"

    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new() { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
            },
            Array.Empty<string>()
        }
    });
});


builder.Services.AddControllers();
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("AdminOnly", policy => policy.RequireClaim("http://schemas.microsoft.com/ws/2008/06/identity/claims/role", "admin"));
});
builder.Services.AddSingleton<FirebaseAdminService>();
var app = builder.Build();
app.UseHttpsRedirection();
app.UseCors(corsPolicy);
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.UseWebSockets();

app.MapGet("/ws", async (HttpContext context, ChatService chatService) =>
{

    if (context.WebSockets.IsWebSocketRequest)
    {
        var webSocket = await context.WebSockets.AcceptWebSocketAsync();
        await chatService.HandleWebSocketConnection(webSocket);
    }
    else
    {
        context.Response.StatusCode = 400;
        await context.Response.WriteAsync("Expected a WebSocket request");
    }
});
app.MapHub<MatchHub>("/matchhub").RequireCors(corsPolicy);


// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}


app.Run();

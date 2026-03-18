var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddOpenApi();
builder.Services.AddHealthChecks();

// Bind CORS policy from configuration
var corsOriginsStr = builder.Configuration["Cors:AllowedOrigins"] ?? "http://localhost:5173";
var corsOrigins = corsOriginsStr.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

// Add CORS policy
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend",
        policy =>
        {
            policy.WithOrigins(corsOrigins)
                  .AllowAnyHeader()
                  .AllowAnyMethod();
        });
});

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}
else
{
    app.UseExceptionHandler("/error");
    app.UseHsts();
}

app.UseHttpsRedirection();
app.UseCors("AllowFrontend");

// Endpoints for Production
app.MapHealthChecks("/health");

app.MapGet("/error", () => Results.Problem("An unexpected error occurred."))
   .ExcludeFromDescription();

// Mock Data
var tasks = new List<TaskItem>
{
    new TaskItem(1, "Learn ASP.NET Core Minimal APIs", true),
    new TaskItem(2, "Build a React Frontend", false),
    new TaskItem(3, "Connect Frontend to Backend", false)
};

// Endpoints
app.MapGet("/tasks", () => Results.Ok(tasks))
   .WithName("GetTasks");

app.MapGet("/tasks/{id}", (int id) => 
{
    var task = tasks.FirstOrDefault(t => t.Id == id);
    return task is not null ? Results.Ok(task) : Results.NotFound();
})
.WithName("GetTaskById");

app.MapPost("/tasks", (TaskItem newTask) => 
{
    var id = tasks.Count > 0 ? tasks.Max(t => t.Id) + 1 : 1;
    var taskToSave = newTask with { Id = id };
    tasks.Add(taskToSave);
    return Results.Created($"/tasks/{id}", taskToSave);
})
.WithName("CreateTask");

app.MapPut("/tasks/{id}", (int id, TaskItem updatedTask) => 
{
    var index = tasks.FindIndex(t => t.Id == id);
    if (index == -1) return Results.NotFound();
    
    tasks[index] = updatedTask with { Id = id };
    return Results.NoContent();
})
.WithName("UpdateTask");

app.MapDelete("/tasks/{id}", (int id) => 
{
    var index = tasks.FindIndex(t => t.Id == id);
    if (index == -1) return Results.NotFound();
    
    tasks.RemoveAt(index);
    return Results.NoContent();
})
.WithName("DeleteTask");

app.Run();

public record TaskItem(int Id, string Title, bool IsCompleted);

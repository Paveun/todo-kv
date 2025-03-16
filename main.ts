import { Hono } from "@hono/hono";
import { logger } from "@hono/hono/logger"
import { basicAuth } from "@hono/hono/basic-auth"
import { cors } from "@hono/hono/cors"
import "jsr:@std/dotenv/load";

const app = new Hono();
app.use(logger());
app.use(basicAuth({
  username: Deno.env.get("BASIC_AUTH_USERNAME") || "",
  password: Deno.env.get("BASIC_AUTH_PASSWORD") || "",
}))
app.use(cors());

const dbPath = Deno.env.get("DENO_ENV") === "test" ? ":memory:" : undefined;
const kv = await Deno.openKv(dbPath);

interface Todo {
  id: number;
  text: string;
  completed: boolean;
}

interface TodoRequest {
  text?: string;
  completed?: boolean;
}

app.get("/todos", async (c) => {
  const todos: { id: number; text: string; comlpeted: boolean }[] = [];
  for await (const entry of kv.list({ prefix: ["todos"] })) {
    todos.push(entry.value as { id: number; text: string; comlpeted: boolean });
  }
  return c.json(todos);
});

app.post("/todos", async (c) => {
  const { text } = await c.req.json();
  if (!text) {
    return c.json({ error: "text is required" }, 400);
  }
  const id = Date.now();
  const todo = { id, text, completed: false };
  await kv.set(["todos", id], todo);
  return c.json(todo, 201);
});

app.put("/todos/:id", async (c) => {
  const id = Number(c.req.param("id"));
  const body = await c.req.json<TodoRequest>();
  const existingTodo = await kv.get<Todo>(["todos", id]);
  if (!existingTodo.value) {
    return c.json({ error: "todo not found" }, 404);
  }
  const updatedTodo = {
    id,
    text: body.text !== undefined ? body.text : existingTodo.value.text,
    completed: body.completed !== undefined
      ? body.completed
      : existingTodo.value.completed,
  };
  await kv.set(["todos", id], updatedTodo);
  return c.json(updatedTodo);
});

app.delete("/todos/:id", async (c) => {
  const id = Number(c.req.param("id"));
  const existingTodo = await kv.get(["todos", id]);
  if (!existingTodo.value) {
    return c.json({ error: "todo not found" }, 404);
  }
  await kv.delete(["todos", id]);
  return c.json({ message: "todo deleted" });
});

if (import.meta.main) {
  Deno.serve(app.fetch);
}

export { app, kv };
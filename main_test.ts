import { assertEquals, assertExists } from "@std/assert";

interface Todo {
  id: number;
  text: string;
  completed: boolean;
}

async function seedDatabase(kv: Deno.Kv) {
  const todos: Todo[] = [
    { id: 1, text: "Todo 1", completed: false },
    { id: 2, text: "Todo 2", completed: true },
  ];
  for (const todo of todos) {
    await kv.set(["todos", todo.id], todo);
  }
}

async function resetDatabase(kv: Deno.Kv) {
  const iter = kv.list({ prefix: ["todos"] });
  for await (const res of iter) {
    await kv.delete(res.key);
  }
}

Deno.test("Todo API (usinng app.request)", async (t) => {
  Deno.env.set("DENO_ENV", "test");
  if (!Deno.env.get("BASIC_AUTH_USERNAME")) {
    Deno.env.set("BASIC_AUTH_USERNAME", "testuser");
  }
  if (!Deno.env.get("BASIC_AUTH_PASSWORD")) {
    Deno.env.set("BASIC_AUTH_PASSWORD", "testpassword");
  }
  const { app, kv } = await import(`./main.ts?update=${Date.now()}`);
  const basicAuthHeader = `Basic ${
    btoa(
      Deno.env.get("BASIC_AUTH_USERNAME") + ":" +
        Deno.env.get("BASIC_AUTH_PASSWORD"),
    )
  }`;

  await t.step("GET /todos", async () => {
    await resetDatabase(kv);
    await seedDatabase(kv);
    const res = await app.request("/todos", {
      headers: { Authorization: basicAuthHeader },
    });
    assertEquals(res.status, 200);
    const todos = await res.json();
    assertEquals(todos.length, 2);
    assertEquals(todos[0].text, "Todo 1");
    assertEquals(todos[1].text, "Todo 2");
  });

  await t.step("POST /todos", async () => {
    await resetDatabase(kv);
    await seedDatabase(kv);
    const res = await app.request("/todos", {
      method: "POST",
      headers: {
        Authorization: basicAuthHeader,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text: "New Todo" }),
    });
    assertEquals(res.status, 201);
    const todo = await res.json();
    assertExists(todo.id);
    assertEquals(todo.text, "New Todo");
    assertEquals(todo.completed, false);
    const getRes = await app.request("/todos", {
      headers: { Authorization: basicAuthHeader },
    });
    const todos = await getRes.json();
    assertEquals(todos.length, 3);
  });
  await t.step("POST /todos - missing text", async () => {
    await resetDatabase(kv);
    await seedDatabase(kv);
    const res = await app.request("/todos", {
      method: "POST",
      body: JSON.stringify({}),
      headers: { 
        "Content-Type": "application/json",
        Authorization: basicAuthHeader,
      },
    });
    assertEquals(res.status, 400);
    const data = await res.json();
    assertEquals(data.error, "text is required");
  });
  await t.step("PUT /todos/:id", async () => {
    await resetDatabase(kv);
    await seedDatabase(kv);
    const res = await app.request("/todos/1", {
      method: "PUT",
      body: JSON.stringify({ text: "Updated Todo", completed: true }),
      headers: { 
        "Content-Type": "application/json",
        Authorization: basicAuthHeader,
      },
    });
    assertEquals(res.status, 200);
    const todo = await res.json();
    assertEquals(todo.id, 1);
    assertEquals(todo.text, "Updated Todo");
    assertEquals(todo.completed, true);
    const getRes = await app.request("/todos", {
      headers: { Authorization: basicAuthHeader },
    });
    const todos = await getRes.json();
    assertEquals(todos[0].text, "Updated Todo");
  });
  await t.step("PUT /todos/:id - not found", async () => {
    await resetDatabase(kv);
    await seedDatabase(kv);
    const res = await app.request("/todos/9999", {
      method: "PUT",
      headers: { 
        "Content-Type": "application/json",
        Authorization: basicAuthHeader,
      },
      body: JSON.stringify({ text: "Updated Todo", completed: true }),
    });
    assertEquals(res.status, 404);
    const data = await res.json();
    assertEquals(data.error, "todo not found");
  });
  await t.step("DELETE /todos/:id", async () => {
    await resetDatabase(kv);
    await seedDatabase(kv);
    const res = await app.request("/todos/1", { 
      method: "DELETE",
      headers: { Authorization: basicAuthHeader },
    });
    assertEquals(res.status, 200);
    const getRes = await app.request("/todos", {
      headers: { Authorization: basicAuthHeader },
    });
    const todos = await getRes.json();
    assertEquals(todos.length, 1);
    assertEquals(todos[0].id, 2);
  });
  await t.step("DELETE /todos/:id - not found", async () => {
    await resetDatabase(kv);
    await seedDatabase(kv);
    const res = await app.request("/todos/9999", {
      method: "DELETE",
      headers: { Authorization: basicAuthHeader },
    });
    assertEquals(res.status, 404);
    const data = await res.json();
    assertEquals(data.error, "todo not found");
  });
  await t.step("GET /todos - unauthorized", async () => {
    await resetDatabase(kv);
    await seedDatabase(kv);
    const res = await app.request("/todos");
    assertEquals(res.status, 401);
  });
  kv.close();
});
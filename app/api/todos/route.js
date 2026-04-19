import { createTodo, listTodos } from "../../../lib/todoStore";

export async function GET() {
  return Response.json({ todos: listTodos() });
}

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const text = typeof body.text === "string" ? body.text.trim() : "";

  if (!text) {
    return Response.json({ error: "text is required" }, { status: 400 });
  }

  const todo = createTodo(text);
  return Response.json({ todo }, { status: 201 });
}

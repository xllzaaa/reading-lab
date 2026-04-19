import { createTodo, listTodos } from "../../../lib/todoStore";
import { getCurrentUserId } from "../../../lib/session";

export async function GET() {
  const userId = await getCurrentUserId();
  return Response.json({ todos: await listTodos(userId) });
}

export async function POST(request) {
  const userId = await getCurrentUserId();
  const body = await request.json().catch(() => ({}));
  const text = typeof body.text === "string" ? body.text.trim() : "";

  if (!text) {
    return Response.json({ error: "请填写任务内容" }, { status: 400 });
  }

  const todo = await createTodo({
    text,
    priority: body.priority,
    bookId: body.bookId,
  }, userId);

  return Response.json({ todo }, { status: 201 });
}

import { addNote, listNotes } from "../../../lib/readingStore";
import { getCurrentUserId } from "../../../lib/session";

export async function GET() {
  const userId = await getCurrentUserId();
  return Response.json({ notes: await listNotes(userId) });
}

export async function POST(request) {
  const userId = await getCurrentUserId();
  const body = await request.json().catch(() => ({}));
  const result = await addNote(body, userId);

  if (result.error) {
    return Response.json({ error: result.error }, { status: 400 });
  }

  return Response.json(result, { status: 201 });
}

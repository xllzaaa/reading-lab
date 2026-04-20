import { registerUser } from "../../../../lib/session";

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const result = await registerUser(body);

  if (result.error) {
    return Response.json({ error: result.error }, { status: 400 });
  }

  return Response.json(result, { status: 201 });
}

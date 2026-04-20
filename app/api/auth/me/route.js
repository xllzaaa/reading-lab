import { getCurrentUser, isUnauthorizedError, unauthorizedResponse } from "../../../../lib/session";

export async function GET() {
  try {
    return Response.json({ user: await getCurrentUser() });
  } catch (error) {
    if (isUnauthorizedError(error)) {
      return unauthorizedResponse();
    }
    throw error;
  }
}

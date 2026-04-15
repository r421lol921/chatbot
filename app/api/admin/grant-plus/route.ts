import { auth } from "@/app/(auth)/auth";
import { getUserByEmail, setUserType } from "@/lib/db/queries";

// Hardcoded admin emails — extend this list as needed
const ADMIN_EMAILS = ["peytotoria.com@gmail.com"];

export async function POST(req: Request) {
  const session = await auth();

  if (!session?.user?.email || !ADMIN_EMAILS.includes(session.user.email)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const { email, type } = body as { email?: string; type?: string };

  if (!email) {
    return Response.json({ error: "email is required" }, { status: 400 });
  }

  const validTypes = ["regular", "plus", "guest"] as const;
  const userType = (validTypes.includes(type as (typeof validTypes)[number]) ? type : "plus") as "regular" | "plus" | "guest";

  const targetUser = await getUserByEmail({ email });
  if (!targetUser) {
    return Response.json({ error: `No user found with email: ${email}` }, { status: 404 });
  }

  const [updated] = await setUserType({ userId: targetUser.id, userType });
  return Response.json({ success: true, user: updated });
}

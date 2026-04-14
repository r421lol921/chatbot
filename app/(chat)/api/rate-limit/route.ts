import { auth } from "@/app/(auth)/auth";
import { entitlementsByUserType } from "@/lib/ai/entitlements";
import { getLastUserMessageTime } from "@/lib/db/queries";

export async function GET() {
  const session = await auth();

  if (!session?.user) {
    return Response.json({ limited: false, secondsRemaining: 0 });
  }

  const userType = session.user.type;
  const entitlements = entitlementsByUserType[userType];
  const lastMessageTime = await getLastUserMessageTime({
    userId: session.user.id,
  });

  if (!lastMessageTime) {
    return Response.json({ limited: false, secondsRemaining: 0, userType });
  }

  const intervalMs = entitlements.messageIntervalHours * 60 * 60 * 1000;
  const elapsed = Date.now() - lastMessageTime.getTime();
  const remaining = intervalMs - elapsed;

  if (remaining <= 0) {
    return Response.json({ limited: false, secondsRemaining: 0, userType });
  }

  return Response.json({
    limited: true,
    secondsRemaining: Math.ceil(remaining / 1000),
    intervalHours: entitlements.messageIntervalHours,
    userType,
  });
}

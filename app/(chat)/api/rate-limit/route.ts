import { auth } from "@/app/(auth)/auth";
import { entitlementsByUserType } from "@/lib/ai/entitlements";
import { getLastUserMessageTime, getMessageCountByUserId } from "@/lib/db/queries";

export async function GET() {
  const session = await auth();

  if (!session?.user) {
    return Response.json({ limited: false, secondsRemaining: 0 });
  }

  const userType = session.user.type;
  const entitlements = entitlementsByUserType[userType];

  const messageCount = await getMessageCountByUserId({
    id: session.user.id,
    differenceInHours: entitlements.messageIntervalHours,
  });

  if (messageCount < entitlements.maxMessagesPerHour) {
    return Response.json({
      limited: false,
      secondsRemaining: 0,
      userType,
      messagesUsed: messageCount,
      messagesMax: entitlements.maxMessagesPerHour,
      intervalHours: entitlements.messageIntervalHours,
    });
  }

  // They are at or over the limit — find when the oldest message in the window expires
  const lastMessageTime = await getLastUserMessageTime({
    userId: session.user.id,
  });

  let secondsRemaining = 0;
  if (lastMessageTime) {
    const windowMs = entitlements.messageIntervalHours * 60 * 60 * 1000;
    const elapsed = Date.now() - lastMessageTime.getTime();
    const remaining = windowMs - elapsed;
    secondsRemaining = remaining > 0 ? Math.ceil(remaining / 1000) : 0;
  }

  return Response.json({
    limited: true,
    secondsRemaining,
    intervalHours: entitlements.messageIntervalHours,
    userType,
    messagesUsed: messageCount,
    messagesMax: entitlements.maxMessagesPerHour,
  });
}

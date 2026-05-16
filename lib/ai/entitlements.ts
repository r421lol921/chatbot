import type { UserType } from "@/app/(auth)/auth";

type Entitlements = {
  maxMessagesPerHour: number;
  // How many hours must pass between messages (enforced client + server side)
  messageIntervalHours: number;
  canUseLio2: boolean;
};

export const entitlementsByUserType: Record<UserType, Entitlements> = {
  guest: {
    maxMessagesPerHour: 5,
    messageIntervalHours: 7,
    canUseLio2: false,
  },
  regular: {
    maxMessagesPerHour: 5,
    messageIntervalHours: 7,
    canUseLio2: false,
  },
  plus: {
    maxMessagesPerHour: 1000,
    messageIntervalHours: 1,
    canUseLio2: true,
  },
};

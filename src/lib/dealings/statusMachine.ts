import { DealingStatus } from "@prisma/client";

export type DealingActor = "buyer" | "seller" | "any";

export type StatusTransition = {
  to: DealingStatus;
  actor: DealingActor;
  notes: string;
  sideEffects?: {
    markPaymentAt?: boolean;
    markCompletedAt?: boolean;
  };
};

/**
 * Centralized, one-direction status graph for Dealing.
 *
 * Responsibilities:
 * - APPROVAL_REQUIRED -> PAYMENT_REQUIRED: seller finishes approval flow (currently unused for Navi/Inquiry).
 * - PAYMENT_REQUIRED -> CONFIRM_REQUIRED: buyer records payment; timestamp is captured once.
 * - CONFIRM_REQUIRED -> COMPLETED: buyer finalizes the trade; payment/completion timestamps are captured once.
 * - CANCELED/COMPLETED are terminal.
 */
export const DEALING_STATUS_GRAPH: Record<DealingStatus, StatusTransition[]> = {
  [DealingStatus.APPROVAL_REQUIRED]: [
    {
      to: DealingStatus.PAYMENT_REQUIRED,
      actor: "seller",
      notes: "Seller (or system) approves conditions and opens payment step.",
    },
    {
      to: DealingStatus.CANCELED,
      actor: "any",
      notes: "Either party aborts before payment is requested.",
    },
  ],
  [DealingStatus.PAYMENT_REQUIRED]: [
    {
      to: DealingStatus.CONFIRM_REQUIRED,
      actor: "buyer",
      notes: "Buyer reports payment; paymentAt is recorded once per trade.",
      sideEffects: { markPaymentAt: true },
    },
    {
      to: DealingStatus.CANCELED,
      actor: "any",
      notes: "Cancel before payment confirmation.",
    },
  ],
  [DealingStatus.CONFIRM_REQUIRED]: [
    {
      to: DealingStatus.COMPLETED,
      actor: "buyer",
      notes: "Buyer confirms settlement; completion is recorded once per trade.",
      sideEffects: { markPaymentAt: true, markCompletedAt: true },
    },
    {
      to: DealingStatus.CANCELED,
      actor: "any",
      notes: "Abort during confirmation window.",
    },
  ],
  [DealingStatus.COMPLETED]: [],
  [DealingStatus.CANCELED]: [],
};

export const TERMINAL_DEALING_STATUSES = new Set<DealingStatus>([
  DealingStatus.CANCELED,
  DealingStatus.COMPLETED,
]);

export const findStatusTransition = (
  current: DealingStatus,
  target: DealingStatus
): StatusTransition | null => {
  const transitions = DEALING_STATUS_GRAPH[current] ?? [];
  return transitions.find((transition) => transition.to === target) ?? null;
};

export const buildStatusUpdate = (
  _currentStatus: DealingStatus,
  transition: StatusTransition,
  existingDates: { paymentAt?: Date | null; completedAt?: Date | null },
  now = new Date()
): {
  status: DealingStatus;
  paymentAt?: Date;
  completedAt?: Date;
} => {
  const update: {
    status: DealingStatus;
    paymentAt?: Date;
    completedAt?: Date;
  } = { status: transition.to };

  if (transition.sideEffects?.markPaymentAt && !existingDates.paymentAt) {
    update.paymentAt = now;
  }

  if (transition.sideEffects?.markCompletedAt && !existingDates.completedAt) {
    update.completedAt = now;
  }

  return update;
};

export const resolveActorRole = (
  buyerUserId: string,
  sellerUserId: string,
  currentUserId: string
): DealingActor => {
  if (currentUserId === buyerUserId) return "buyer";
  if (currentUserId === sellerUserId) return "seller";
  return "any";
};

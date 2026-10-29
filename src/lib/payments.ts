import { cacheLife, cacheTag } from "next/cache";
import { CACHE_TAGS, db } from "./db";

export type PaymentMethodOption = { id: string; provider: string; name: string; description: string | null };

// Métodos habilitados en el panel, en orden.
export async function getEnabledPaymentMethods(): Promise<PaymentMethodOption[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(CACHE_TAGS.content);

  return db.paymentMethod.findMany({
    where: { isEnabled: true },
    orderBy: { position: "asc" },
    select: { id: true, provider: true, name: true, description: true },
  });
}

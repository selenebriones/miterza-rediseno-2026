-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "shippingCarrier" TEXT,
ADD COLUMN     "trackingNumber" TEXT;

-- CreateTable
CREATE TABLE "OrderStatusChange" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "fromStatus" "OrderStatus",
    "toStatus" "OrderStatus" NOT NULL,
    "note" TEXT,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderStatusChange_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OrderStatusChange_orderId_createdAt_idx" ON "OrderStatusChange"("orderId", "createdAt");

-- AddForeignKey
ALTER TABLE "OrderStatusChange" ADD CONSTRAINT "OrderStatusChange_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderStatusChange" ADD CONSTRAINT "OrderStatusChange_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Historial inicial para los pedidos que ya existían.
INSERT INTO "OrderStatusChange" ("id", "orderId", "fromStatus", "toStatus", "createdAt")
SELECT 'init_' || "id", "id", NULL, "status", "createdAt" FROM "Order";

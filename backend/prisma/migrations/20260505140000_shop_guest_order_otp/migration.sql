-- CreateTable
CREATE TABLE "shop_guest_order_otps" (
    "id" TEXT NOT NULL,
    "email_norm" TEXT NOT NULL,
    "code_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shop_guest_order_otps_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "shop_guest_order_otps_email_norm_used_at_expires_at_idx" ON "shop_guest_order_otps"("email_norm", "used_at", "expires_at");

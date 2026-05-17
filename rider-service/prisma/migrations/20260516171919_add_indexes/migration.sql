-- CreateIndex
CREATE INDEX "Delivery_riderId_idx" ON "Delivery"("riderId");

-- CreateIndex
CREATE INDEX "Delivery_orderId_idx" ON "Delivery"("orderId");

-- CreateIndex
CREATE INDEX "Delivery_status_idx" ON "Delivery"("status");

-- CreateIndex
CREATE INDEX "Rider_userId_idx" ON "Rider"("userId");

-- CreateIndex
CREATE INDEX "Rider_isAvailable_idx" ON "Rider"("isAvailable");

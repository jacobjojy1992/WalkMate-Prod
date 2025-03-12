-- CreateIndex
CREATE INDEX "Walk_userId_date_idx" ON "Walk"("userId", "date");

-- CreateIndex
CREATE INDEX "Walk_date_idx" ON "Walk"("date");

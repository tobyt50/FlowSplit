-- CreateIndex
CREATE INDEX "SplitRule_userId_name_idx" ON "SplitRule"("userId", "name");

-- CreateIndex
CREATE INDEX "Transaction_userId_description_idx" ON "Transaction"("userId", "description");

-- CreateIndex
CREATE INDEX "Transaction_userId_reference_idx" ON "Transaction"("userId", "reference");

-- CreateIndex
CREATE INDEX "VirtualCard_userId_nameOnCard_idx" ON "VirtualCard"("userId", "nameOnCard");

-- CreateIndex
CREATE INDEX "VirtualCard_userId_last4_idx" ON "VirtualCard"("userId", "last4");

-- CreateIndex
CREATE INDEX "Wallet_userId_name_idx" ON "Wallet"("userId", "name");

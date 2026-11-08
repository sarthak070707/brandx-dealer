-- CreateTable
CREATE TABLE "LoginFailure" (
    "id" TEXT NOT NULL,
    "emailHash" TEXT NOT NULL,
    "ipHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoginFailure_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LoginFailure_ipHash_emailHash_createdAt_idx" ON "LoginFailure"("ipHash", "emailHash", "createdAt");

-- CreateIndex
CREATE INDEX "LoginFailure_ipHash_createdAt_idx" ON "LoginFailure"("ipHash", "createdAt");

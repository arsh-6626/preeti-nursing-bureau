-- CreateTable
CREATE TABLE "RequestStatusToken" (
    "tokenHash" TEXT NOT NULL,
    "requestId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RequestStatusToken_pkey" PRIMARY KEY ("tokenHash")
);

-- CreateIndex
CREATE INDEX "RequestStatusToken_requestId_idx" ON "RequestStatusToken"("requestId");

-- AddForeignKey
ALTER TABLE "RequestStatusToken" ADD CONSTRAINT "RequestStatusToken_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "ServiceRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterEnum
ALTER TYPE "LeadSource" ADD VALUE 'PORTAL';
ALTER TYPE "LeadSource" ADD VALUE 'SERVICE';

-- CreateEnum
CREATE TYPE "ServiceType" AS ENUM ('PERIODIC', 'REPAIR', 'ACCESSORIES', 'CHECKUP');

-- CreateTable
CREATE TABLE "ServiceBooking" (
    "id" TEXT NOT NULL,
    "showroomId" TEXT NOT NULL,
    "bay" INTEGER NOT NULL,
    "slotStart" TIMESTAMP(3) NOT NULL,
    "serviceType" "ServiceType" NOT NULL,
    "vehicle" TEXT NOT NULL,
    "regNumber" TEXT NOT NULL,
    "km" INTEGER NOT NULL,
    "notes" TEXT,
    "buyerName" TEXT NOT NULL,
    "buyerPhone" TEXT NOT NULL,
    "language" "Language" NOT NULL,
    "consentAt" TIMESTAMP(3) NOT NULL,
    "status" "BookingStatus" NOT NULL DEFAULT 'CONFIRMED',
    "cancelToken" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ServiceBooking_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ServiceBooking_cancelToken_key" ON "ServiceBooking"("cancelToken");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceBooking_leadId_key" ON "ServiceBooking"("leadId");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceBooking_showroomId_slotStart_bay_key" ON "ServiceBooking"("showroomId", "slotStart", "bay") WHERE (status = 'CONFIRMED');

-- AddForeignKey
ALTER TABLE "ServiceBooking" ADD CONSTRAINT "ServiceBooking_showroomId_fkey" FOREIGN KEY ("showroomId") REFERENCES "Showroom"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceBooking" ADD CONSTRAINT "ServiceBooking_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

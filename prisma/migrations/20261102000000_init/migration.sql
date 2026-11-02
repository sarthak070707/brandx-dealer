-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('BUYER', 'CONSULTANT', 'ADMIN');

-- CreateEnum
CREATE TYPE "BodyType" AS ENUM ('HATCHBACK', 'SEDAN', 'SUV', 'MPV');

-- CreateEnum
CREATE TYPE "Fuel" AS ENUM ('PETROL', 'DIESEL', 'CNG');

-- CreateEnum
CREATE TYPE "Transmission" AS ENUM ('MANUAL', 'AUTOMATIC');

-- CreateEnum
CREATE TYPE "UsedCarStatus" AS ENUM ('AVAILABLE', 'BOOKED', 'SOLD');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('CONFIRMED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "Language" AS ENUM ('EN', 'HI');

-- CreateEnum
CREATE TYPE "LeadSource" AS ENUM ('ENQUIRY', 'TEST_DRIVE');

-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('NEW', 'CONTACTED', 'TEST_DRIVE_BOOKED', 'NEGOTIATION', 'WON', 'LOST');

-- CreateEnum
CREATE TYPE "LeadEventType" AS ENUM ('ASSIGNED', 'REASSIGNED', 'STATUS', 'NOTE', 'MESSAGE');

-- CreateEnum
CREATE TYPE "Confidence" AS ENUM ('HIGH', 'MEDIUM', 'LOW');

-- CreateEnum
CREATE TYPE "MessageChannel" AS ENUM ('WHATSAPP', 'SMS');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'BUYER',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "lastAssignedAt" TIMESTAMP(3),
    "showroomId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "City" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "City_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Showroom" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "cityId" TEXT NOT NULL,
    "openMinute" INTEGER NOT NULL DEFAULT 600,
    "closeMinute" INTEGER NOT NULL DEFAULT 1080,

    CONSTRAINT "Showroom_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConsultantModel" (
    "consultantId" TEXT NOT NULL,
    "modelId" TEXT NOT NULL,

    CONSTRAINT "ConsultantModel_pkey" PRIMARY KEY ("consultantId","modelId")
);

-- CreateTable
CREATE TABLE "Model" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "bodyType" "BodyType" NOT NULL,
    "description" TEXT NOT NULL,
    "heroImage" TEXT,

    CONSTRAINT "Model_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Variant" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "modelId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "fuel" "Fuel" NOT NULL,
    "transmission" "Transmission" NOT NULL,
    "modelYear" INTEGER NOT NULL,
    "available" BOOLEAN NOT NULL DEFAULT true,
    "specs" JSONB NOT NULL,
    "colours" JSONB NOT NULL,

    CONSTRAINT "Variant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VariantPrice" (
    "id" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "exShowroomPaise" INTEGER NOT NULL,
    "validFrom" DATE NOT NULL,
    "validTo" DATE NOT NULL,

    CONSTRAINT "VariantPrice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoadTaxRule" (
    "id" TEXT NOT NULL,
    "cityId" TEXT NOT NULL,
    "fuel" "Fuel" NOT NULL,
    "slabMinPaise" INTEGER NOT NULL,
    "slabMaxPaise" INTEGER,
    "rateBasisPoints" INTEGER NOT NULL,
    "validFrom" DATE NOT NULL,
    "validTo" DATE NOT NULL,

    CONSTRAINT "RoadTaxRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InsuranceRate" (
    "id" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "cityId" TEXT NOT NULL,
    "premiumPaise" INTEGER NOT NULL,
    "validFrom" DATE NOT NULL,
    "validTo" DATE NOT NULL,

    CONSTRAINT "InsuranceRate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccessoryPackage" (
    "id" TEXT NOT NULL,
    "modelId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "pricePaise" INTEGER NOT NULL,
    "items" TEXT[],
    "validFrom" DATE NOT NULL,
    "validTo" DATE NOT NULL,

    CONSTRAINT "AccessoryPackage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UsedCar" (
    "id" TEXT NOT NULL,
    "stockId" TEXT NOT NULL,
    "modelId" TEXT NOT NULL,
    "showroomId" TEXT NOT NULL,
    "variantName" TEXT NOT NULL,
    "fuel" "Fuel" NOT NULL,
    "transmission" "Transmission" NOT NULL,
    "year" INTEGER NOT NULL,
    "km" INTEGER NOT NULL,
    "owners" INTEGER NOT NULL,
    "regNumber" TEXT NOT NULL,
    "pricePaise" INTEGER NOT NULL,
    "status" "UsedCarStatus" NOT NULL DEFAULT 'AVAILABLE',
    "inspectionReport" JSONB NOT NULL,
    "photos" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UsedCar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DemoCar" (
    "id" TEXT NOT NULL,
    "showroomId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "available" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "DemoCar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TestDriveBooking" (
    "id" TEXT NOT NULL,
    "demoCarId" TEXT NOT NULL,
    "slotStart" TIMESTAMP(3) NOT NULL,
    "buyerName" TEXT NOT NULL,
    "buyerPhone" TEXT NOT NULL,
    "buyerEmail" TEXT,
    "language" "Language" NOT NULL,
    "consentAt" TIMESTAMP(3) NOT NULL,
    "status" "BookingStatus" NOT NULL DEFAULT 'CONFIRMED',
    "cancelToken" TEXT NOT NULL,
    "buyerId" TEXT,
    "leadId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TestDriveBooking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL,
    "source" "LeadSource" NOT NULL,
    "buyerName" TEXT NOT NULL,
    "buyerPhone" TEXT NOT NULL,
    "buyerEmail" TEXT,
    "language" "Language" NOT NULL,
    "message" TEXT,
    "modelId" TEXT,
    "variantId" TEXT,
    "usedCarId" TEXT,
    "cityId" TEXT NOT NULL,
    "showroomId" TEXT NOT NULL,
    "assignedToId" TEXT,
    "status" "LeadStatus" NOT NULL DEFAULT 'NEW',
    "lostReason" TEXT,
    "consentAt" TIMESTAMP(3) NOT NULL,
    "optedOutAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "firstContactAt" TIMESTAMP(3),

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadEvent" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "type" "LeadEventType" NOT NULL,
    "actorId" TEXT,
    "details" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeadEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiDraft" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "summaryJson" JSONB NOT NULL,
    "draftText" TEXT NOT NULL,
    "confidence" "Confidence" NOT NULL,
    "guardFlags" TEXT[],
    "usedTemplate" BOOLEAN NOT NULL DEFAULT false,
    "finalSentText" TEXT,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiDraft_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OutboxMessage" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "channel" "MessageChannel" NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OutboxMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_showroomId_role_active_idx" ON "User"("showroomId", "role", "active");

-- CreateIndex
CREATE UNIQUE INDEX "City_name_key" ON "City"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Showroom_name_key" ON "Showroom"("name");

-- CreateIndex
CREATE INDEX "ConsultantModel_modelId_idx" ON "ConsultantModel"("modelId");

-- CreateIndex
CREATE UNIQUE INDEX "Model_slug_key" ON "Model"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Variant_code_key" ON "Variant"("code");

-- CreateIndex
CREATE INDEX "VariantPrice_variantId_validFrom_idx" ON "VariantPrice"("variantId", "validFrom");

-- CreateIndex
CREATE INDEX "RoadTaxRule_cityId_fuel_validFrom_idx" ON "RoadTaxRule"("cityId", "fuel", "validFrom");

-- CreateIndex
CREATE INDEX "InsuranceRate_variantId_cityId_validFrom_idx" ON "InsuranceRate"("variantId", "cityId", "validFrom");

-- CreateIndex
CREATE INDEX "AccessoryPackage_modelId_validFrom_idx" ON "AccessoryPackage"("modelId", "validFrom");

-- CreateIndex
CREATE UNIQUE INDEX "UsedCar_stockId_key" ON "UsedCar"("stockId");

-- CreateIndex
CREATE INDEX "UsedCar_status_modelId_idx" ON "UsedCar"("status", "modelId");

-- CreateIndex
CREATE UNIQUE INDEX "TestDriveBooking_cancelToken_key" ON "TestDriveBooking"("cancelToken");

-- CreateIndex
CREATE UNIQUE INDEX "TestDriveBooking_leadId_key" ON "TestDriveBooking"("leadId");

-- CreateIndex
CREATE INDEX "TestDriveBooking_buyerId_idx" ON "TestDriveBooking"("buyerId");

-- CreateIndex
CREATE UNIQUE INDEX "TestDriveBooking_demoCarId_slotStart_key" ON "TestDriveBooking"("demoCarId", "slotStart") WHERE (status = 'CONFIRMED');

-- CreateIndex
CREATE INDEX "Lead_assignedToId_status_idx" ON "Lead"("assignedToId", "status");

-- CreateIndex
CREATE INDEX "Lead_showroomId_assignedToId_idx" ON "Lead"("showroomId", "assignedToId");

-- CreateIndex
CREATE INDEX "Lead_buyerPhone_idx" ON "Lead"("buyerPhone");

-- CreateIndex
CREATE INDEX "LeadEvent_leadId_createdAt_idx" ON "LeadEvent"("leadId", "createdAt");

-- CreateIndex
CREATE INDEX "AiDraft_leadId_createdAt_idx" ON "AiDraft"("leadId", "createdAt");

-- CreateIndex
CREATE INDEX "OutboxMessage_leadId_idx" ON "OutboxMessage"("leadId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_showroomId_fkey" FOREIGN KEY ("showroomId") REFERENCES "Showroom"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Showroom" ADD CONSTRAINT "Showroom_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsultantModel" ADD CONSTRAINT "ConsultantModel_consultantId_fkey" FOREIGN KEY ("consultantId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsultantModel" ADD CONSTRAINT "ConsultantModel_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "Model"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Variant" ADD CONSTRAINT "Variant_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "Model"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VariantPrice" ADD CONSTRAINT "VariantPrice_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "Variant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoadTaxRule" ADD CONSTRAINT "RoadTaxRule_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InsuranceRate" ADD CONSTRAINT "InsuranceRate_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "Variant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InsuranceRate" ADD CONSTRAINT "InsuranceRate_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccessoryPackage" ADD CONSTRAINT "AccessoryPackage_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "Model"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsedCar" ADD CONSTRAINT "UsedCar_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "Model"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsedCar" ADD CONSTRAINT "UsedCar_showroomId_fkey" FOREIGN KEY ("showroomId") REFERENCES "Showroom"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DemoCar" ADD CONSTRAINT "DemoCar_showroomId_fkey" FOREIGN KEY ("showroomId") REFERENCES "Showroom"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DemoCar" ADD CONSTRAINT "DemoCar_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "Variant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestDriveBooking" ADD CONSTRAINT "TestDriveBooking_demoCarId_fkey" FOREIGN KEY ("demoCarId") REFERENCES "DemoCar"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestDriveBooking" ADD CONSTRAINT "TestDriveBooking_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestDriveBooking" ADD CONSTRAINT "TestDriveBooking_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "Model"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "Variant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_usedCarId_fkey" FOREIGN KEY ("usedCarId") REFERENCES "UsedCar"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_showroomId_fkey" FOREIGN KEY ("showroomId") REFERENCES "Showroom"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadEvent" ADD CONSTRAINT "LeadEvent_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadEvent" ADD CONSTRAINT "LeadEvent_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiDraft" ADD CONSTRAINT "AiDraft_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutboxMessage" ADD CONSTRAINT "OutboxMessage_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

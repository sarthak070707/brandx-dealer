-- AlterEnum
ALTER TYPE "BodyType" ADD VALUE 'COUPE';

-- AlterTable
ALTER TABLE "Model" ADD COLUMN     "featured" BOOLEAN NOT NULL DEFAULT false;

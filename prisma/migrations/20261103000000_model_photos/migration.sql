-- AlterTable
ALTER TABLE "Model" DROP COLUMN "heroImage",
ADD COLUMN     "photos" TEXT[] DEFAULT ARRAY[]::TEXT[];

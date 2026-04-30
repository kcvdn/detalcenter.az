-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'SELLER_ADMIN';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "sellerId" INTEGER;

-- CreateIndex
CREATE INDEX "User_sellerId_idx" ON "User"("sellerId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "Seller"("id") ON DELETE SET NULL ON UPDATE CASCADE;

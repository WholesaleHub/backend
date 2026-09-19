/*
  Warnings:

  - The `status` column on the `Customer` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "CustomerStatus" AS ENUM ('ACTIVE', 'SUSPENDED');

-- AlterTable
ALTER TABLE "Customer" DROP COLUMN "status",
ADD COLUMN     "status" "CustomerStatus" NOT NULL DEFAULT 'ACTIVE';

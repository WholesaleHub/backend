/*
  Warnings:

  - The primary key for the `User` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `createdAt` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `User` table. All the data in the column will be lost.
  - The `id` column on the `User` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to alter the column `email` on the `User` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(255)`.
  - Added the required column `full_name` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `password_hash` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "User" DROP CONSTRAINT "User_pkey",
DROP COLUMN "createdAt",
DROP COLUMN "name",
ADD COLUMN     "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "full_name" VARCHAR(100) NOT NULL,
ADD COLUMN     "password_hash" TEXT NOT NULL,
ADD COLUMN     "phone" VARCHAR(20),
ADD COLUMN     "role" VARCHAR(20) NOT NULL DEFAULT 'RETAILER',
ADD COLUMN     "status" VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL DEFAULT gen_random_uuid(),
ALTER COLUMN "email" SET DATA TYPE VARCHAR(255),
ADD CONSTRAINT "User_pkey" PRIMARY KEY ("id");

-- CreateTable
CREATE TABLE "Category" (
    "category_id" SERIAL NOT NULL,
    "category_name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("category_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Category_category_name_key" ON "Category"("category_name");

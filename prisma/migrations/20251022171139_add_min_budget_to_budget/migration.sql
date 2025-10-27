/*
  Warnings:

  - Added the required column `min_budget` to the `budget` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `budget` ADD COLUMN `min_budget` DOUBLE NOT NULL;

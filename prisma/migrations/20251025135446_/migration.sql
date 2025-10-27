/*
  Warnings:

  - You are about to drop the column `cost` on the `activity` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[join_code]` on the table `group` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `max_cost` to the `activity` table without a default value. This is not possible if the table is not empty.
  - Added the required column `min_cost` to the `activity` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `activity` DROP COLUMN `cost`,
    ADD COLUMN `max_cost` DOUBLE NOT NULL,
    ADD COLUMN `min_cost` DOUBLE NOT NULL;

-- AlterTable
ALTER TABLE `group` ADD COLUMN `join_code` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `user` ADD COLUMN `profile_image` LONGTEXT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `group_join_code_key` ON `group`(`join_code`);

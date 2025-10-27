/*
  Warnings:

  - You are about to drop the column `join_code` on the `group` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX `Group_join_code_key` ON `group`;

-- AlterTable
ALTER TABLE `group` DROP COLUMN `join_code`;

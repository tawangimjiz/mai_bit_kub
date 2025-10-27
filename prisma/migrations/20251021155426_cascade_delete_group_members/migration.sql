-- DropForeignKey
ALTER TABLE `groupmember` DROP FOREIGN KEY `GroupMember_group_id_fkey`;

-- DropIndex
DROP INDEX `GroupMember_group_id_fkey` ON `groupmember`;

-- AddForeignKey
ALTER TABLE `GroupMember` ADD CONSTRAINT `GroupMember_group_id_fkey` FOREIGN KEY (`group_id`) REFERENCES `Group`(`group_id`) ON DELETE CASCADE ON UPDATE CASCADE;

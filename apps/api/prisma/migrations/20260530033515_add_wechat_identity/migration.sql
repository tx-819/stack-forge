/*
  Warnings:

  - A unique constraint covering the columns `[wx_openid]` on the table `user` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `user` ADD COLUMN `phone` VARCHAR(191) NULL,
    ADD COLUMN `wx_openid` VARCHAR(191) NULL,
    ADD COLUMN `wx_unionid` VARCHAR(191) NULL,
    MODIFY `email` VARCHAR(191) NULL,
    MODIFY `password` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `user_wx_openid_key` ON `user`(`wx_openid`);

-- CreateIndex
CREATE INDEX `user_wx_unionid_idx` ON `user`(`wx_unionid`);

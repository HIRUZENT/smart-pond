-- AlterTable
ALTER TABLE `expense` ADD COLUMN `receiptData` MEDIUMBLOB NULL,
    ADD COLUMN `receiptMime` VARCHAR(60) NULL,
    ADD COLUMN `receiptName` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `operationalactivity` ADD COLUMN `phSnapshot` DECIMAL(10, 3) NULL,
    ADD COLUMN `recordState` ENUM('DRAFT', 'SUBMITTED') NOT NULL DEFAULT 'SUBMITTED',
    ADD COLUMN `tdsSnapshot` DECIMAL(10, 3) NULL,
    ADD COLUMN `telemetryAt` DATETIME(3) NULL,
    ADD COLUMN `temperatureSnapshot` DECIMAL(10, 3) NULL;

-- CreateTable
CREATE TABLE `PondMember` (
    `pondId` VARCHAR(30) NOT NULL,
    `userId` VARCHAR(30) NOT NULL,
    `assignedById` VARCHAR(30) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `PondMember_userId_idx`(`userId`),
    INDEX `PondMember_assignedById_idx`(`assignedById`),
    PRIMARY KEY (`pondId`, `userId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `Alert_trigger_occurredAt_idx` ON `Alert`(`trigger`, `occurredAt`);

-- CreateIndex
CREATE INDEX `Expense_activityId_occurredAt_idx` ON `Expense`(`activityId`, `occurredAt`);

-- CreateIndex
CREATE INDEX `MaintenanceSchedule_pondId_nextRunAt_idx` ON `MaintenanceSchedule`(`pondId`, `nextRunAt`);

-- CreateIndex
CREATE INDEX `OperationalActivity_recordState_createdAt_idx` ON `OperationalActivity`(`recordState`, `createdAt`);

-- CreateIndex
CREATE INDEX `OperationalActivity_assignedToId_status_idx` ON `OperationalActivity`(`assignedToId`, `status`);

-- CreateIndex
CREATE INDEX `OperationalActivity_recordedById_createdAt_idx` ON `OperationalActivity`(`recordedById`, `createdAt`);

-- CreateIndex
CREATE INDEX `Pond_isActive_idx` ON `Pond`(`isActive`);

-- CreateIndex
CREATE INDEX `Pond_type_idx` ON `Pond`(`type`);

-- CreateIndex
CREATE INDEX `SensorDevice_pondId_isActive_idx` ON `SensorDevice`(`pondId`, `isActive`);

-- AddForeignKey
ALTER TABLE `PondMember` ADD CONSTRAINT `PondMember_pondId_fkey` FOREIGN KEY (`pondId`) REFERENCES `Pond`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PondMember` ADD CONSTRAINT `PondMember_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PondMember` ADD CONSTRAINT `PondMember_assignedById_fkey` FOREIGN KEY (`assignedById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

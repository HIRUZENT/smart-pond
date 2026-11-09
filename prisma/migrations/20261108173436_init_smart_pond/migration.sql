-- CreateTable
CREATE TABLE `User` (
    `id` VARCHAR(30) NOT NULL,
    `name` VARCHAR(120) NOT NULL,
    `loginId` VARCHAR(191) NOT NULL,
    `passwordHash` VARCHAR(255) NOT NULL,
    `role` ENUM('ADMIN', 'MANAGER', 'OPERATOR') NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdById` VARCHAR(30) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `User_loginId_key`(`loginId`),
    INDEX `User_role_isActive_idx`(`role`, `isActive`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Session` (
    `id` VARCHAR(30) NOT NULL,
    `tokenHash` CHAR(64) NOT NULL,
    `userId` VARCHAR(30) NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Session_tokenHash_key`(`tokenHash`),
    INDEX `Session_userId_expiresAt_idx`(`userId`, `expiresAt`),
    INDEX `Session_expiresAt_idx`(`expiresAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LoginThrottle` (
    `key` CHAR(64) NOT NULL,
    `failedCount` INTEGER NOT NULL DEFAULT 0,
    `windowStartedAt` DATETIME(3) NOT NULL,
    `lockedUntil` DATETIME(3) NULL,
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`key`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Pond` (
    `id` VARCHAR(30) NOT NULL,
    `code` VARCHAR(50) NOT NULL,
    `name` VARCHAR(120) NOT NULL,
    `type` ENUM('PARIT_SEKAT', 'TABUNG') NOT NULL,
    `fishSpecies` VARCHAR(100) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Pond_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SensorDevice` (
    `id` VARCHAR(30) NOT NULL,
    `externalId` VARCHAR(100) NOT NULL,
    `pondId` VARCHAR(30) NOT NULL,
    `firebasePath` VARCHAR(191) NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `lastSeenAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `SensorDevice_externalId_key`(`externalId`),
    UNIQUE INDEX `SensorDevice_firebasePath_key`(`firebasePath`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `WaterReading` (
    `id` VARCHAR(30) NOT NULL,
    `pondId` VARCHAR(30) NOT NULL,
    `deviceId` VARCHAR(30) NULL,
    `parameter` ENUM('PH', 'TEMPERATURE', 'TDS', 'DO') NOT NULL,
    `value` DECIMAL(10, 3) NOT NULL,
    `unit` VARCHAR(16) NOT NULL,
    `observedAt` DATETIME(3) NOT NULL,
    `receivedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `externalEventId` VARCHAR(191) NULL,

    UNIQUE INDEX `WaterReading_externalEventId_key`(`externalEventId`),
    INDEX `WaterReading_pondId_parameter_observedAt_idx`(`pondId`, `parameter`, `observedAt`),
    INDEX `WaterReading_deviceId_observedAt_idx`(`deviceId`, `observedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `WaterThreshold` (
    `id` VARCHAR(30) NOT NULL,
    `pondId` VARCHAR(30) NOT NULL,
    `parameter` ENUM('PH', 'TEMPERATURE', 'TDS', 'DO') NOT NULL,
    `minValue` DECIMAL(10, 3) NULL,
    `maxValue` DECIMAL(10, 3) NULL,
    `isEnabled` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `WaterThreshold_pondId_parameter_key`(`pondId`, `parameter`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MaintenanceSchedule` (
    `id` VARCHAR(30) NOT NULL,
    `pondId` VARCHAR(30) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `nextRunAt` DATETIME(3) NOT NULL,
    `intervalMinutes` INTEGER NULL,
    `isEnabled` BOOLEAN NOT NULL DEFAULT true,
    `createdById` VARCHAR(30) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `MaintenanceSchedule_isEnabled_nextRunAt_idx`(`isEnabled`, `nextRunAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Alert` (
    `id` VARCHAR(30) NOT NULL,
    `pondId` VARCHAR(30) NOT NULL,
    `trigger` ENUM('WATER_QUALITY', 'SCHEDULE') NOT NULL,
    `parameter` ENUM('PH', 'TEMPERATURE', 'TDS', 'DO') NULL,
    `measuredValue` DECIMAL(10, 3) NULL,
    `minValueSnapshot` DECIMAL(10, 3) NULL,
    `maxValueSnapshot` DECIMAL(10, 3) NULL,
    `scheduleId` VARCHAR(30) NULL,
    `readingId` VARCHAR(30) NULL,
    `message` VARCHAR(500) NOT NULL,
    `occurredAt` DATETIME(3) NOT NULL,
    `dedupKey` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Alert_dedupKey_key`(`dedupKey`),
    INDEX `Alert_pondId_occurredAt_idx`(`pondId`, `occurredAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Notification` (
    `id` VARCHAR(30) NOT NULL,
    `alertId` VARCHAR(30) NOT NULL,
    `userId` VARCHAR(30) NOT NULL,
    `isRead` BOOLEAN NOT NULL DEFAULT false,
    `readAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Notification_userId_isRead_createdAt_idx`(`userId`, `isRead`, `createdAt`),
    UNIQUE INDEX `Notification_alertId_userId_key`(`alertId`, `userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PushDevice` (
    `id` VARCHAR(30) NOT NULL,
    `userId` VARCHAR(30) NOT NULL,
    `fcmToken` TEXT NOT NULL,
    `tokenHash` CHAR(64) NOT NULL,
    `isEnabled` BOOLEAN NOT NULL DEFAULT true,
    `lastSeenAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `PushDevice_tokenHash_key`(`tokenHash`),
    INDEX `PushDevice_userId_isEnabled_idx`(`userId`, `isEnabled`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `OperationalActivity` (
    `id` VARCHAR(30) NOT NULL,
    `pondId` VARCHAR(30) NOT NULL,
    `alertId` VARCHAR(30) NULL,
    `type` ENUM('FEEDING', 'WATER_CHANGE', 'WATER_ADDITION', 'AERATOR', 'CLEANING', 'FOLLOW_UP', 'OTHER') NOT NULL,
    `activityAt` DATETIME(3) NOT NULL,
    `description` TEXT NOT NULL,
    `instruction` TEXT NULL,
    `status` ENUM('PENDING', 'IN_PROGRESS', 'COMPLETED') NULL,
    `result` TEXT NULL,
    `recordedById` VARCHAR(30) NOT NULL,
    `assignedToId` VARCHAR(30) NULL,
    `performedById` VARCHAR(30) NULL,
    `performedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `OperationalActivity_pondId_activityAt_idx`(`pondId`, `activityAt`),
    INDEX `OperationalActivity_type_status_idx`(`type`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Expense` (
    `id` VARCHAR(30) NOT NULL,
    `activityId` VARCHAR(30) NOT NULL,
    `category` VARCHAR(100) NOT NULL,
    `amount` DECIMAL(14, 2) NOT NULL,
    `occurredAt` DATETIME(3) NOT NULL,
    `description` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Expense_occurredAt_idx`(`occurredAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `User` ADD CONSTRAINT `User_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Session` ADD CONSTRAINT `Session_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SensorDevice` ADD CONSTRAINT `SensorDevice_pondId_fkey` FOREIGN KEY (`pondId`) REFERENCES `Pond`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WaterReading` ADD CONSTRAINT `WaterReading_pondId_fkey` FOREIGN KEY (`pondId`) REFERENCES `Pond`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WaterReading` ADD CONSTRAINT `WaterReading_deviceId_fkey` FOREIGN KEY (`deviceId`) REFERENCES `SensorDevice`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WaterThreshold` ADD CONSTRAINT `WaterThreshold_pondId_fkey` FOREIGN KEY (`pondId`) REFERENCES `Pond`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MaintenanceSchedule` ADD CONSTRAINT `MaintenanceSchedule_pondId_fkey` FOREIGN KEY (`pondId`) REFERENCES `Pond`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MaintenanceSchedule` ADD CONSTRAINT `MaintenanceSchedule_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Alert` ADD CONSTRAINT `Alert_pondId_fkey` FOREIGN KEY (`pondId`) REFERENCES `Pond`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Alert` ADD CONSTRAINT `Alert_scheduleId_fkey` FOREIGN KEY (`scheduleId`) REFERENCES `MaintenanceSchedule`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Alert` ADD CONSTRAINT `Alert_readingId_fkey` FOREIGN KEY (`readingId`) REFERENCES `WaterReading`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Notification` ADD CONSTRAINT `Notification_alertId_fkey` FOREIGN KEY (`alertId`) REFERENCES `Alert`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Notification` ADD CONSTRAINT `Notification_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PushDevice` ADD CONSTRAINT `PushDevice_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OperationalActivity` ADD CONSTRAINT `OperationalActivity_pondId_fkey` FOREIGN KEY (`pondId`) REFERENCES `Pond`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OperationalActivity` ADD CONSTRAINT `OperationalActivity_alertId_fkey` FOREIGN KEY (`alertId`) REFERENCES `Alert`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OperationalActivity` ADD CONSTRAINT `OperationalActivity_recordedById_fkey` FOREIGN KEY (`recordedById`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OperationalActivity` ADD CONSTRAINT `OperationalActivity_assignedToId_fkey` FOREIGN KEY (`assignedToId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OperationalActivity` ADD CONSTRAINT `OperationalActivity_performedById_fkey` FOREIGN KEY (`performedById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Expense` ADD CONSTRAINT `Expense_activityId_fkey` FOREIGN KEY (`activityId`) REFERENCES `OperationalActivity`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

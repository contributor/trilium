"use strict";

const dateUtils = require('./date_utils');
const optionService = require('./options');
const fs = require('fs-extra');
const dataDir = require('./data_dir');
const log = require('./log');
const syncMutexService = require('./sync_mutex');
const cls = require('./cls');
const sql = require('./sql');

const backupSchedulerIntervalInSeconds = 4 * 60 * 60;

function regularBackup() {
    cls.init(() => {
        periodBackup('lastDailyBackupDate', 'daily', 24 * 3600, backupSchedulerIntervalInSeconds);

        periodBackup('lastWeeklyBackupDate', 'weekly', 7 * 24 * 3600, backupSchedulerIntervalInSeconds);

        periodBackup('lastMonthlyBackupDate', 'monthly', 30 * 24 * 3600, backupSchedulerIntervalInSeconds);
    });
}

function isBackupEnabled(backupType) {
    const optionName = `${backupType}BackupEnabled`;

    return optionService.getOptionBool(optionName);
}

function periodBackup(optionName, backupType, periodInSeconds, allowEarlierBackupInSeconds) {
    if (!isBackupEnabled(backupType)) {
        return;
    }

    if (backupType === 'daily') {
        log.info("Checking if daily-backup is needed");
    }

    const now = new Date();
    const lastBackupDate = dateUtils.parseDateTime(optionService.getOption(optionName));

    if (now.getTime() - lastBackupDate.getTime() > (periodInSeconds - allowEarlierBackupInSeconds) * 1000) {
        backupNow(backupType);

        optionService.setOption(optionName, dateUtils.utcNowDateTime());
    }
}

async function backupNow(name) {
    // we don't want to back up DB in the middle of sync with potentially inconsistent DB state
    return await syncMutexService.doExclusively(async () => {
        const backupFile = `${dataDir.BACKUP_DIR}/backup-${name}.db`;

        await sql.copyDatabase(backupFile);

        log.info(`Created backup at ${backupFile}`);

        return backupFile;
    });
}

if (!fs.existsSync(dataDir.BACKUP_DIR)) {
    fs.mkdirSync(dataDir.BACKUP_DIR, 0o700);
}

module.exports = {
    backupNow,
    regularBackup,
    backupSchedulerIntervalInSeconds
};

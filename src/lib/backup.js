// Automatic backup utilities
import { leadsDB } from './db';
import { exportToCSV } from './export';

const BACKUP_INTERVAL_DAYS = 7; // Remind user to backup every 7 days
const LAST_BACKUP_KEY = 'lastBackupDate';

export const backupUtils = {
  /**
   * Check if backup reminder should be shown
   */
  shouldShowBackupReminder() {
    const lastBackup = localStorage.getItem(LAST_BACKUP_KEY);
    if (!lastBackup) return true;

    const daysSinceBackup = (Date.now() - new Date(lastBackup).getTime()) / (1000 * 60 * 60 * 24);
    return daysSinceBackup >= BACKUP_INTERVAL_DAYS;
  },

  /**
   * Mark backup as completed
   */
  markBackupComplete() {
    localStorage.setItem(LAST_BACKUP_KEY, new Date().toISOString());
  },

  /**
   * Get days since last backup
   */
  getDaysSinceBackup() {
    const lastBackup = localStorage.getItem(LAST_BACKUP_KEY);
    if (!lastBackup) return null;

    return Math.floor((Date.now() - new Date(lastBackup).getTime()) / (1000 * 60 * 60 * 24));
  },

  /**
   * Quick backup to CSV
   */
  async quickBackup() {
    const leads = await leadsDB.getAll();
    if (leads.length === 0) {
      throw new Error('No leads to backup');
    }

    exportToCSV(leads);
    this.markBackupComplete();
    return leads.length;
  },

  /**
   * Get storage usage estimate
   */
  async getStorageEstimate() {
    if (navigator.storage && navigator.storage.estimate) {
      const estimate = await navigator.storage.estimate();
      const usage = estimate.usage || 0;
      const quota = estimate.quota || 0;
      const percentUsed = quota > 0 ? (usage / quota) * 100 : 0;

      return {
        usage: (usage / 1024 / 1024).toFixed(2), // MB
        quota: (quota / 1024 / 1024).toFixed(2), // MB
        percentUsed: percentUsed.toFixed(1)
      };
    }
    return null;
  },

  /**
   * Check if storage is persistent
   */
  async isStoragePersistent() {
    if (navigator.storage && navigator.storage.persisted) {
      return await navigator.storage.persisted();
    }
    return false;
  }
};

export default backupUtils;

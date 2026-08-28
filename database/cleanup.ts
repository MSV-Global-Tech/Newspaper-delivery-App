/**
 * Automatic Data Cleanup - 30 Day Retention Policy
 *
 * Automatically deletes screenshots older than 30 days to keep storage usage low.
 * This helps stay within Firebase free tier storage limits.
 *
 * Usage:
 * - Call cleanupOldScreenshots() from admin dashboard
 * - Set up to run weekly/monthly
 * - Can be automated with Cloud Functions (Blaze plan)
 */

import { collection, getDocs, query, where, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from './firebase';

const SCREENSHOT_RETENTION_DAYS = 30;

/**
 * Calculate the cutoff date (30 days ago)
 */
function getCutoffDate(): Date {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - SCREENSHOT_RETENTION_DAYS);
  return cutoff;
}

/**
 * Get date from various timestamp formats
 */
function getDateFromTimestamp(timestamp: any): Date | null {
  if (!timestamp) return null;

  // Handle Firestore Timestamp
  if (timestamp.toDate && typeof timestamp.toDate === 'function') {
    return timestamp.toDate();
  }

  // Handle ISO string
  if (typeof timestamp === 'string') {
    return new Date(timestamp);
  }

  // Handle milliseconds
  if (typeof timestamp === 'number') {
    return new Date(timestamp);
  }

  return null;
}

/**
 * Check if a screenshot is older than 30 days
 */
function isScreenshotOld(date: Date): boolean {
  const cutoff = getCutoffDate();
  return date < cutoff;
}

/**
 * Cleanup old screenshots from bills collection
 */
async function cleanupBillScreenshots(): Promise<{ cleaned: number; errors: number }> {
  let cleaned = 0;
  let errors = 0;

  try {
    const billsSnapshot = await getDocs(collection(db, 'bills'));

    for (const billDoc of billsSnapshot.docs) {
      try {
        const billData = billDoc.data();
        const billDate = getDateFromTimestamp(billData.date);

        if (!billDate) continue;

        // Check if bill is older than 30 days
        if (isScreenshotOld(billDate)) {
          const updates: any = {};

          // Remove payment screenshot if exists
          if (billData.paymentScreenshot) {
            updates.paymentScreenshot = null;
            cleaned++;
          }

          // Remove claimed paid amount if exists (optional)
          if (billData.claimedPaidAmount) {
            updates.claimedPaidAmount = null;
          }

          // Apply updates if any fields to remove
          if (Object.keys(updates).length > 0) {
            await updateDoc(doc(db, 'bills', billDoc.id), updates);
            console.log(`[Cleanup] Removed screenshot from bill ${billDoc.id} (dated ${billDate.toISOString()})`);
          }
        }
      } catch (error) {
        console.error(`[Cleanup] Error processing bill ${billDoc.id}:`, error);
        errors++;
      }
    }
  } catch (error) {
    console.error('[Cleanup] Error fetching bills:', error);
    errors++;
  }

  return { cleaned, errors };
}

/**
 * Cleanup old screenshots from payments collection (if exists)
 */
async function cleanupPaymentScreenshots(): Promise<{ cleaned: number; errors: number }> {
  let cleaned = 0;
  let errors = 0;

  try {
    const paymentsSnapshot = await getDocs(collection(db, 'payments'));

    for (const paymentDoc of paymentsSnapshot.docs) {
      try {
        const paymentData = paymentDoc.data();
        const paymentDate = getDateFromTimestamp(paymentData.date);

        if (!paymentDate) continue;

        // Check if payment is older than 30 days
        if (isScreenshotOld(paymentDate)) {
          const updates: any = {};

          // Remove screenshot if exists
          if (paymentData.screenshot) {
            updates.screenshot = null;
            cleaned++;
          }

          // Apply updates if any fields to remove
          if (Object.keys(updates).length > 0) {
            await updateDoc(doc(db, 'payments', paymentDoc.id), updates);
            console.log(`[Cleanup] Removed screenshot from payment ${paymentDoc.id} (dated ${paymentDate.toISOString()})`);
          }
        }
      } catch (error) {
        console.error(`[Cleanup] Error processing payment ${paymentDoc.id}:`, error);
        errors++;
      }
    }
  } catch (error) {
    console.error('[Cleanup] Error fetching payments:', error);
    errors++;
  }

  return { cleaned, errors };
}

/**
 * Get storage usage estimate
 */
export async function getStorageUsage(): Promise<{
  totalBills: number;
  billsWithScreenshots: number;
  totalPayments: number;
  paymentsWithScreenshots: number;
  estimatedSizeMB: number;
}> {
  let totalBills = 0;
  let billsWithScreenshots = 0;
  let totalPayments = 0;
  let paymentsWithScreenshots = 0;

  try {
    const billsSnapshot = await getDocs(collection(db, 'bills'));
    totalBills = billsSnapshot.size;
    billsWithScreenshots = billsSnapshot.docs.filter(doc => doc.data().paymentScreenshot).length;

    const paymentsSnapshot = await getDocs(collection(db, 'payments'));
    totalPayments = paymentsSnapshot.size;
    paymentsWithScreenshots = paymentsSnapshot.docs.filter(doc => doc.data().screenshot).length;
  } catch (error) {
    console.error('[Cleanup] Error getting storage usage:', error);
  }

  // Estimate: ~200KB per screenshot
  const totalScreenshots = billsWithScreenshots + paymentsWithScreenshots;
  const estimatedSizeMB = Math.round((totalScreenshots * 200) / 1024);

  return {
    totalBills,
    billsWithScreenshots,
    totalPayments,
    paymentsWithScreenshots,
    estimatedSizeMB,
  };
}

/**
 * Main cleanup function - removes screenshots older than 30 days
 * Call this from admin dashboard or schedule it
 */
export async function cleanupOldScreenshots(): Promise<{
  success: boolean;
  billsCleaned: number;
  paymentsCleaned: number;
  totalCleaned: number;
  errors: number;
  storageBeforeMB: number;
  storageAfterMB: number;
  message: string;
}> {
  console.log('[Cleanup] Starting 30-day screenshot cleanup...');

  // Get storage usage before
  const before = await getStorageUsage();

  // Cleanup bills
  const billsResult = await cleanupBillScreenshots();

  // Cleanup payments
  const paymentsResult = await cleanupPaymentScreenshots();

  // Get storage usage after
  const after = await getStorageUsage();

  const totalCleaned = billsResult.cleaned + paymentsResult.cleaned;
  const totalErrors = billsResult.errors + paymentsResult.errors;

  const message = totalCleaned > 0
    ? `Successfully cleaned ${totalCleaned} old screenshots (${before.estimatedSizeMB}MB → ${after.estimatedSizeMB}MB)`
    : 'No old screenshots found to clean';

  console.log(`[Cleanup] Complete: ${message}`);

  return {
    success: totalErrors === 0,
    billsCleaned: billsResult.cleaned,
    paymentsCleaned: paymentsResult.cleaned,
    totalCleaned,
    errors: totalErrors,
    storageBeforeMB: before.estimatedSizeMB,
    storageAfterMB: after.estimatedSizeMB,
    message,
  };
}

/**
 * Get cleanup statistics (without actually cleaning)
 */
export async function getCleanupStats(): Promise<{
  billsOlderThan30Days: number;
  paymentsOlderThan30Days: number;
  totalOldScreenshots: number;
  storageToFreeMB: number;
  cutoffDate: Date;
}> {
  const cutoff = getCutoffDate();
  let billsOlderThan30Days = 0;
  let paymentsOlderThan30Days = 0;

  try {
    const billsSnapshot = await getDocs(collection(db, 'bills'));
    for (const billDoc of billsSnapshot.docs) {
      const billData = billDoc.data();
      const billDate = getDateFromTimestamp(billData.date);

      if (billDate && isScreenshotOld(billDate) && billData.paymentScreenshot) {
        billsOlderThan30Days++;
      }
    }

    const paymentsSnapshot = await getDocs(collection(db, 'payments'));
    for (const paymentDoc of paymentsSnapshot.docs) {
      const paymentData = paymentDoc.data();
      const paymentDate = getDateFromTimestamp(paymentData.date);

      if (paymentDate && isScreenshotOld(paymentDate) && paymentData.screenshot) {
        paymentsOlderThan30Days++;
      }
    }
  } catch (error) {
    console.error('[Cleanup] Error getting cleanup stats:', error);
  }

  const totalOldScreenshots = billsOlderThan30Days + paymentsOlderThan30Days;
  const storageToFreeMB = Math.round((totalOldScreenshots * 200) / 1024);

  return {
    billsOlderThan30Days,
    paymentsOlderThan30Days,
    totalOldScreenshots,
    storageToFreeMB,
    cutoffDate: cutoff,
  };
}

/**
 * Cleanup specific bill screenshot (manual cleanup)
 */
export async function cleanupBillScreenshot(billId: string): Promise<boolean> {
  try {
    await updateDoc(doc(db, 'bills', billId), {
      paymentScreenshot: null,
      claimedPaidAmount: null,
    });
    console.log(`[Cleanup] Manually cleaned bill ${billId}`);
    return true;
  } catch (error) {
    console.error(`[Cleanup] Error cleaning bill ${billId}:`, error);
    return false;
  }
}

/**
 * Change retention period (if you want different than 30 days)
 */
export function setRetentionDays(days: number): void {
  // This would need to be stored in config/environment
  console.log(`[Cleanup] Retention period set to ${days} days`);
  // For now, just log it - you can make this configurable later
}

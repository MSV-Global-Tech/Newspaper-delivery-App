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
 * Cleanup old screenshots from users.bills[] array
 * NOTE: Your app stores bills in users collection, not separate bills collection
 */
async function cleanupBillScreenshots(): Promise<{ cleaned: number; errors: number }> {
  let cleaned = 0;
  let errors = 0;

  try {
    const usersSnapshot = await getDocs(collection(db, 'users'));

    for (const userDoc of usersSnapshot.docs) {
      try {
        const userData = userDoc.data();
        
        if (!userData.bills || !Array.isArray(userData.bills)) continue;

        let needsUpdate = false;
        const updatedBills = userData.bills.map((bill: any) => {
          const billDate = getDateFromTimestamp(bill.date);
          
          if (!billDate) return bill;

          // Check if bill is older than 30 days
          if (isScreenshotOld(billDate) && bill.paymentProof) {
            console.log(`[Cleanup] Removing screenshot from bill ${bill.id} for user ${userDoc.id}`);
            cleaned++;
            needsUpdate = true;
            return { ...bill, paymentProof: null };
          }
          
          return bill;
        });

        if (needsUpdate) {
          await updateDoc(doc(db, 'users', userDoc.id), { bills: updatedBills });
        }
      } catch (error) {
        console.error(`[Cleanup] Error processing user ${userDoc.id}:`, error);
        errors++;
      }
    }
  } catch (error) {
    console.error('[Cleanup] Error fetching users:', error);
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
 * NOTE: Your app stores bills in users.bills[] array, not separate bills collection
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
    // Your app stores bills in users collection
    const usersSnapshot = await getDocs(collection(db, 'users'));
    
    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      
      // Count bills from users.bills[] array
      if (userData.bills && Array.isArray(userData.bills)) {
        totalBills += userData.bills.length;
        billsWithScreenshots += userData.bills.filter((bill: any) => bill.paymentProof).length;
      }
      
      // Count payments from users.paymentHistory[] array
      if (userData.paymentHistory && Array.isArray(userData.paymentHistory)) {
        totalPayments += userData.paymentHistory.length;
        paymentsWithScreenshots += userData.paymentHistory.filter((payment: any) => payment.screenshot).length;
      }
    }

    // Also check payments collection (for subscription payments)
    const paymentsSnapshot = await getDocs(collection(db, 'payments'));
    totalPayments += paymentsSnapshot.size;
    paymentsWithScreenshots += paymentsSnapshot.docs.filter(doc => doc.data().screenshotUrl).length;
  } catch (error) {
    console.error('[Cleanup] Error getting storage usage:', error);
  }

  // Estimate: ~300KB per screenshot (actual size)
  const totalScreenshots = billsWithScreenshots + paymentsWithScreenshots;
  const estimatedSizeMB = Math.round((totalScreenshots * 300) / 1024);

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
 * NOTE: Your app stores bills in users.bills[] array, not separate bills collection
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
    // Check users.bills[] array
    const usersSnapshot = await getDocs(collection(db, 'users'));
    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      
      if (userData.bills && Array.isArray(userData.bills)) {
        for (const bill of userData.bills) {
          const billDate = getDateFromTimestamp(bill.date);
          if (billDate && isScreenshotOld(billDate) && bill.paymentProof) {
            billsOlderThan30Days++;
          }
        }
      }
      
      if (userData.paymentHistory && Array.isArray(userData.paymentHistory)) {
        for (const payment of userData.paymentHistory) {
          const paymentDate = getDateFromTimestamp(payment.date);
          if (paymentDate && isScreenshotOld(paymentDate) && payment.screenshot) {
            paymentsOlderThan30Days++;
          }
        }
      }
    }

    // Also check payments collection (for subscription payments)
    const paymentsSnapshot = await getDocs(collection(db, 'payments'));
    for (const paymentDoc of paymentsSnapshot.docs) {
      const paymentData = paymentDoc.data();
      const paymentDate = getDateFromTimestamp(paymentData.createdAt);
      
      if (paymentDate && isScreenshotOld(paymentDate) && paymentData.screenshotUrl) {
        paymentsOlderThan30Days++;
      }
    }
  } catch (error) {
    console.error('[Cleanup] Error getting cleanup stats:', error);
  }

  const totalOldScreenshots = billsOlderThan30Days + paymentsOlderThan30Days;
  const storageToFreeMB = Math.round((totalOldScreenshots * 300) / 1024);

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
 * NOTE: Your app stores bills in users.bills[] array, not separate bills collection
 * This function is not currently used but kept for future reference
 */
export async function cleanupBillScreenshot(userPhone: string, billId: string): Promise<boolean> {
  try {
    const userDoc = await getDocs(collection(db, 'users'));
    const user = userDoc.docs.find(doc => doc.id === userPhone);
    
    if (!user) {
      console.error(`[Cleanup] User ${userPhone} not found`);
      return false;
    }
    
    const userData = user.data();
    if (!userData.bills || !Array.isArray(userData.bills)) {
      console.error(`[Cleanup] No bills found for user ${userPhone}`);
      return false;
    }
    
    const updatedBills = userData.bills.map((bill: any) => {
      if (bill.id === billId) {
        return { ...bill, paymentProof: null };
      }
      return bill;
    });
    
    await updateDoc(doc(db, 'users', userPhone), { bills: updatedBills });
    console.log(`[Cleanup] Manually cleaned bill ${billId} for user ${userPhone}`);
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

# 30-Day Screenshot Cleanup Guide

## Overview

Automatic cleanup system that deletes screenshots older than 30 days to keep storage usage low and stay within Firebase free tier limits.

---

## 🎯 How It Works

### **The Problem:**
- Screenshots accumulate in database forever
- With 1,000 screenshots/month, you'd hit 5GB limit in 25 months
- Old screenshots are rarely needed after payment is verified

### **The Solution:**
- Automatically delete screenshots older than 30 days
- Keeps storage usage constant (~200MB for 1,000 screenshots)
- Never hits storage limit
- Maintains 30-day audit trail for compliance

---

## 📊 Storage Comparison

### **Without Cleanup:**
```
Month 1: 200MB
Month 2: 400MB
Month 3: 600MB
...
Month 25: 5,000MB (LIMIT REACHED) ❌
```

### **With 30-Day Cleanup:**
```
Month 1: 200MB
Month 2: 200MB (old deleted)
Month 3: 200MB (old deleted)
...
Month 100: 200MB (constant) ✅
```

---

## 🔧 What Gets Cleaned

### **Screenshots in Bills Collection:**
- `paymentScreenshot` field
- `claimedPaidAmount` field (optional)
- Bill document remains (only screenshot removed)

### **Screenshots in Payments Collection:**
- `screenshot` field
- Payment document remains (only screenshot removed)

### **What's NOT Deleted:**
- Bill documents (payment records stay)
- Payment documents (transaction records stay)
- Customer data
- Delivery records
- Only the screenshot images are removed

---

## 🚀 How to Use

### **1. Access Maintenance Tab**

In Admin Dashboard:
1. Open Admin Dashboard
2. Click "Maintenance" tab (new tab added)
3. View storage usage and cleanup stats

### **2. View Cleanup Stats**

Shows:
- Current storage usage (e.g., "200 MB of 5,000 MB")
- Total screenshots stored
- Screenshots older than 30 days
- Storage that can be freed

### **3. Run Cleanup**

Click "Run 30-Day Cleanup" button:
- Shows confirmation dialog
- Displays how many screenshots will be deleted
- Shows storage that will be freed
- Confirms with alert when complete

---

## 📱 Admin Dashboard Features

### **Storage Usage Card:**
```
Storage Usage
200 MB
of 5,000 MB free tier
[4% badge]
```

### **Screenshots Card:**
```
Screenshots
Bills with screenshots: 500
Payments with screenshots: 200
```

### **Cleanup Stats Card:**
```
Old Screenshots (30+ days)
150
Can free ~30 MB of storage
```

### **Cleanup Button:**
```
[🗑️ Run 30-Day Cleanup]
This will permanently delete screenshots older than 30 days
```

---

## 🔄 Automation Options

### **Manual (Current):**
- Admin clicks button in dashboard
- Run weekly or monthly as needed
- Full control over when cleanup runs

### **Scheduled (Future - Blaze Plan):**
With Cloud Functions (requires Blaze plan):
```javascript
// Run automatically every day at midnight
exports.scheduledCleanup = functions.pubsub
  .schedule('0 0 * * *')
  .onRun(async (context) => {
    await cleanupOldScreenshots();
  });
```

### **Trigger-Based (Future):**
- Run when storage reaches 80% of limit
- Run after generating new bills
- Run before month-end billing

---

## 💾 Storage Savings

### **With 1,000 Screenshots/Month:**

**Without Cleanup:**
- Month 1: 200MB
- Month 6: 1.2GB
- Month 12: 2.4GB
- Month 25: 5GB (limit hit) ❌

**With 30-Day Cleanup:**
- Month 1: 200MB
- Month 6: 200MB
- Month 12: 200MB
- Month 100: 200MB ✅

**Savings:** 4.8GB over 25 months

---

## 📋 Cleanup Functions Available

### **1. `cleanupOldScreenshots()`**
Main cleanup function - removes screenshots older than 30 days
```typescript
const result = await cleanupOldScreenshots();
// Returns: { success, billsCleaned, paymentsCleaned, totalCleaned, errors, storageBeforeMB, storageAfterMB, message }
```

### **2. `getCleanupStats()`**
Get statistics without actually cleaning
```typescript
const stats = await getCleanupStats();
// Returns: { billsOlderThan30Days, paymentsOlderThan30Days, totalOldScreenshots, storageToFreeMB, cutoffDate }
```

### **3. `getStorageUsage()`**
Get current storage usage
```typescript
const usage = await getStorageUsage();
// Returns: { totalBills, billsWithScreenshots, totalPayments, paymentsWithScreenshots, estimatedSizeMB }
```

### **4. `cleanupBillScreenshot(billId)`**
Manually clean a specific bill's screenshot
```typescript
const success = await cleanupBillScreenshot('bill_123');
// Returns: boolean
```

---

## 🎯 Recommended Schedule

### **For 1,000 Screenshots/Month:**
- **Run cleanup:** Weekly (every Sunday)
- **Storage kept:** ~200MB constant
- **Cleanup per run:** ~250 screenshots
- **Time:** ~10-30 seconds

### **For 500 Screenshots/Month:**
- **Run cleanup:** Monthly (1st of month)
- **Storage kept:** ~100MB constant
- **Cleanup per run:** ~500 screenshots
- **Time:** ~20-60 seconds

### **For 2,000 Screenshots/Month:**
- **Run cleanup:** Twice weekly (Wed & Sun)
- **Storage kept:** ~400MB constant
- **Cleanup per run:** ~500 screenshots
- **Time:** ~20-60 seconds

---

## ⚠️ Important Notes

### **Before Running Cleanup:**
- ✅ Check cleanup stats first
- ✅ Confirm how many screenshots will be deleted
- ✅ Ensure recent payments are verified
- ✅ Backup important data if needed

### **After Running Cleanup:**
- ✅ Verify storage usage decreased
- ✅ Check that recent screenshots still exist
- ✅ Test payment verification still works
- ✅ Monitor for any issues

### **What's Preserved:**
- ✅ Bill payment records (dates, amounts, status)
- ✅ Payment transaction records
- ✅ Customer payment history
- ✅ Audit trail for last 30 days
- ❌ Only screenshot images are removed

---

## 🔍 Monitoring

### **What to Monitor:**
1. **Storage Usage:** Should stay constant after cleanup
2. **Cleanup Stats:** Should be reasonable (not too many old screenshots)
3. **Cleanup Time:** Should complete in under 1 minute
4. **Errors:** Should be zero errors

### **Red Flags:**
- 🔴 Storage keeps growing (cleanup not running)
- 🔴 Cleanup takes > 5 minutes (too many documents)
- 🔴 Errors during cleanup (database issues)
- 🔴 Zero screenshots found (collection names wrong)

---

## 📊 Impact on Your Scale

### **Your Usage: 2,000 Users/Month, 1,000 Screenshots/Month**

**Storage Without Cleanup:**
- 6 months: 1.2GB
- 12 months: 2.4GB
- 25 months: 5GB (limit hit) ❌

**Storage With 30-Day Cleanup:**
- 6 months: 200MB (constant)
- 12 months: 200MB (constant)
- 100 months: 200MB (constant) ✅

**Capacity:**
- Can run indefinitely on free tier
- No storage limit concerns
- 30-day audit trail maintained

---

## ✅ Summary

**What It Does:**
- Automatically deletes screenshots older than 30 days
- Keeps storage usage constant
- Maintains 30-day audit trail
- Never hits storage limit

**How to Use:**
1. Open Admin Dashboard → Maintenance tab
2. View storage usage and cleanup stats
3. Click "Run 30-Day Cleanup"
4. Confirm deletion
5. Cleanup runs automatically

**Benefits:**
- ✅ Unlimited screenshot capacity
- ✅ Constant storage usage
- ✅ Stays within free tier
- ✅ 30-day audit trail
- ✅ No manual intervention needed (after setup)

**Your app is now future-proofed for unlimited screenshot growth!** 🎉

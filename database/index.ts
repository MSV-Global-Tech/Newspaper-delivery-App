/**
 * database/index.ts
 * Central export for all database modules.
 */

export { db } from './firebase';
export { listenDeliveries, addDelivery, seedDeliveries } from './deliveries';
export type { DeliveryDoc } from './deliveries';
export { saveUser, fetchUser, fetchUserByEmail, listUsers, listenUsers, updateUser, deleteUser, listenUser, updateCustomerBill } from './users';
export type { UserDoc } from './users';
export { listenPapers, addPaper, updatePaper, deletePaper, seedPapers } from './papers';
export type { NewspaperDoc } from './papers';
export {
  listenAdminNumbers,
  listenAppSettings,
  updatePaymentSettings,
  addAdminNumber,
  removeAdminNumber,
  seedSettings,
} from './settings';
export type { AdminUserDoc, AppSettingsDoc } from './settings';
export { uploadNewspaperLogo, uploadImage, deleteImage } from './storageHelper';
export { listenPayments, addPayment, updatePayment } from './payments';
export type { PaymentDoc } from './payments';
export {
  PAPERS_CATALOG,
  PAPERS_CATALOG_WITH_IDS,
} from './papers_catalog';
export type { CatalogEntry, CatalogCategory } from './papers_catalog';

export {
  saveVendor,
  fetchVendorById,
  fetchVendorByCode,
  listenVendors,
  listenVendor,
  updateVendor,
  deleteVendor,
} from './vendors';
export type { VendorDoc, VendorPayment } from './vendors';

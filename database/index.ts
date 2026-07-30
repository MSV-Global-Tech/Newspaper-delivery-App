/**
 * database/index.ts
 * Central export for all database modules.
 */

export { db } from './firebase';
export { listenDeliveries, addDelivery, updateDeliveryStatus, seedDeliveries } from './deliveries';
export type { DeliveryDoc } from './deliveries';
export { listenPapers, addPaper, updatePaper, deletePaper, seedPapers } from './papers';
export type { NewspaperDoc } from './papers';
export { listenAdminNumbers, addAdminNumber, removeAdminNumber, seedSettings } from './settings';
export type { AdminUserDoc } from './settings';
export { saveUser, fetchUser, deleteUser } from './users';
export type { UserDoc } from './users';
export { uploadNewspaperLogo, uploadImage, deleteImage } from './storageHelper';
export { listenAgents, addAgent, updateAgent, deleteAgent, seedAgents } from './agents';
export type { AgentDoc } from './agents';
export { listenPayments, addPayment, updatePayment } from './payments';
export type { PaymentDoc } from './payments';
export {
  PAPERS_CATALOG,
  PAPERS_CATALOG_WITH_IDS,
} from './papers_catalog';
export type { CatalogEntry, CatalogCategory } from './papers_catalog';
export { placeOrder, listenCustomerOrders } from './orders';
export type { OrderDoc } from './orders';

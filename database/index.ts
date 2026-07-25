/**
 * database/index.ts
 * Central export for all database modules.
 */

export { db } from './firebase';
export { listenDeliveries, addDelivery, updateDeliveryStatus, seedDeliveries } from './deliveries';
export type { DeliveryDoc } from './deliveries';
export { listenPapers, addPaper, deletePaper, seedPapers } from './papers';
export type { NewspaperDoc } from './papers';
export { listenAdminNumbers, addAdminNumber, removeAdminNumber, seedSettings } from './settings';
export { saveUser, fetchUser, deleteUser } from './users';
export type { UserDoc } from './users';
export { uploadNewspaperLogo, uploadImage, deleteImage } from './storageHelper';
export { listenAgents, addAgent, updateAgent, deleteAgent, seedAgents } from './agents';
export type { AgentDoc } from './agents';

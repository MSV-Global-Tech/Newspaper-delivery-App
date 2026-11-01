/**
 * utils/passwordHash.ts
 * Simple password hashing for security (FREE, no external dependencies)
 * Uses custom hash function compatible with React Native
 */

const SALT = 'newspaper-delivery-salt-2024';

export async function hashPassword(password: string): Promise<string> {
  try {
    // Use simple hash function that works in React Native
    return simpleHash(password + SALT);
  } catch (error) {
    console.error('Password hashing error:', error);
    return simpleHash(password + SALT);
  }
}

function simpleHash(str: string): string {
  let hash = 0;
  if (str.length === 0) return hash.toString();
  
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  // Add some complexity by mixing the result
  let result = Math.abs(hash).toString(16);
  
  // Double hash for better security
  let hash2 = 0;
  for (let i = 0; i < result.length; i++) {
    const char = result.charCodeAt(i);
    hash2 = ((hash2 << 5) - hash2) + char;
    hash2 = hash2 & hash2;
  }
  
  return Math.abs(hash2).toString(16) + result;
}

export async function verifyPassword(inputPassword: string, storedHash: string): Promise<boolean> {
  const inputHash = await hashPassword(inputPassword);
  return inputHash === storedHash;
}

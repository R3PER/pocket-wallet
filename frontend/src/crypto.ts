// PBKDF2 configuration for password hashing and key derivation
const PBKDF2_CONFIG = {
  iterations: 100000,  // iterations
  hashLen: 32,        // hash length in bytes
  algorithm: 'SHA-256'
};

// Generate random salt (16 bytes)
export function generateSalt(): string {
  const salt = new Uint8Array(16);
  crypto.getRandomValues(salt);
  return btoa(String.fromCharCode(...salt));
}

// Generate PBKDF2 hash for password authentication
export async function generatePasswordHash(password: string, salt: string): Promise<string> {
  const saltBytes = Uint8Array.from(atob(salt), c => c.charCodeAt(0));
  const encoder = new TextEncoder();
  const passwordBytes = encoder.encode(password);
  
  // Import password as key material
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    passwordBytes,
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );
  
  // Derive hash using PBKDF2
  const hashBuffer = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: saltBytes,
      iterations: PBKDF2_CONFIG.iterations,
      hash: PBKDF2_CONFIG.algorithm
    },
    keyMaterial,
    PBKDF2_CONFIG.hashLen * 8 // bits
  );
  
  // Convert to base64 string with prefix
  const hashArray = new Uint8Array(hashBuffer);
  const hashBase64 = btoa(String.fromCharCode(...hashArray));
  return `pbkdf2_sha256$${PBKDF2_CONFIG.iterations}$${salt}$${hashBase64}`;
}

// Generate AES-256 key from password using PBKDF2
export async function deriveEncryptionKey(password: string, salt: string): Promise<CryptoKey> {
  const saltBytes = Uint8Array.from(atob(salt), c => c.charCodeAt(0));
  const encoder = new TextEncoder();
  const passwordBytes = encoder.encode(password);
  
  // Import password as key material
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    passwordBytes,
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );
  
  // Derive AES key using PBKDF2
  return await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltBytes,
      iterations: PBKDF2_CONFIG.iterations,
      hash: PBKDF2_CONFIG.algorithm
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

// Encrypt data using AES-256-GCM
export async function encryptData(data: string, key: CryptoKey): Promise<string> {
  const encoder = new TextEncoder();
  const dataBytes = encoder.encode(data);
  
  // Generate random IV (12 bytes for GCM)
  const iv = new Uint8Array(12);
  crypto.getRandomValues(iv);
  
  // Encrypt the data
  const encrypted = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv
    },
    key,
    dataBytes
  );
  
  // Combine IV + encrypted data
  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(encrypted), iv.length);
  
  // Return base64 encoded result
  return btoa(String.fromCharCode(...combined));
}

// Decrypt data using AES-256-GCM
export async function decryptData(encryptedData: string, key: CryptoKey): Promise<string> {
  try {
    // Decode base64
    const combined = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));
    
    // Extract IV (first 12 bytes) and encrypted data
    const iv = combined.slice(0, 12);
    const encrypted = combined.slice(12);
    
    // Decrypt the data
    const decrypted = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      key,
      encrypted
    );
    
    // Convert back to string
    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  } catch (error) {
    throw new Error('Failed to decrypt data: Invalid key or corrupted data');
  }
}

// Verify password hash
export async function verifyPassword(password: string, salt: string, storedHash: string): Promise<boolean> {
  try {
    const computedHash = await generatePasswordHash(password, salt);
    return computedHash === storedHash;
  } catch (error) {
    return false;
  }
}

// Generate secure random string for session tokens
export function generateSecureToken(length: number = 32): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array)).replace(/[+/=]/g, '').substring(0, length);
}

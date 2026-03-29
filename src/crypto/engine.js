/**
 * SecureVault Crypto Engine
 * Algorithm: AES-256-GCM + PBKDF2-HMAC-SHA512
 * 
 * Blob Format: [16B Salt] + [12B IV] + [Ciphertext+AuthTag]
 * The AuthTag (16 bytes) is appended at the end by WebCrypto automatically.
 */

const PBKDF2_ITERATIONS = 600_000;
const SALT_BYTES = 16;
const IV_BYTES = 12;
const SECUREVAULT_HEADER = 'SVLT1:'; // Magic prefix to detect SecureVault blobs

/**
 * Derives a 256-bit AES key from a password + salt using PBKDF2-HMAC-SHA-512.
 */
async function deriveKey(password, salt) {
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);

  const importedKey = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-512',
    },
    importedKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Converts an ArrayBuffer to a Base64 string.
 */
function bufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  bytes.forEach(b => (binary += String.fromCharCode(b)));
  return btoa(binary);
}

/**
 * Converts a Base64 string to an ArrayBuffer.
 */
function base64ToBuffer(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Detects if a string is a SecureVault encrypted blob.
 */
export function isSecureVaultBlob(text) {
  return typeof text === 'string' && text.trimStart().startsWith(SECUREVAULT_HEADER);
}

/**
 * ENCRYPT — Takes plaintext + password, returns a Base64 encoded vault blob.
 */
export async function encryptData(plaintext, password) {
  if (!plaintext || plaintext.trim() === '') throw new Error('Input text cannot be empty.');
  if (!password || password.length === 0) throw new Error('Password cannot be empty.');

  const encoder = new TextEncoder();
  const data = encoder.encode(plaintext);

  // Generate cryptographically random Salt and IV
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));

  const key = await deriveKey(password, salt);

  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    data
  );

  // Package: Salt + IV + Ciphertext (includes Auth Tag at end)
  const combined = new Uint8Array(SALT_BYTES + IV_BYTES + ciphertext.byteLength);
  combined.set(salt, 0);
  combined.set(iv, SALT_BYTES);
  combined.set(new Uint8Array(ciphertext), SALT_BYTES + IV_BYTES);

  return SECUREVAULT_HEADER + bufferToBase64(combined.buffer);
}

/**
 * DECRYPT — Takes a vault blob + password, returns plaintext.
 * Throws a typed error so UI can distinguish wrong password vs. bad format.
 */
export async function decryptData(vaultBlob, password) {
  if (!vaultBlob || vaultBlob.trim() === '') throw new Error('Input text cannot be empty.');
  if (!password || password.length === 0) throw new Error('Password cannot be empty.');

  const trimmed = vaultBlob.trim();

  if (!trimmed.startsWith(SECUREVAULT_HEADER)) {
    const err = new Error('This does not appear to be a SecureVault encrypted file. Invalid format.');
    err.code = 'INVALID_FORMAT';
    throw err;
  }

  const base64Part = trimmed.slice(SECUREVAULT_HEADER.length);

  let combinedBuffer;
  try {
    combinedBuffer = base64ToBuffer(base64Part);
  } catch {
    const err = new Error('The encrypted data is corrupted or has been tampered with.');
    err.code = 'CORRUPTED';
    throw err;
  }

  const combined = new Uint8Array(combinedBuffer);

  if (combined.length < SALT_BYTES + IV_BYTES + 16) {
    const err = new Error('The encrypted data is too short to be valid. It may be corrupted.');
    err.code = 'CORRUPTED';
    throw err;
  }

  const salt = combined.slice(0, SALT_BYTES);
  const iv = combined.slice(SALT_BYTES, SALT_BYTES + IV_BYTES);
  const ciphertext = combined.slice(SALT_BYTES + IV_BYTES);

  const key = await deriveKey(password, salt);

  try {
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      ciphertext
    );
    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  } catch {
    // AES-GCM auth tag mismatch = wrong password or tampered file
    const err = new Error(
      'Decryption failed. The password is incorrect or the file has been tampered with.'
    );
    err.code = 'AUTH_FAILED';
    throw err;
  }
}

/**
 * Password strength scorer — returns 0-4.
 * 0: Very Weak, 1: Weak, 2: Fair, 3: Strong, 4: Very Strong
 */
export function scorePassword(password) {
  if (!password) return 0;
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 14) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  return Math.min(score, 4);
}

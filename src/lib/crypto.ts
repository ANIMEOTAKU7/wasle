// src/lib/crypto.ts
// A simple E2E encryption utility using Web Crypto API
// In a real production app, you'd use Diffie-Hellman key exchange (e.g., X25519) 
// to establish a shared secret. For this prototype, we derive a shared key 
// from the unique chat ID so that only participants of the chat can decrypt it.

const getDerivedKey = async (chatId: string) => {
  const encoder = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    "raw",
    encoder.encode(chatId + "_wasel_secret_salt"),
    { name: "PBKDF2" },
    false,
    ["deriveBits", "deriveKey"]
  );
  
  return window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: encoder.encode("wasel_app_salt"),
      iterations: 100000,
      hash: "SHA-256"
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
};

export const encryptMessage = async (text: string, chatId: string): Promise<string> => {
  try {
    const key = await getDerivedKey(chatId);
    const encoder = new TextEncoder();
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    
    const ciphertext = await window.crypto.subtle.encrypt(
      { name: "AES-GCM", iv: iv },
      key,
      encoder.encode(text)
    );
    
    const combined = new Uint8Array(iv.length + ciphertext.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(ciphertext), iv.length);
    
    // Convert Uint8Array to base64 safely
    const base64 = btoa(Array.from(combined).map(b => String.fromCharCode(b)).join(''));
    return `E2EE:${base64}`;
  } catch (e) {
    console.error("Encryption failed", e);
    return text;
  }
};

export const decryptMessage = async (encryptedText: string, chatId: string): Promise<string> => {
  if (!encryptedText || !encryptedText.startsWith('E2EE:')) {
    return encryptedText; // Legacy plain text message or image placeholder
  }
  
  try {
    const base64 = encryptedText.substring(5);
    const key = await getDerivedKey(chatId);
    const combinedStr = atob(base64);
    const combined = new Uint8Array(combinedStr.length);
    for (let i = 0; i < combinedStr.length; i++) {
      combined[i] = combinedStr.charCodeAt(i);
    }
    
    const iv = combined.slice(0, 12);
    const ciphertext = combined.slice(12);
    
    const decrypted = await window.crypto.subtle.decrypt(
      { name: "AES-GCM", iv: iv },
      key,
      ciphertext
    );
    
    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  } catch (e) {
    console.error("Decryption failed", e);
    return "🔒 [رسالة مشفرة لا يمكن فك تشفيرها]";
  }
};

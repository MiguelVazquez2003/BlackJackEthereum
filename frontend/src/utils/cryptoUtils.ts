// src/utils/cryptoUtils.ts

export const generateKeyPair = async () => {
  const { publicKey, privateKey } = await window.crypto.subtle.generateKey(
    {
      name: 'RSA-OAEP',
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-256',
    },
    true,
    ['encrypt', 'decrypt']
  );
  return { publicKey, privateKey };
};




export const exportKey = async (key: CryptoKey) => {
  return await window.crypto.subtle.exportKey('spki', key); // Export public key
};






// New functions for certificate exports
export const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
};





export const exportPublicKeyAsPEM = async (publicKey: CryptoKey): Promise<string> => {
  const exported = await window.crypto.subtle.exportKey('spki', publicKey);
  const b64 = arrayBufferToBase64(exported);
  return `${b64.match(/.{1,64}/g)?.join('\n')}`;
};






export const exportPrivateKeyAsJSON = async (
  encryptedPrivateKey: ArrayBuffer, 
  iv: Uint8Array, 
  salt: Uint8Array
): Promise<string> => {
  return JSON.stringify({
    encryptedPrivateKey: arrayBufferToBase64(encryptedPrivateKey),
    iv: arrayBufferToBase64(iv.buffer),
    salt: arrayBufferToBase64(salt.buffer)
  }, null, 2);
};





export const encryptWithPassword = async (password: string, privateKey: CryptoKey) => {
  // Convert CryptoKey to JWK for serialization
  const privateKeyJwk = await window.crypto.subtle.exportKey('jwk', privateKey);
  const privateKeyStr = JSON.stringify(privateKeyJwk);
  
  const encoder = new TextEncoder();
  const passwordKey = await window.crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );
  const salt = window.crypto.getRandomValues(new Uint8Array(16));

  const key = await window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    passwordKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );

  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encryptedData = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv },
    key,
    encoder.encode(privateKeyStr)
  );

  return { encryptedData, iv, salt };
};




export const decryptWithPassword = async (
  password: string,
  encryptedData: ArrayBuffer,
  iv: Uint8Array,
  salt: Uint8Array
) => {
  const encoder = new TextEncoder();
  const passwordKey = await window.crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  const key = await window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    passwordKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt']
  );

  const decryptedData = await window.crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: iv },
    key,
    encryptedData
  );

  return new TextDecoder().decode(decryptedData);
};








// Add function to import certificate from files
export const importCertificateFromFiles = async (
  publicKeyFile: string,
  privateKeyFile: string,
  password: string
) => {
  try {
    // Parse the private key JSON file
    const privateKeyData = JSON.parse(privateKeyFile);
    
    // Convert Base64 strings back to ArrayBuffer/Uint8Array
    const encryptedPrivateKey = base64ToArrayBuffer(privateKeyData.encryptedPrivateKey);
    const iv = base64ToArrayBuffer(privateKeyData.iv);
    const salt = base64ToArrayBuffer(privateKeyData.salt);
    
    // Decrypt the private key
    const decryptedPrivateKeyStr = await decryptWithPassword(
      password,
      encryptedPrivateKey,
      new Uint8Array(iv),
      new Uint8Array(salt)
    );
    
    return {
      success: true,
      publicKey: publicKeyFile,
      privateKey: {
        encryptedData: encryptedPrivateKey,
        iv: new Uint8Array(iv),
        salt: new Uint8Array(salt)
      },
      privateKeyDecrypted: decryptedPrivateKeyStr
    };
  } catch (error) {
    console.error('Error importing certificate:', error);
    return { success: false, error: 'Error al importar el certificado' };
  }
};






// Helper function to convert Base64 to ArrayBuffer
export const base64ToArrayBuffer = (base64: string): ArrayBuffer => {
  const binaryString = window.atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
};


export const generateNonce = (): number => {
  return Math.floor(Date.now() / 1000); // Usar el timestamp actual como nonce
};
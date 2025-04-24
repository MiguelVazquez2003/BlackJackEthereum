export interface IUserCertificate {
  userID: string;
  publicKey: string; // PEM-formatted string
  iv: Uint8Array; // 12-byte AES-GCM IV
  salt: Uint8Array; // 16-byte PBKDF2 salt
  date: string; // ISO string
}

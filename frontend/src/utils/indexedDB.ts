// src/utils/indexedDB.ts

const dbName = 'blackjackDB';
const storeName = 'certificates';

const openDB = () => {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(dbName, 1);
    request.onsuccess = (event) => resolve((event.target as IDBRequest).result);
    request.onerror = (event) => reject((event.target as IDBRequest).error);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBRequest).result;
      if (!db.objectStoreNames.contains(storeName)) {
        db.createObjectStore(storeName, { keyPath: 'userID' });
      }
    };
  });
};

export const saveCertificate = async (certificate: any) => {
  const db = await openDB();
  const transaction = db.transaction(storeName, 'readwrite');
  const store = transaction.objectStore(storeName);
  store.put(certificate);
};

export const getCertificate = async (userID: string) => {
  const db = await openDB();
  const transaction = db.transaction(storeName, 'readonly');
  const store = transaction.objectStore(storeName);
  return new Promise<any>((resolve, reject) => {
    const request = store.get(userID);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject('Error getting certificate');
  });
};

// Nueva función para verificar si un usuario ya existe
export const userExists = async (userID: string): Promise<boolean> => {
  try {
    const certificate = await getCertificate(userID);
    return !!certificate; // Retorna true si el certificado existe, false si es null o undefined
  } catch (error) {
    console.error('Error verificando si el usuario existe:', error);
    return false;
  }
};

// Nueva función para listar todos los usuarios registrados
export const getAllUsers = async (): Promise<string[]> => {
  const db = await openDB();
  const transaction = db.transaction(storeName, 'readonly');
  const store = transaction.objectStore(storeName);
  
  return new Promise<string[]>((resolve, reject) => {
    const request = store.getAllKeys();
    request.onsuccess = () => {
      const keys = request.result as IDBValidKey[];
      const userIDs = keys.map(key => key.toString());
      resolve(userIDs);
    };
    request.onerror = () => reject('Error obteniendo lista de usuarios');
  });
};

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  addDoc,
  doc,
  getDoc,
  setDoc,
} from "firebase/firestore";
import {
  IGameRecord,
  IGameRecordDetails,
  IDepositRecord,
  IWithdrawalRecord,
  ITransactionRecord,
} from "../interfaces/IPlayer";

// Configuración de Firebase desde variables de entorno
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Obtener instancia de Firestore
const db = getFirestore(app);

// Función para agregar un registro a la colección "games"
export async function addGameRecord(record: IGameRecord) {
  try {
    const docRef = await addDoc(collection(db, "games"), {
      ...record,
      createdAt: record.createdAt || new Date().toISOString(),
    });
    console.log("Partida registrada con ID: ", docRef.id);
  } catch (e) {
    console.error("Error al agregar partida: ", e);
  }
}

// Función para agregar un registro detallado a la colección "games"
export async function addGameRecordWithDetails(record: IGameRecordDetails) {
  try {
    const docRef = await addDoc(collection(db, "games"), {
      ...record,
      createdAt: record.createdAt || new Date().toISOString(),
    });
    console.log("Partida registrada con ID: ", docRef.id);
  } catch (e) {
    console.error("Error al agregar partida: ", e);
  }
}

// Función para agregar un registro a la colección "deposits"
export async function addDepositRecord(record: IDepositRecord) {
  try {
    const docRef = await addDoc(collection(db, "deposits"), {
      ...record,
      createdAt: record.createdAt || new Date().toISOString(),
    });
    console.log("Depósito registrado con ID: ", docRef.id);
  } catch (e) {
    console.error("Error al agregar depósito: ", e);
  }
}

// Función para agregar un registro a la colección "withdrawals"
export async function addWithdrawalRecord(record: IWithdrawalRecord) {
  try {
    const docRef = await addDoc(collection(db, "withdrawals"), {
      ...record,
      createdAt: record.createdAt || new Date().toISOString(),
    });
    console.log("Retiro registrado con ID: ", docRef.id);
  } catch (e) {
    console.error("Error al agregar retiro: ", e);
  }
}

// Función para agregar un registro a la colección "transactions"
export async function addTransactionRecord(record: ITransactionRecord) {
  try {
    const docRef = await addDoc(collection(db, "transactions"), {
      ...record,
      timestamp: record.timestamp || new Date().toISOString(),
    });
    console.log("Transacción registrada con ID: ", docRef.id);
  } catch (e) {
    console.error("Error al agregar transacción: ", e);
  }
}

// Función para agregar un usuario a la colección "users"
export async function addUser(
  accountAddress: string,
  name: string,
  balance: number
) {
  try {
    const userRef = doc(db, "users", accountAddress);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      console.log("El usuario ya existe con ID: ", accountAddress);
      return;
    }

    await setDoc(userRef, {
      balance,
      createdAt: new Date().toLocaleString("es-MX", { timeZone: "UTC" }),
      name,
    });

    console.log("Usuario registrado con ID: ", accountAddress);
  } catch (e) {
    console.error("Error al agregar usuario: ", e);
  }
}

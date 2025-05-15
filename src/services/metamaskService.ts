import { ethers } from "ethers";
import { store } from "../hooks/store";

// Función para obtener los proveedores disponibles usando EIP6963
export function getAvailableProviders(): EIP6963ProviderDetail[] {
  return store.value();
}

// Función para conectar usando EIP6963
export async function connectWithEIP6963(provider?: EIP6963ProviderDetail): Promise<string | null> {
  // Si no se proporciona un proveedor específico, intentar usar el primero disponible
  const targetProvider = provider || (store.value().length > 0 ? store.value()[0] : null);
  
  if (!targetProvider) {
    console.error("No hay proveedores de wallet disponibles");
    return null;
  }
  
  try {
    // Solicitar cuentas al proveedor
    if (targetProvider.provider && typeof targetProvider.provider.request === 'function') {
      const accounts = await targetProvider.provider.request({ 
        method: "eth_requestAccounts" 
      }) as string[];
      
      if (accounts && accounts.length > 0) {
        return accounts[0];
      }
    }
    return null;
  } catch (error) {
    console.error("Error al conectar con el proveedor EIP6963:", error);
    return connectFallback();
  }
}

// Función fallback que usa window.ethereum (compatibilidad con versiones anteriores)
export async function connectFallback(): Promise<string | null> {
  if (window.ethereum) {
    try {
      await window.ethereum.request({ method: "eth_requestAccounts" });
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.listAccounts();
      return accounts.length > 0 ? accounts[0].address : null;
    } catch (error) {
      console.error("Error al conectar con MetaMask (fallback):", error);
      throw error;
    }
  } else {
    console.error("MetaMask no está instalado.");
    return null;
  }
}

export async function getCurrentAccount(provider?: EIP6963ProviderDetail): Promise<string | null> {
  // Primero intentar con el proveedor EIP6963 si está disponible
  if (provider && provider.provider && typeof provider.provider.request === 'function') {
    try {
      const accounts = await provider.provider.request({ 
        method: "eth_accounts" 
      }) as string[];
      
      if (accounts && accounts.length > 0) {
        return accounts[0];
      }
    } catch (error) {
      console.error("Error al obtener cuenta con EIP6963:", error);
    }
  }
  
  // Fallback a window.ethereum
  if (window.ethereum) {
    try {
      const ethProvider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await ethProvider.listAccounts();
      return accounts.length > 0 ? accounts[0].address : null;
    } catch (error) {
      console.error("Error al obtener cuenta actual (fallback):", error);
      return null;
    }
  } else {
    console.error("No se encontró ninguna wallet compatible.");
    return null;
  }
}

// Función para verificar si la red actual es la correcta
export async function checkNetwork(expectedChainId: number, provider?: EIP6963ProviderDetail): Promise<boolean> {
  try {
    let ethProvider: ethers.BrowserProvider;
    
    // Usar el proveedor EIP6963 si está disponible
    if (provider && provider.provider) {
      ethProvider = new ethers.BrowserProvider(provider.provider as any);
    } else if (window.ethereum) {
      ethProvider = new ethers.BrowserProvider(window.ethereum);
    } else {
      console.error("No se encontró ninguna wallet compatible.");
      return false;
    }
    
    const network = await ethProvider.getNetwork();
    return network.chainId === BigInt(expectedChainId);
  } catch (error) {
    console.error("Error al verificar la red:", error);
    return false;
  }
}

// Función para obtener un proveedor de ethers con EIP6963
export function getEIP6963Provider(provider: EIP6963ProviderDetail): ethers.BrowserProvider | null {
  if (provider && provider.provider) {
    return new ethers.BrowserProvider(provider.provider as any);
  }
  return null;
}

// Función para obtener el proveedor de MetaMask (fallback)
export function getProvider(): ethers.BrowserProvider | null {
  if (window.ethereum) {
    return new ethers.BrowserProvider(window.ethereum);
  } else {
    console.error("MetaMask no está instalado.");
    return null;
  }
}

// Función para obtener un signer con EIP6963
export async function getEIP6963Signer(provider: EIP6963ProviderDetail): Promise<ethers.Signer | null> {
  try {
    const ethProvider = getEIP6963Provider(provider);
    if (ethProvider) {
      return await ethProvider.getSigner();
    }
  } catch (error) {
    console.error("Error al obtener signer con EIP6963:", error);
  }
  return null;
}

// Función para actualizar el saldo de ETH
export async function updateBalance(
  ethProvider: ethers.BrowserProvider,
  accountAddress: string
): Promise<string> {
  try {
    const rawBalance = await ethProvider.getBalance(accountAddress);
    return ethers.formatEther(rawBalance);
  } catch (error) {
    console.error("Error al obtener el balance:", error);
    return "0";
  }
}

// Función para verificar si hay una cuenta conectada con EIP6963
export async function isConnected(provider?: EIP6963ProviderDetail): Promise<boolean> {
  const account = await getCurrentAccount(provider);
  return account !== null;
}
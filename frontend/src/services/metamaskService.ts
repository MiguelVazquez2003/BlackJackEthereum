import { ethers } from "ethers";

// Función para conectar MetaMask y obtener la cuenta actual
export async function connectToMetaMask(): Promise<string | null> {
  if (window.ethereum) {
    try {
      await window.ethereum.request({ method: "eth_requestAccounts" });
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.listAccounts();
      return accounts.length > 0 ? accounts[0].address : null;
    } catch (error) {
      console.error("Error al conectar con MetaMask:", error);
      throw error;
    }
  } else {
    console.error("MetaMask no está instalado.");
    return null;
  }
}

// Función para obtener la cuenta conectada actualmente
export async function getCurrentAccount(): Promise<string | null> {
  if (window.ethereum) {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.listAccounts();
      return accounts.length > 0 ? accounts[0].address : null;
    } catch (error) {
      console.error("Error al obtener la cuenta actual:", error);
      throw error;
    }
  } else {
    console.error("MetaMask no está instalado.");
    return null;
  }
}

// Función para verificar si la red actual es la correcta
export async function checkNetwork(expectedChainId: number): Promise<boolean> {
  if (window.ethereum) {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const network = await provider.getNetwork();
      return network.chainId === BigInt(expectedChainId);
    } catch (error) {
      console.error("Error al verificar la red:", error);
      throw error;
    }
  } else {
    console.error("MetaMask no está instalado.");
    return false;
  }
}

// Función para obtener el proveedor de MetaMask
export function getProvider(): ethers.BrowserProvider | null {
  if (window.ethereum) {
    return new ethers.BrowserProvider(window.ethereum);
  } else {
    console.error("MetaMask no está instalado.");
    return null;
  }
}

// Función para actualizar el saldo de ETH
export async function updateBalance(
  ethProvider: ethers.BrowserProvider,
  accountAddress: string
): Promise<string> {
  const rawBalance = await ethProvider.getBalance(accountAddress);
  return ethers.formatEther(rawBalance);
}

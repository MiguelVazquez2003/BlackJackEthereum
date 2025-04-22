// src/hooks/useMetaMask.ts

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { 
  BLACKJACK_CONTRACT_ADDRESS, 
  BLACKJACK_ABI, 
  GameResult,
} from '../contracts/blackjack';

declare global {
  interface Window {
    ethereum: any;
  }
}

export const useMetaMask = () => {
  const [account, setAccount] = useState<string | null>(null);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [balance, setBalance] = useState<string>('0');
  const [isCorrectNetwork] = useState<boolean>(false);

  // Inicializar proveedor si MetaMask está disponible
  useEffect(() => {
    const initProvider = async () => {
      if (window.ethereum) {
        try {
          const ethProvider = new ethers.BrowserProvider(window.ethereum);
          setProvider(ethProvider);
          
          try {
            const ethSigner = await ethProvider.getSigner();
            setSigner(ethSigner);
            
            // Inicializar contrato con el signer
            const blackjackContract = new ethers.Contract(
              BLACKJACK_CONTRACT_ADDRESS,
              BLACKJACK_ABI,
              ethSigner
            );
            setContract(blackjackContract);
            
            // Obtener la cuenta actual
            const accounts = await ethProvider.listAccounts();
            if (accounts.length > 0) {
              const currentAccount = accounts[0].address;
              setAccount(currentAccount);
              
              // Obtener el saldo de la cuenta
              updateBalance(ethProvider, currentAccount);
            }
            
          } catch (error) {
            console.log("Usuario no conectado. Conectar primero para obtener un firmante.");
          }
        } catch (error) {
          console.error("Error al inicializar el proveedor:", error);
        }
      }
    };
    
    initProvider();
  }, []);


  // Actualizar el saldo de ETH
  const updateBalance = async (
    ethProvider: ethers.BrowserProvider, 
    accountAddress: string
  ) => {
    const rawBalance = await ethProvider.getBalance(accountAddress);
    const formattedBalance = ethers.formatEther(rawBalance);
    setBalance(formattedBalance);
  };


  // Conectar con MetaMask
  const connect = async () => {
    if (window.ethereum) {
      try {
        // Solicitar acceso a las cuentas
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        
        if (provider) {
          const accounts = await provider.listAccounts();
          if (accounts.length > 0) {
            const currentAccount = accounts[0].address;
            setAccount(currentAccount);
            
            // Inicializar signer y contrato
            const connectedSigner = await provider.getSigner();
            setSigner(connectedSigner);
            
            const blackjackContract = new ethers.Contract(
              BLACKJACK_CONTRACT_ADDRESS,
              BLACKJACK_ABI,
              connectedSigner
            );
            setContract(blackjackContract);
            
            // Actualizar saldo
            updateBalance(provider, currentAccount);
            
          }
        } else {
          // Si el proveedor no se inicializó, hacerlo ahora
          const ethProvider = new ethers.BrowserProvider(window.ethereum);
          setProvider(ethProvider);
          
          const accounts = await ethProvider.listAccounts();
          if (accounts.length > 0) {
            const currentAccount = accounts[0].address;
            setAccount(currentAccount);
            
            const connectedSigner = await ethProvider.getSigner();
            setSigner(connectedSigner);
            
            const blackjackContract = new ethers.Contract(
              BLACKJACK_CONTRACT_ADDRESS,
              BLACKJACK_ABI,
              connectedSigner
            );
            setContract(blackjackContract);
            
            // Actualizar saldo
            updateBalance(ethProvider, currentAccount);
            
          }
        }
      } catch (error) {
        console.error('Error al conectar con MetaMask:', error);
      }
    } else {
      alert('MetaMask no está instalado. Por favor, instala la extensión e inténtalo de nuevo.');
    }
  };

  // Funciones específicas para interactuar con el contrato Blackjack

  // Registrar certificado del jugador
  const registerCertificate = async (certificate: string) => {
    if (!contract || !account) {
      throw new Error('No hay conexión con el contrato o cuenta de usuario');
    }

    try {
      const tx = await contract.registerCertificate(ethers.toUtf8Bytes(certificate));
      return await tx.wait();
    } catch (error) {
      console.error('Error al registrar el certificado:', error);
      throw error;
    }
  };

  // Obtener apuesta máxima
  const getMaxBet = async () => {
    if (!contract) {
      throw new Error('No hay conexión con el contrato');
    }

    try {
      const maxBet = await contract.maxBet();
      return ethers.formatEther(maxBet);
    } catch (error) {
      console.error('Error al obtener la apuesta máxima:', error);
      throw error;
    }
  };

  // Firmar el resultado del juego
  const signGameResult = async (
    result: GameResult,
    betAmount: string // en ETH
  ) => {
    if (!signer || !account) {
      throw new Error('No hay un firmante o cuenta disponible');
    }

    try {
      const betInWei = ethers.parseEther(betAmount);
      
      // Crear el mensaje hash según la lógica del contrato
      const messageHash = ethers.solidityPackedKeccak256(
        ['address', 'int256', 'uint256'],
        [account, result, betInWei]
      );
      
      // Firmar el hash
      const signature = await signer.signMessage(ethers.getBytes(messageHash));
      return signature;
    } catch (error) {
      console.error('Error al firmar el resultado del juego:', error);
      throw error;
    }
  };

  // Registrar resultado del juego
  const recordGameResult = async (
    result: GameResult,
    betAmount: string, // en ETH
    signature: string
  ) => {
    if (!contract || !account) {
      throw new Error('No hay conexión con el contrato o cuenta de usuario');
    }

    try {
      const betInWei = ethers.parseEther(betAmount);
      
      // Si el jugador pierde, debe enviar ETH al contrato
      const options = result < 0 ? { value: betInWei } : {};
      
      const tx = await contract.recordGameResult(
        signature,
        result,
        betInWei,
        options
      );
      
      const receipt = await tx.wait();
      
      // Actualizar el saldo después de la transacción
      if (provider) {
        updateBalance(provider, account);
      }
      
      return receipt;
    } catch (error) {
      console.error('Error al registrar el resultado del juego:', error);
      throw error;
    }
  };

  // Obtener estadísticas del jugador
  const getPlayerStats = async (playerAddress: string = account!) => {
    if (!contract) {
      throw new Error('No hay conexión con el contrato');
    }

    try {
      const stats = await contract.getPlayerStats(playerAddress);
      
      return {
        gamesPlayed: Number(stats.gamesPlayed),
        gamesWon: Number(stats.gamesWon),
        totalWinnings: ethers.formatEther(stats.totalWinnings)
      };
    } catch (error) {
      console.error('Error al obtener las estadísticas del jugador:', error);
      throw error;
    }
  };

  // Escuchar cambios de cuenta
  useEffect(() => {
    if (window.ethereum) {
      const handleAccountsChanged = async (accounts: string[]) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          
          // Reinicializar signer y contrato con la nueva cuenta
          if (provider) {
            const newSigner = await provider.getSigner();
            setSigner(newSigner);
            
            const blackjackContract = new ethers.Contract(
              BLACKJACK_CONTRACT_ADDRESS,
              BLACKJACK_ABI,
              newSigner
            );
            setContract(blackjackContract);
            
            // Actualizar saldo
            updateBalance(provider, accounts[0]);
          }
        } else {
          setAccount(null);
          setSigner(null);
          setContract(null);
        }
      };

      // Escuchar cambios de cuenta
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      


      // Limpiar listeners al desmontar
      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', () => {});
      };
    }
  }, [provider]);

  return { 
    account, 
    provider, 
    signer, 
    contract,
    balance,
    isCorrectNetwork,
    connect,
    registerCertificate,
    getMaxBet,
    signGameResult,
    recordGameResult,
    getPlayerStats
  };
};

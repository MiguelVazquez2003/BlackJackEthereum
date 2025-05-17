import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import { BLACKJACK_ABI, BLACKJACK_CONTRACT_ADDRESS } from "../utils/constants";
import {
  registerPlayerCertificate,
  getMaxBet,
  signGameResult,
  getPlayerStats,
  recordGame,
} from "../services/blackjackService";
import { updateBalance } from "../services/metamaskService";
import { useSyncProviders } from "./useSyncProviders";

export const useMetaMask = () => {
  // Estado para proveedores EIP6963
  const providers = useSyncProviders();
  const [selectedProvider, setSelectedProvider] = useState<EIP6963ProviderDetail | null>(null);
  
  // Estados originales
  const [account, setAccount] = useState<string | null>(null);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [balance, setBalance] = useState<string>("0");
  const [isCorrectNetwork] = useState<boolean>(false);

  // Función para conectar usando EIP6963
  const connect = useCallback(async (providerDetail?: EIP6963ProviderDetail) => {
    try {
      // Primero intentamos con el proveedor proporcionado o uno de la lista
      let targetProvider = providerDetail;
      
      // Si no se proporcionó un proveedor, intentamos tomar el primero disponible
      if (!targetProvider && providers && providers.length > 0) {
        targetProvider = providers[0];
      }
      
      // Si aún no tenemos proveedor, intentamos usar window.ethereum
      if (!targetProvider || !targetProvider.provider) {
        console.log("Usando window.ethereum como proveedor fallback");
        if (window.ethereum) {
          try {
            // Conectar directamente con window.ethereum
            await window.ethereum.request({ method: "eth_requestAccounts" });
            const ethProvider = new ethers.BrowserProvider(window.ethereum);
            setProvider(ethProvider);
            
            const accounts = await ethProvider.listAccounts();
            if (accounts.length > 0) {
              const currentAccount = accounts[0].address;
              setAccount(currentAccount);
              
              const ethSigner = await ethProvider.getSigner();
              setSigner(ethSigner);
              
              const blackjackContract = new ethers.Contract(
                BLACKJACK_CONTRACT_ADDRESS,
                BLACKJACK_ABI,
                ethSigner
              );
              setContract(blackjackContract);
              
              const formattedBalance = await updateBalance(ethProvider, currentAccount);
              setBalance(formattedBalance);
            }
          } catch (error) {
            console.error("Error al conectar con window.ethereum:", error);
          }
          return;
        } else {
          console.error("No hay proveedores de wallet disponibles");
          return;
        }
      }
      
      setSelectedProvider(targetProvider);
      
      // Verificar que el provider y el método request existan
      if (!targetProvider.provider || typeof targetProvider.provider.request !== 'function') {
        console.error("El proveedor no tiene un método request válido");
        return;
      }
      
      // Solicitar cuentas
      const accounts = await targetProvider.provider.request({ 
        method: "eth_requestAccounts" 
      }) as string[];
      
      if (accounts && accounts.length > 0) {
        const currentAccount = accounts[0];
        setAccount(currentAccount);
        
        // Crear proveedor de ethers con el proveedor EIP6963
        const ethProvider = new ethers.BrowserProvider(targetProvider.provider as any);
        setProvider(ethProvider);
        
        try {
          // Obtener signer
          const ethSigner = await ethProvider.getSigner();
          setSigner(ethSigner);
          
          // Crear instancia del contrato
          const blackjackContract = new ethers.Contract(
            BLACKJACK_CONTRACT_ADDRESS,
            BLACKJACK_ABI,
            ethSigner
          );
          setContract(blackjackContract);
          
          const formattedBalance = await updateBalance(ethProvider, currentAccount);
          setBalance(formattedBalance);
        } catch (error) {
          console.error("Error al obtener signer:", error);
        }
      }
    } catch (error) {
      console.error("Error al conectar con el proveedor:", error);
      // Intentar con window.ethereum si el otro método falla
      if (window.ethereum) {
        try {
          console.log("Intentando conexión fallback con window.ethereum");
          await window.ethereum.request({ method: "eth_requestAccounts" });
          const ethProvider = new ethers.BrowserProvider(window.ethereum);
          setProvider(ethProvider);
          
          const accounts = await ethProvider.listAccounts();
          if (accounts.length > 0) {
            const currentAccount = accounts[0].address;
            setAccount(currentAccount);
            
            const ethSigner = await ethProvider.getSigner();
            setSigner(ethSigner);
            
            const blackjackContract = new ethers.Contract(
              BLACKJACK_CONTRACT_ADDRESS,
              BLACKJACK_ABI,
              ethSigner
            );
            setContract(blackjackContract);
            
            const formattedBalance = await updateBalance(ethProvider, currentAccount);
            setBalance(formattedBalance);
          }
        } catch (fallbackError) {
          console.error("Error en conexión fallback:", fallbackError);
        }
      }
    }
  }, [providers]);

  // Efecto para escuchar cambios en la cuenta seleccionada
  useEffect(() => {
    // Solo configurar listeners si tenemos un proveedor seleccionado
    if (selectedProvider?.provider) {
      const ethereumProvider = selectedProvider.provider as any;
      
      // Verificar que el proveedor tiene el método 'on'
      if (ethereumProvider && typeof ethereumProvider.on === 'function') {
        const handleAccountsChanged = async (accounts: string[]) => {
          if (accounts.length > 0) {
            const newAccount = accounts[0];
            setAccount(newAccount);

            // Actualizar provider, signer y contrato
            if (provider) {
              try {
                const newSigner = await provider.getSigner();
                setSigner(newSigner);

                const blackjackContract = new ethers.Contract(
                  BLACKJACK_CONTRACT_ADDRESS,
                  BLACKJACK_ABI,
                  newSigner
                );
                setContract(blackjackContract);

                // Actualizar balance
                const formattedBalance = await updateBalance(provider, newAccount);
                setBalance(formattedBalance);
              } catch (error) {
                console.error("Error al actualizar después del cambio de cuenta:", error);
              }
            }
          } else {
            // Sin cuentas, resetear estado
            setAccount(null);
            setSigner(null);
            setContract(null);
            setBalance("0");
          }
        };
        
        // Suscribirse a cambios de cuenta
        ethereumProvider.on("accountsChanged", handleAccountsChanged);
        
        // Limpiar listener
        return () => {
          if (ethereumProvider.removeListener) {
            ethereumProvider.removeListener("accountsChanged", handleAccountsChanged);
          }
        };
      }
    } else if (window.ethereum && typeof window.ethereum.on === 'function') {
      // Fallback para window.ethereum si no hay proveedor EIP6963
      const handleAccountsChanged = async (accounts: string[]) => {
        if (accounts.length > 0) {
          const newAccount = accounts[0];
          setAccount(newAccount);
          
          try {
            const ethProvider = new ethers.BrowserProvider(window.ethereum);
            setProvider(ethProvider);
            
            const ethSigner = await ethProvider.getSigner();
            setSigner(ethSigner);
            
            const blackjackContract = new ethers.Contract(
              BLACKJACK_CONTRACT_ADDRESS,
              BLACKJACK_ABI,
              ethSigner
            );
            setContract(blackjackContract);
            
            const formattedBalance = await updateBalance(ethProvider, newAccount);
            setBalance(formattedBalance);
          } catch (error) {
            console.error("Error al actualizar después del cambio de cuenta con window.ethereum:", error);
          }
        } else {
          setAccount(null);
          setSigner(null);
          setContract(null);
          setBalance("0");
        }
      };
      
      window.ethereum.on("accountsChanged", handleAccountsChanged);
      
      return () => {
        if (window.ethereum.removeListener) {
          window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
        }
      };
    }
  }, [selectedProvider, provider]);

  // Conectar con el primer proveedor disponible si hay proveedores y no hay uno seleccionado
  useEffect(() => {
    if (!account) {
      // Si hay providers EIP6963 disponibles
      if (providers.length > 0 && !selectedProvider) {
        // Intentar detectar sesión activa en el primer proveedor
        const checkExistingConnection = async () => {
          try {
            const firstProvider = providers[0];
            
            if (firstProvider && firstProvider.provider && 
                typeof firstProvider.provider.request === 'function') {
              const accounts = await firstProvider.provider.request({ 
                method: "eth_accounts" 
              }) as string[];
              
              if (accounts && accounts.length > 0) {
                // Si ya hay una cuenta conectada, usar ese proveedor
                connect(firstProvider);
              }
            }
          } catch (error) {
            console.error("Error al verificar conexión existente con EIP6963:", error);
            // Si falla, intentar con window.ethereum
            tryConnectWithWindowEthereum();
          }
        };
        
        checkExistingConnection();
      } else {
        // Si no hay proveedores EIP6963, intentar con window.ethereum
        tryConnectWithWindowEthereum();
      }
    }
  }, [providers, selectedProvider, account, connect]);

  // Función auxiliar para intentar conectar con window.ethereum
  const tryConnectWithWindowEthereum = async () => {
    if (window.ethereum) {
      try {
        // Verificar si ya hay cuentas conectadas sin mostrar prompt
        const accounts = await window.ethereum.request({ method: "eth_accounts" });
        if (accounts && accounts.length > 0) {
          const ethProvider = new ethers.BrowserProvider(window.ethereum);
          setProvider(ethProvider);
          
          const currentAccount = accounts[0];
          setAccount(currentAccount);
          
          const ethSigner = await ethProvider.getSigner();
          setSigner(ethSigner);
          
          const blackjackContract = new ethers.Contract(
            BLACKJACK_CONTRACT_ADDRESS,
            BLACKJACK_ABI,
            ethSigner
          );
          setContract(blackjackContract);
          
          const formattedBalance = await updateBalance(ethProvider, currentAccount);
          setBalance(formattedBalance);
        }
      } catch (error) {
        console.error("Error al verificar cuentas existentes con window.ethereum:", error);
      }
    }
  };

  // Devolver objeto con estados y funciones
  return {
    account,
    provider,
    signer,
    contract,
    balance,
    isCorrectNetwork,
    availableProviders: providers,
    selectedProvider,
    connect,
    registerCertificate: registerPlayerCertificate,
    getMaxBet,
    signGameResult,
    recordGame,
    getPlayerStats,
  };
};
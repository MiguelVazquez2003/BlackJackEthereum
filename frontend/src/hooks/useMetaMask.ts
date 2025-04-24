// src/hooks/useMetaMask.ts

import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { BLACKJACK_ABI, BLACKJACK_CONTRACT_ADDRESS } from "../utils/constants";
import {
  registerPlayerCertificate,
  getMaxBet,
  signGameResult,
  getPlayerStats,
  recordGame,
} from "../services/blackjackService";
import {
  connectToMetaMask,
  getProvider,
  updateBalance,
} from "../services/metamaskService";

export const useMetaMask = () => {
  const [account, setAccount] = useState<string | null>(null);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [balance, setBalance] = useState<string>("0");
  const [isCorrectNetwork] = useState<boolean>(false);





  // Inicializar proveedor MteaMask y contrato
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
              const formattedBalance = await updateBalance(
                ethProvider,
                currentAccount
              );
              setBalance(formattedBalance);
            }

          } catch (error) {
            console.log(
              "Usuario no conectado. Conectar primero para obtener un firmante."
            );
          }
        } catch (error) {
          console.error("Error al inicializar el proveedor:", error);
        }
      }
    };

    initProvider();
  }, []);




  // Conectar con MetaMask
  const connect = async () => {
    try {
      const currentAccount = await connectToMetaMask();
      if (currentAccount) {
        setAccount(currentAccount);

        const ethProvider = getProvider();
        if (ethProvider) {
          setProvider(ethProvider);

          const connectedSigner = await ethProvider.getSigner();
          setSigner(connectedSigner);

          const blackjackContract = new ethers.Contract(
            BLACKJACK_CONTRACT_ADDRESS,
            BLACKJACK_ABI,
            connectedSigner
          );
          setContract(blackjackContract);

          // Actualizar saldo
          const formattedBalance = await updateBalance(
            ethProvider,
            currentAccount
          );
          setBalance(formattedBalance);
        }
      }
    } catch (error) {
      console.error("Error al conectar con MetaMask:", error);
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
            const formattedBalance = await updateBalance(provider, accounts[0]);
            setBalance(formattedBalance);
          }
        } else {
          setAccount(null);
          setSigner(null);
          setContract(null);
        }
      };

      // Escuchar cambios de cuenta
      window.ethereum.on("accountsChanged", handleAccountsChanged);

      // Limpiar listeners al desmontar
      return () => {
        window.ethereum.removeListener(
          "accountsChanged",
          handleAccountsChanged
        );
        window.ethereum.removeListener("chainChanged", () => {});
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
    registerCertificate: registerPlayerCertificate,
    getMaxBet,
    signGameResult,
    recordGame,
    getPlayerStats,
  };
};

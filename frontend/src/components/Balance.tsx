import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';

interface BalanceProps {
  account: string | null;
  refreshTrigger?: number;
}

const Balance: React.FC<BalanceProps> = ({ account, refreshTrigger = 0 }) => {
  const [balance, setBalance] = useState<string>('0');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    const fetchBalance = async () => {
      if (!account) {
        setBalance('0');
        return;
      }

      try {
        setIsLoading(true);
        const provider = new ethers.BrowserProvider(window.ethereum);
        const balanceWei = await provider.getBalance(account);
        setBalance(ethers.formatEther(balanceWei));
      } catch (error) {
        console.error('Error al obtener el saldo:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBalance();
  }, [account, refreshTrigger]);

  return (
    <div className="flex items-center space-x-2">
      <span className="text-gray-400">Saldo:</span>
      {isLoading ? (
        <span className="text-gray-300 animate-pulse">Cargando...</span>
      ) : (
        <span className="text-white font-medium">
          {parseFloat(balance).toFixed(6)} ETH
        </span>
      )}
    </div>
  );
};

export default Balance;
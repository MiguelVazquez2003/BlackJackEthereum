import { useState, useEffect } from "react";
import { useMetaMask } from "../hooks/useMetaMask";
import { depositFunds, checkPlayerDebt, finalizeSession, getPlayerStats } from "../services/blackjackService";
import { toast } from "react-toastify";
import { ClipLoader } from "react-spinners";
import Balance from "../components/Balance";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { DepositHistory, DepositosProps } from "../interfaces/IPlayer";



const Depositos: React.FC<DepositosProps> = ({ onDepositComplete }) => {
  const { account, connect } = useMetaMask();
  const [amount, setAmount] = useState<string>("0.01");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isWithdrawing, setIsWithdrawing] = useState<boolean>(false);
  const [currentDeposit, setCurrentDeposit] = useState<string>("0");
  const [depositTimestamp, setDepositTimestamp] = useState<number>(0);
  const [depositHistory, setDepositHistory] = useState<DepositHistory[]>([]);
  const [totalDeposits, setTotalDeposits] = useState<string>("0");
  const [isFetchingStats, setIsFetchingStats] = useState<boolean>(true);

  // Obtener estadísticas del jugador cuando se conecta la cuenta
  useEffect(() => {
    const fetchPlayerStats = async () => {
      if (account) {
        try {
          setIsFetchingStats(true);
          const stats = await getPlayerStats(account);
          
          // Guardar el depósito actual
          setCurrentDeposit(stats.initialDeposit);
          setDepositTimestamp(stats.depositTimestamp);
          
          // Simular algunos depósitos históricos para la demostración
          // En una implementación real, estos vendrían de eventos en el contrato
          if (parseFloat(stats.initialDeposit) > 0) {
            const currentDepositHistory: DepositHistory = {
              amount: stats.initialDeposit,
              timestamp: stats.depositTimestamp,
              date: new Date(stats.depositTimestamp * 1000).toLocaleString()
            };
            
            setDepositHistory([currentDepositHistory]);
            setTotalDeposits(stats.initialDeposit);
          }
        } catch (error) {
          console.error("Error al obtener estadísticas del jugador:", error);
          toast.error("No se pudieron cargar los datos de depósitos");
        } finally {
          setIsFetchingStats(false);
        }
      }
    };
    
    fetchPlayerStats();
  }, [account]);

  const handleDeposit = async () => {
    if (!account) {
      toast.error("Conecta tu wallet para depositar.");
      return;
    }

    if (isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      toast.error("Por favor, ingresa un monto válido para depositar.");
      return;
    }

    setIsLoading(true);
    try {
      // Verificar si el jugador tiene deudas pendientes
      const { hasDebt, debtAmount } = await checkPlayerDebt(account);

      if (hasDebt) {
        toast.warning(`Tienes una deuda pendiente de ${debtAmount} ETH. Se saldará automáticamente.`);
      }

      await depositFunds(amount);
      toast.success(`Depósito de ${amount} ETH realizado con éxito`);
      
      // Actualizar la lista de depósitos
      const newDepositHistory: DepositHistory = {
        amount: amount,
        timestamp: Math.floor(Date.now() / 1000),
        date: new Date().toLocaleString()
      };
      
      // Si ya había un depósito, sumarlo al nuevo
      const newTotal = parseFloat(totalDeposits) + parseFloat(amount);
      setTotalDeposits(newTotal.toString());
      
      // Actualizar el historial
      setDepositHistory([...depositHistory, newDepositHistory]);
      
      // Actualizar el depósito actual
      const stats = await getPlayerStats(account);
      setCurrentDeposit(stats.initialDeposit);
      setDepositTimestamp(stats.depositTimestamp);
      
      if (onDepositComplete) {
        onDepositComplete();
      }
    } catch (error) {
      console.error("Error al depositar:", error);
      toast.error("Error al depositar: " + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (!account) {
      toast.error("Conecta tu wallet para retirar fondos.");
      return;
    }

    setIsWithdrawing(true);
    try {
      await finalizeSession();
      toast.success("Retiro exitoso. Se han enviado todos los fondos a tu wallet.");
      
      // Limpiar el historial de depósitos
      setDepositHistory([]);
      setCurrentDeposit("0");
      setTotalDeposits("0");
      setDepositTimestamp(0);
      
      if (onDepositComplete) {
        onDepositComplete();
      }
    } catch (error) {
      console.error("Error al retirar:", error);
      toast.error("Error al retirar: " + (error as Error).message);
    } finally {
      setIsWithdrawing(false);
    }
  };
  
  // Formatear el timestamp a fecha legible
  const formatDate = (timestamp: number) => {
    if (!timestamp) return "No disponible";
    return new Date(timestamp * 1000).toLocaleString();
  };

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      {!account ? (
        <button
          onClick={connect}
          className="py-3 px-6 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium transition"
        >
          Conectar MetaMask
        </button>
      ) : (
        <div className="w-full">
          <DotLottieReact
            src="https://lottie.host/a7258bbd-cd34-4c25-b9c1-9049161324ec/g3GE7ktSUs.lottie"
            loop
            autoplay
            className="w-60 h-60 mx-auto mb-6"
          />
            
          <Balance account={account} />
          
          {/* Mostrar depósito actual */}
          <div className="mt-6 bg-gray-700/30 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-white mb-2">Depósito Actual</h3>
            <div className="flex justify-between">
              <div>
                <p className="text-2xl font-bold text-green-400">{currentDeposit} ETH</p>
                <p className="text-xs text-gray-400 mt-1">
                  {depositTimestamp > 0 ? `Depositado el ${formatDate(depositTimestamp)}` : "Sin depósito activo"}
                </p>
              </div>
              
              <div className="text-right">
                <p className="text-sm text-gray-300">Total depositado:</p>
                <p className="text-lg font-semibold text-blue-400">{totalDeposits} ETH</p>
              </div>
            </div>
          </div>
          
          {/* Historial de depósitos */}
          {depositHistory.length > 0 && (
            <div className="mt-4 bg-gray-700/20 p-4 rounded-lg">
              <h3 className="text-lg font-medium text-white mb-3">Historial de Depósitos</h3>
              {isFetchingStats ? (
                <div className="flex justify-center py-4">
                  <ClipLoader color="#ffffff" size={24} />
                </div>
              ) : (
                <div className="space-y-2">
                  {depositHistory.map((deposit, index) => (
                    <div key={index} className="flex justify-between items-center py-2 border-b border-gray-700">
                      <div>
                        <p className="text-sm text-gray-300">{deposit.date}</p>
                      </div>
                      <p className="font-medium text-green-400">{deposit.amount} ETH</p>
                    </div>
                  ))}
                </div>
              )}
              
              <p className="mt-3 text-xs text-gray-400">
                * Al finalizar tu sesión, todos tus depósitos serán retirados a tu wallet.
              </p>
            </div>
          )}
          
          <div className="mt-6">
            <h3 className="text-lg font-medium text-white mb-2">Depositar Fondos</h3>
            <div className="relative">
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Cantidad en ETH"
                disabled={isLoading}
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <span className="text-gray-400">ETH</span>
              </div>
            </div>
            <button
              onClick={handleDeposit}
              disabled={isLoading}
              className="mt-3 w-full py-2 px-4 bg-green-600 hover:bg-green-700 text-white rounded-lg"
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <ClipLoader color="#ffffff" size={16} className="mr-2" />
                  Procesando...
                </span>
              ) : (
                "Depositar"
              )}
            </button>
          </div>

          <div className="mt-6">
            <h3 className="text-lg font-medium text-white mb-2">Retirar Fondos</h3>
            <p className="text-sm text-gray-400 mb-3">
              Esto finalizará tu sesión y devolverá todos tus fondos a tu wallet.
            </p>
            <button
              onClick={handleWithdraw}
              disabled={isWithdrawing || parseFloat(currentDeposit) <= 0}
              className={`w-full py-2 px-4 text-white rounded-lg ${
                isWithdrawing || parseFloat(currentDeposit) <= 0 
                  ? "bg-gray-600 cursor-not-allowed" 
                  : "bg-red-600 hover:bg-red-700"
              }`}
            >
              {isWithdrawing ? (
                <span className="flex items-center justify-center">
                  <ClipLoader color="#ffffff" size={16} className="mr-2" />
                  Procesando...
                </span>
              ) : (
                "Retirar Todos los Fondos"
              )}
            </button>
            {parseFloat(currentDeposit) <= 0 && (
              <p className="text-xs text-gray-400 mt-1 text-center">
                No tienes fondos para retirar
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Depositos;
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getAuthenticatedUser } from "../utils/sessionUtils";
import { useMetaMask } from "../hooks/useMetaMask";
import { getPlayerStats,finalizeSession } from "../services/blackjackService";
import { PlayerStats } from "../interfaces/IPlayer";
import { ClipLoader } from "react-spinners";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import Balance from "../components/Balance";

const BalancePage = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const { account, connect } = useMetaMask();
  const userId = getAuthenticatedUser();
  const [balanceRefreshTrigger, setBalanceRefreshTrigger] = useState<number>(0);
  const [isWithdrawing, setIsWithdrawing] = useState<boolean>(false);

  useEffect(() => {
    const fetchStats = async () => {
      if (!account || !userId) return;

      try {
        setIsLoading(true);
        const playerStats = await getPlayerStats(account);
        setStats(playerStats);
        setError(null);
      } catch (err) {
        console.error("Error al obtener estadísticas:", err);
        toast.error("No se pudieron cargar los datos de balance");
        setError(
          "No se pudieron cargar los datos de balance. Intenta de nuevo."
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [account, userId, balanceRefreshTrigger]);

  // Calcular ganancias netas
  const netProfit = stats 
    ? (parseFloat(stats.totalWinnings) - parseFloat(stats.totalLosses)).toFixed(6)
    : "0";
  
  // Determinar el color basado en las ganancias netas
  const profitColor = parseFloat(netProfit) > 0 
    ? "text-green-400" 
    : parseFloat(netProfit) < 0 
      ? "text-red-400" 
      : "text-white";
  
  // Formatear el timestamp a fecha legible
  const formatDate = (timestamp: number) => {
    if (!timestamp) return "No disponible";
    return new Date(timestamp * 1000).toLocaleString();
  };

  const handleWithdraw = async () => {
    if (!account) {
      toast.error("Conecta tu wallet para retirar fondos.");
      return;
    }

    if (stats?.hasPendingDebt) {
      toast.error("Primero debes saldar tu deuda pendiente.");
      return;
    }

    if (parseFloat(stats?.initialDeposit || "0") <= 0) {
      toast.error("No tienes fondos para retirar.");
      return;
    }

    setIsWithdrawing(true);
    try {
      await finalizeSession();
      toast.success("Retiro exitoso. Se han enviado todos los fondos a tu wallet.");
      
      // Actualizar estados locales después del retiro
      setBalanceRefreshTrigger(prev => prev + 1);
      // Esperar un poco para refrescar las estadísticas
      setTimeout(() => {
        fetchStats();
      }, 2000);
    } catch (error) {
      console.error("Error al retirar:", error);
      toast.error("Error al retirar: " + (error as Error).message);
    } finally {
      setIsWithdrawing(false);
    }
  };

  const fetchStats = async () => {
    if (!account) return;
    
    try {
      setIsLoading(true);
      const playerStats = await getPlayerStats(account);
      setStats(playerStats);
    } catch (err) {
      console.error("Error al actualizar estadísticas:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-casinogreen flex flex-col items-center text-white px-4 py-8">
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />
      
      <div className="w-full max-w-6xl">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 font-title text-center">Mi Balance</h1>
        
        {error && (
          <div className="bg-red-900/30 border border-red-800/40 rounded-lg p-4 mb-6 text-red-200">
            <p>{error}</p>
          </div>
        )}

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <ClipLoader color="#ffffff" size={40} />
            <p className="text-gray-300 mt-4">Cargando datos de balance...</p>
          </div>
        ) : !account ? (
          <div className="flex flex-col items-center gap-6 py-12 bg-secondarygreen p-8 rounded-xl">
            <p className="text-gray-200 text-center">Conecta tu wallet para ver tu balance</p>
            <button
              onClick={() => connect()}
              className="py-2 px-6 md:py-3 md:px-8 bg-red-950 hover:bg-red-900 hover:cursor-pointer text-white font-semibold rounded-md transition text-sm md:text-base"
            >
              Conectar MetaMask
            </button>
          </div>
        ) : stats ? (
          <div className="space-y-8">
            {/* Sección de balance/wallet */}
            <div className="bg-secondarygreen p-6 rounded-xl shadow-lg">
              <h2 className="text-3xl font-bold mb-4">Balance de Wallet</h2>
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
                <div>
                  <Balance 
                    account={account} 
                    refreshTrigger={balanceRefreshTrigger}
                  />
                </div>
              </div>
            </div>
            
            {/* Información de depósito activo */}
            <div className="bg-secondarygreen p-6 rounded-xl shadow-lg">
              <h2 className="text-3xl font-bold mb-4">Depósito Actual</h2>
              <div className="flex justify-between items-center p-4 bg-gray-800/60 rounded-lg">
                <div>
                  <p className="text-gray-300">Cantidad depositada:</p>
                  <p className="text-2xl font-bold text-green-400">{stats.initialDeposit} ETH</p>
                </div>
                <div className="text-right">
                  <p className="text-gray-300">Fecha de depósito:</p>
                  <p className="text-sm text-blue-400">{formatDate(stats.depositTimestamp)}</p>
                </div>
              </div>
              
              <div className="mt-4">
                <button
                  onClick={handleWithdraw}
                  disabled={isWithdrawing || parseFloat(stats.initialDeposit) <= 0 || stats.hasPendingDebt}
                  className={`w-full py-2 px-4 rounded-lg font-medium transition-colors  ${
                    isWithdrawing || parseFloat(stats.initialDeposit) <= 0 || stats.hasPendingDebt
                      ? "bg-gray-600 cursor-not-allowed"
                      : "bg-red-700 hover:bg-red-800 text-white hover:cursor-pointer"
                  }`}
                >
                  {isWithdrawing ? (
                    <span className="flex items-center justify-center">
                      <ClipLoader color="#ffffff" size={16} className="mr-2" />
                      Procesando...
                    </span>
                  ) : (
                    "Retirar Fondos"
                  )}
                </button>
                
                {parseFloat(stats.initialDeposit) <= 0 && (
                  <p className="mt-3 text-center text-yellow-400 text-sm">
                    No tienes un depósito activo. Realiza un depósito para comenzar a jugar.
                  </p>
                )}
                
                {stats.hasPendingDebt && (
                  <p className="mt-3 text-center text-red-400 text-sm">
                    Tienes una deuda pendiente. Sáldala antes de retirar fondos.
                  </p>
                )}
              </div>
            </div>
            
            {/* Estado de deuda */}
            {stats.hasPendingDebt && (
              <div className="bg-red-900/30 border border-red-800/40 rounded-xl p-6">
                <h2 className="text-xl font-bold mb-4 text-red-300">Deuda Pendiente</h2>
                <div className="flex justify-between items-center p-3 bg-red-900/20 rounded-lg">
                  <span className="text-red-200">Monto pendiente:</span>
                  <span className="text-xl font-bold text-red-400">
                    {stats.pendingDebtAmount} ETH
                  </span>
                </div>
                <p className="mt-3 text-red-200 text-sm">
                  Debes saldar esta deuda antes de poder seguir jugando o retirar fondos.
                </p>
                <button
                  onClick={() => navigate("/game")}
                  className="mt-4 w-full py-2 px-4 bg-amber-700 hover:bg-amber-800 text-white rounded-lg"
                >
                  Ir al juego para saldar deuda
                </button>
              </div>
            )}

            {/* Sección de balance financiero */}
            <div className="bg-secondarygreen p-6 rounded-xl shadow-lg">
              <h2 className="text-3xl font-bold mb-4">Balance Financiero</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex justify-between p-4 bg-gray-800/30 rounded-lg">
                  <span className="text-white font-bold">Ganancias totales:</span>
                  <span className="text-green-400 font-medium">
                    {stats.totalWinnings} ETH
                  </span>
                </div>
                <div className="flex justify-between p-4 bg-gray-800/30 rounded-lg">
                  <span className="text-white font-bold">Pérdidas totales:</span>
                  <span className="text-red-400 font-medium">
                    {stats.totalLosses} ETH
                  </span>
                </div>
                <div className="flex justify-between p-4 bg-amber-900/70 rounded-lg col-span-1 md:col-span-2">
                  <span className="text-white font-bold">Ganancias netas: </span>
                  <span className={`${profitColor} font-bold text-lg`}>
                    {netProfit} ETH
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-center gap-4 mt-6">
              <button
                onClick={() => navigate("/game")}
                className="py-2 px-6 md:py-3 md:px-8 bg-green-700 hover:bg-green-800 hover:cursor-pointer text-white font-semibold rounded-md transition text-sm md:text-base"
              >
                Ir al juego
              </button>
              
              <button
                onClick={() => navigate("/stats")}
                className="py-2 px-6 md:py-3 md:px-8 bg-blue-700 hover:bg-blue-800 hover:cursor-pointer text-white font-semibold rounded-md transition text-sm md:text-base"
              >
                Ver estadísticas
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 bg-secondarygreen p-8 rounded-xl">
            <div className="mb-4">
              <DotLottieReact
                src="https://lottie.host/4b61260a-334c-46b1-8650-391425f41a3e/4RBt3M9FZZ.lottie"
                loop
                autoplay
                className="w-60 h-60 mx-auto"
              />
            </div>
            <p className="text-gray-200 text-xl mb-6">No se encontraron datos de balance para tu cuenta</p>
            <button
              onClick={() => navigate("/game")}
              className="py-2 px-6 md:py-3 md:px-8 bg-red-950 hover:bg-red-900 hover:cursor-pointer text-white font-semibold rounded-md transition text-sm md:text-base"
            >
              Jugar ahora
            </button>
          </div>
        )}
        
        <div className="w-full mt-12 border-t border-white/10 pt-8 pb-4 text-center">
          <p className="text-sm text-gray-400">Todos los balances están almacenados de forma segura y transparente en la blockchain de Ethereum</p>
          <p className="text-xs text-gray-500 mt-2">© {new Date().getFullYear()} Blackjack Ethereum. Todos los derechos reservados.</p>
        </div>
      </div>
    </div>
  );
};

export default BalancePage;
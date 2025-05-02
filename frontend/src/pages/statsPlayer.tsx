import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getAuthenticatedUser } from "../utils/sessionUtils";
import { useMetaMask } from "../hooks/useMetaMask";
import { getPlayerStats, getPlayerGames } from "../services/blackjackService";
import { PlayerStats, Game } from "../interfaces/IPlayer";
import { ClipLoader } from "react-spinners";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import Balance from "../components/Balance";

const StatsPlayer = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [games, setGames] = useState<Game[]>([]);
  const { account, connect } = useMetaMask();
  const userId = getAuthenticatedUser();
  const [balanceRefreshTrigger, setBalanceRefreshTrigger] = useState<number>(0);

  useEffect(() => {
    const fetchStatsAndGames = async () => {
      if (!account || !userId) return;

      try {
        setIsLoading(true);
        const [playerStats, playerGames] = await Promise.all([
          getPlayerStats(account),
          getPlayerGames(account),
        ]);
        setStats(playerStats);
        setGames(playerGames);
        setError(null);
      } catch (err) {
        console.error("Error al obtener estadísticas o partidas:", err);
        toast.error("No se pudieron cargar las estadísticas");
        setError(
          "No se pudieron cargar las estadísticas o partidas. Intenta de nuevo."
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchStatsAndGames();
  }, [account, userId, balanceRefreshTrigger]);

  // Calcular partidas perdidas y otros stats derivados
  const gamesLost = stats ? stats.gamesPlayed - stats.gamesWon : 0;
  const winRate = stats && stats.gamesPlayed > 0 
    ? ((stats.gamesWon / stats.gamesPlayed) * 100).toFixed(1) 
    : "0";
  
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
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 font-title text-center">Mis Estadísticas</h1>
        
        {error && (
          <div className="bg-red-900/30 border border-red-800/40 rounded-lg p-4 mb-6 text-red-200">
            <p>{error}</p>
          </div>
        )}

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <ClipLoader color="#ffffff" size={40} />
            <p className="text-gray-300 mt-4">Cargando estadísticas...</p>
          </div>
        ) : !account ? (
          <div className="flex flex-col items-center gap-6 py-12 bg-secondarygreen p-8 rounded-xl">
            <DotLottieReact
              src="https://lottie.host/a7258bbd-cd34-4c25-b9c1-9049161324ec/g3GE7ktSUs.lottie"
              loop
              autoplay
              className="w-40 h-40 mx-auto"
            />
            <p className="text-gray-200 text-center">Conecta tu wallet para ver tus estadísticas</p>
            <button
              onClick={connect}
              className="py-2 px-6 md:py-3 md:px-8 bg-red-950 hover:bg-red-900 text-white font-semibold rounded-md transition text-sm md:text-base"
            >
              Conectar MetaMask
            </button>
          </div>
        ) : stats ? (
              <div className="space-y-8">
                


            {/* Primera sección: Lottie (8 cols) y Balance (4 cols) en el mismo renglón */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
              {/* Lottie animation - 8 columnas */}
              <div className="md:col-span-9 flex justify-center">
                <DotLottieReact
                  src="https://lottie.host/4b61260a-334c-46b1-8650-391425f41a3e/4RBt3M9FZZ.lottie"
                  loop
                  autoplay
                  className="w-full h-full"
                />
              </div>
              
              {/* Sección de balance/wallet - 4 columnas */}
              <div className="md:col-span-3 p-6 rounded-xl">
                <h2 className="text-4xl font-bold mb-4">Tu Balance</h2>
                <Balance 
                  account={account} 
                  refreshTrigger={balanceRefreshTrigger}
                />
              </div>
            </div>
                
            
           
            
            {/* Información de depósito activo - Directamente desde contrato */}
            <div className=" p-6">
              <h2 className="text-4xl font-bold mb-4 text-center">Depósito Actual</h2>
              <div className="flex justify-between items-center p-3 bg-gray-800/60 rounded-lg">
                <div>
                  <p className="text-gray-300">Cantidad depositada:</p>
                  <p className="text-2xl font-bold text-green-400">{stats.initialDeposit} ETH</p>
                </div>
                <div className="text-right">
                  <p className="text-gray-300">Fecha de depósito:</p>
                  <p className="text-sm text-blue-400">{formatDate(stats.depositTimestamp)}</p>
                </div>
              </div>
              {parseFloat(stats.initialDeposit) <= 0 && (
                <p className="mt-3 text-center text-yellow-400 text-sm">
                  No tienes un depósito activo. Realiza un depósito para comenzar a jugar.
                </p>
              )}
                </div>
                
                
            
            {/* Sección de información general - Directamente desde contrato */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard label="Partidas jugadas" value={stats.gamesPlayed} />
              <StatCard
                label="Partidas ganadas"
                value={stats.gamesWon}
                color="text-green-400"
              />
              <StatCard
                label="Partidas perdidas"
                value={gamesLost}
                color="text-red-400"
              />
              <StatCard
                label="% Victoria"
                value={`${winRate}%`}
                color="text-blue-400"
              />
            </div>

            {/* Estado de deuda - Directamente desde contrato */}
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
                  Debes saldar esta deuda antes de poder seguir jugando.
                </p>
              </div>
            )}

            {/* Sección de balance financiero - Directamente desde contrato */}
            <div className="p-6 rounded-xl">
              <h2 className="text-4xl font-bold mb-4 text-center">Balance Financiero</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex justify-between p-3 rounded-lg">
                  <span className="text-white font-bold">Ganancias totales:</span>
                  <span className="text-green-400 font-medium">
                    {stats.totalWinnings} ETH
                  </span>
                </div>
                <div className="flex justify-between p-3 rounded-lg">
                  <span className="text-white font-bold">Pérdidas totales:</span>
                  <span className="text-red-400 font-medium">
                    {stats.totalLosses} ETH
                  </span>
                </div>
                <div className="flex justify-between p-3  bg-amber-900 rounded-lg col-span-1 md:col-span-2">
                  <span className="text-white font-bold">Ganancias netas: </span>
                  <span className={`${profitColor} font-bold text-lg`}>
                    {netProfit} ETH
                  </span>
                </div>
              </div>
            </div>

            {/* Sección de historial de partidas - Directamente desde contrato */}
            <div className="p-6 rounded-xl">
              <h2 className="text-4xl font-bold mb-4 text-center">
                Historial de Partidas
              </h2>
              {games.length > 0 ? (
                <div className="space-y-3 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                  {games.map((game, index) => (
                    <div
                      key={index}
                      className="bg-gray-800/60 rounded-lg p-4 flex justify-between items-center"
                    >
                      <div>
                        <p className="text-gray-400 text-sm">
                          {game.timestamp}
                        </p>
                        <p
                          className={`text-sm font-medium ${
                            game.result > 0
                              ? "text-green-400"
                              : game.result < 0
                              ? "text-red-400"
                              : "text-blue-400"
                          }`}
                        >
                          {game.result > 0
                            ? `Ganaste ${(parseFloat(game.bet) * 2).toFixed(6)} ETH`
                            : game.result < 0
                            ? `Perdiste ${game.bet} ETH`
                            : "Empate"}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-gray-300 text-sm">
                          Apuesta: {game.bet} ETH
                        </span>
                        {!game.settled &&  stats.hasPendingDebt && (
                          <p className="text-amber-400 text-xs mt-1">No liquidada</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 bg-gray-800/40 rounded-lg">
                  <p className="text-gray-400">No hay partidas registradas</p>
                  <button
                    onClick={() => navigate("/game")}
                    className="mt-4 py-2 px-6 md:py-2 md:px-6 bg-red-950 hover:bg-red-900 text-white font-semibold rounded-md transition text-sm md:text-base"
                  >
                    Jugar primera partida
                  </button>
                </div>
              )}
                </div>
                
            
            {/* consejo para el juego*/}
            <div className="p-5">
              <h3 className="text-4xl font-bold mb-3 text-center">¿Cómo mejorar tus estadísticas?</h3>
              <p className="text-white text-lg">
                Recuerda seguir la estrategia básica de Blackjack: plantarse en 17+ y pedir carta en 16 o menos. 
                Todas tus estadísticas están registradas directamente en la blockchain de Ethereum.
              </p>
            </div>

            <div className="flex justify-center mt-6">
              <button
                onClick={() => navigate("/game")}
                className="py-2 px-6 md:py-3 md:px-8 bg-red-950 hover:bg-red-900 text-white font-semibold rounded-md transition text-sm md:text-base"
              >
                Volver al juego
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
            <p className="text-gray-200 text-xl mb-6">No se encontraron estadísticas para tu cuenta</p>
            <button
              onClick={() => navigate("/game")}
              className="py-2 px-6 md:py-3 md:px-8 bg-red-950 hover:bg-red-900 text-white font-semibold rounded-md transition text-sm md:text-base"
            >
              Jugar ahora
            </button>
          </div>
        )}

        <div className="w-full mt-12 border-t border-white/10 pt-8 pb-4 text-center">
          <p className="text-sm text-gray-400">Todas las estadísticas están almacenadas de forma segura y transparente en la blockchain de Ethereum</p>
          <p className="text-xs text-gray-500 mt-2">© {new Date().getFullYear()} Blackjack Ethereum. Todos los derechos reservados.</p>
        </div>

      </div>
    </div>
  );
};

const StatCard = ({
  label,
  value,
  color = "text-white",
}: {
  label: string;
  value: number | string;
  color?: string;
}) => (
  <div className="bg-sky-800 p-5 rounded-xl text-center">
    <h3 className="text-lg font-bold mb-2">{label}</h3>
    <p className={`text-2xl font-bold ${color}`}>{value}</p>
  </div>
);

export default StatsPlayer;
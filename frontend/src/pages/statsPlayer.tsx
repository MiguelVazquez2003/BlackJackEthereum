import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getAuthenticatedUser } from "../utils/sessionUtils";
import { useMetaMask } from "../hooks/useMetaMask";
import { getPlayerStats, getPlayerGames } from "../services/blackjackService";
import { PlayerStats, Game } from "../interfaces/IPlayer";

const StatsPlayer = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [games, setGames] = useState<Game[]>([]);
  const { account } = useMetaMask();
  const userId = getAuthenticatedUser();

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
        setError(
          "No se pudieron cargar las estadísticas o partidas. Intenta de nuevo."
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchStatsAndGames();
  }, [account, userId]);

  // Calcular partidas perdidas
  const gamesLost = stats ? stats.gamesPlayed - stats.gamesWon : 0;

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center py-8 px-4">
      <div className="max-w-md w-full bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-white">Mis Estadísticas</h1>
          <button
            onClick={() => navigate("/game")}
            className="text-blue-400 hover:text-blue-300 text-sm font-medium"
          >
            ← Volver al juego
          </button>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500/30 text-red-200 px-4 py-3 rounded-lg mb-6">
            <p>{error}</p>
          </div>
        )}

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-10">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-400 mt-4">Cargando estadísticas...</p>
          </div>
        ) : stats ? (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-3">
              <Stat label="Partidas jugadas" value={stats.gamesPlayed} />
              <Stat
                label="Partidas ganadas"
                value={stats.gamesWon}
                color="text-green-400"
              />
              <Stat
                label="Partidas perdidas"
                value={gamesLost}
                color="text-red-400"
              />
              <Stat
                label="% Victoria"
                value={
                  stats.gamesPlayed > 0
                    ? `${((stats.gamesWon / stats.gamesPlayed) * 100).toFixed(
                        1
                      )}%`
                    : "0%"
                }
                color="text-blue-400"
              />
            </div>

            <div className="mt-6 pt-4 border-t border-gray-700">
              <h2 className="text-lg font-medium text-white mb-3">Balance</h2>
              <div className="bg-gray-700/30 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Ganancias totales:</span>
                  <span className="text-green-400 font-medium text-lg">
                    {stats.totalWinnings} ETH
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-700">
              <h2 className="text-lg font-medium text-white mb-3">
                Historial de Partidas
              </h2>
              {games.length > 0 ? (
                <ul className="space-y-3">
                  {games.map((game, index) => (
                    <li
                      key={index}
                      className="bg-gray-700/30 rounded-lg p-4 flex justify-between items-center"
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
                            ? "Ganaste"
                            : game.result < 0
                            ? "Perdiste"
                            : "Empate"}
                        </p>
                      </div>
                      <span className="text-gray-300 text-sm">
                        {game.bet} ETH
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-400">No hay partidas registradas</p>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-10">
            <p className="text-gray-400">No se encontraron estadísticas</p>
            <button
              onClick={() => navigate("/game")}
              className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm"
            >
              Jugar ahora
            </button>
          </div>
        )}

        <p className="text-center text-xs text-gray-500 mt-8">
          Estadísticas almacenadas de forma segura en la blockchain
        </p>
      </div>
    </div>
  );
};

// Componente para mostrar una estadística individual
const Stat = ({
  label,
  value,
  color = "text-white",
}: {
  label: string;
  value: number | string;
  color?: string;
}) => (
  <div className="bg-gray-700/30 rounded-lg p-3 text-center">
    <p className="text-gray-400 text-xs mb-1">{label}</p>
    <p className={`text-xl font-bold ${color}`}>{value}</p>
  </div>
);

export default StatsPlayer;

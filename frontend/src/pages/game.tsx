import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getAuthenticatedUser } from "../utils/sessionUtils";
import { useMetaMask } from "../hooks/useMetaMask";
import Hand from "../components/Hand";
import Balance from "../components/Balance";
import {
  checkAndRegisterCertificate,
  getMaxBet,
  recordGame,
  signGameResult,
  depositFunds,
  withdrawFunds,
} from "../services/blackjackService";
import { GameResult } from "../interfaces/IPlayer";
import {
  dealInitialCards,
  calculateHandValue,
  handleDealerTurn,
  startNewGameState,
  addRandomCardToHand,
  getGameResult,
} from "../services/gameService";
import { IHand } from "../types";

const Game = () => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState<string>("");
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const { account, connect } = useMetaMask();
  const [betAmount, setBetAmount] = useState<string>("0.00001");
  const [depositAmount, setDepositAmount] = useState<string>("0.01"); // Cantidad para depositar
  const [gameState, setGameState] = useState<
    "betting" | "playing" | "gameOver"
  >("betting");
  const [message, setMessage] = useState<string | null>(null);

  // Cartas del juego
  const [dealerCards, setDealerCards] = useState<IHand>({ cards: [] });
  const [playerCards, setPlayerCards] = useState<IHand>({ cards: [] });

  // Estados del juego
  const [gameResult, setGameResult] = useState<string | null>(null);
  const [isDealing, setIsDealing] = useState<boolean>(false);
  const [isBetting, setIsBetting] = useState<boolean>(false);

  // Estados para la actualización del saldo
  const [balanceRefreshTrigger, setBalanceRefreshTrigger] = useState<number>(0);
  const [maxBetAmount, setMaxBetAmount] = useState<string>("0.0001");

  useEffect(() => {
    // Obtener la apuesta máxima permitida del contrato
    const fetchMaxBet = async () => {
      try {
        const maxBet = await getMaxBet();
        setMaxBetAmount(maxBet);
      } catch (error) {
        console.error("Error al obtener la apuesta máxima:", error);
      }
    };

    fetchMaxBet();
  }, []);

  useEffect(() => {
    // Verificar si el usuario está autenticado
    const checkAuthentication = async () => {
      const userId = getAuthenticatedUser();
      if (userId) {
        setIsAuthenticated(true);
        setUserName(userId);
      }
    };

    checkAuthentication();
  }, [navigate]);

  const startNewGame = () => {
    const newState = startNewGameState();
    setDealerCards(newState.dealerCards);
    setPlayerCards(newState.playerCards);
    setGameResult(newState.gameResult);
    setMessage(newState.message);

    setGameState("betting");
  };

  const placeBet = async () => {
    if (!account) {
      setMessage("Debes conectar tu wallet de MetaMask para apostar");
      return;
    }

    try {
      setIsBetting(true);
      setMessage("Preparando tu apuesta...");

      // Verificar que la apuesta es válida
      if (parseFloat(betAmount) <= 0) {
        throw new Error("La cantidad apostada debe ser mayor que 0");
      }

      // Verificar y registrar el certificado del jugador
      const isCertificateValid = await checkAndRegisterCertificate(
        userName,
        setMessage
      );
      if (!isCertificateValid) {
        throw new Error(
          "No se pudo verificar o registrar tu certificado. Intenta de nuevo."
        );
      }

      // Iniciar el juego después de verificar los requisitos
      dealInitialCardsHandler();
      setGameState("playing");
      setMessage(null);
    } catch (error) {
      console.error("Error al realizar la apuesta:", error);
      setMessage(`Error al procesar la apuesta: ${(error as Error).message}`);
    } finally {
      setIsBetting(false);
    }
  };

  const dealInitialCardsHandler = () => {
    setIsDealing(true);

    const { dealerCards: newDealerCards, playerCards: newPlayerCards } =
      dealInitialCards();

    setDealerCards(newDealerCards);
    setPlayerCards(newPlayerCards);

    const playerTotal = calculateHandValue(newPlayerCards);
    if (playerTotal === 21) {
      const { dealerCards, result } = handleDealerTurn(
        newPlayerCards,
        newDealerCards
      );
      setDealerCards(dealerCards);
      setGameResult(result);
      setGameState("gameOver");
    }

    setIsDealing(false);
  };

  const handleHit = () => {
    const updatedPlayerCards = addRandomCardToHand(playerCards);
    setPlayerCards(updatedPlayerCards);

    const playerTotal = calculateHandValue(updatedPlayerCards);
    if (playerTotal > 21) {
      setGameResult("¡Te has pasado! Pierdes.");
      setGameState("gameOver");

      // Pasar los totales correctos para procesar el pago
      processPayment(playerTotal, calculateHandValue(dealerCards));
    } else if (playerTotal === 21) {
      handleStand();
    }
  };

  const handleStand = () => {
    const {
      dealerCards: newDealerCards,
      result,
      playerTotal,
      dealerTotal,
    } = handleDealerTurn(playerCards, dealerCards);
    setDealerCards(newDealerCards);
    setGameResult(result);
    setGameState("gameOver");

    // Usar los totales devueltos por handleDealerTurn
    processPayment(playerTotal, dealerTotal);
  };

const processPayment = async (playerTotal: number, dealerTotal: number) => {
  if (!account) {
    setMessage("Necesitas conectar tu wallet para procesar el pago");
    return;
  }

  try {
    // Convertir la puntuación a un formato que entienda el contrato
    const contractResult: GameResult = getGameResult(playerTotal, dealerTotal);

    // Si es empate, no realizar ninguna transacción
    if (contractResult === 0) {
      setMessage("Empate. No se realiza ninguna transacción.");
      return;
    }

    // Generar un nonce único para la partida
    const nonce = Math.floor(Date.now() / 1000);

    // Firmar el resultado
    setMessage("Firmando el resultado del juego...");
    const signature = await signGameResult(
      account,
      contractResult,
      betAmount,
      nonce
    );

    setMessage("Procesando transacción en blockchain...");

    // Registrar el resultado en el contrato
    await recordGame(contractResult, betAmount, signature, nonce);

    // Actualizar el estado para refrescar el saldo después de la transacción
    setBalanceRefreshTrigger((prev) => prev + 1);

    // Actualizar mensaje según el resultado
    if (contractResult > 0) {
      setMessage(`¡Felicidades! Has ganado. El resultado se ha registrado.`);
    } else {
      setMessage("Has perdido tu apuesta.");
    }
  } catch (error) {
    console.error("Error al procesar el pago:", error);
    setMessage(`Error al procesar el pago: ${(error as Error).message}`);
  }
};


  const handleDeposit = async () => {
    if (!account) {
      setMessage("Debes conectar tu wallet de MetaMask para depositar fondos");
      return;
    }

    try {
      setMessage("Procesando depósito...");
      await depositFunds(depositAmount);
      setMessage(`Depósito de ${depositAmount} ETH realizado con éxito.`);
      setBalanceRefreshTrigger((prev) => prev + 1);
    } catch (error) {
      console.error("Error al depositar fondos:", error);
      setMessage(`Error al depositar fondos: ${(error as Error).message}`);
    }
  };

  const handleWithdraw = async () => {
    if (!account) {
      setMessage("Debes conectar tu wallet de MetaMask para retirar fondos");
      return;
    }

    try {
      setMessage("Procesando retiro...");
      await withdrawFunds();
      setMessage("Retiro realizado con éxito.");
      setBalanceRefreshTrigger((prev) => prev + 1);
    } catch (error) {
      console.error("Error al retirar fondos:", error);
      setMessage(`Error al retirar fondos: ${(error as Error).message}`);
    }
  };

  const playerTotal = calculateHandValue(playerCards);
  const dealerTotal = calculateHandValue(dealerCards);

  // Si el usuario no está autenticado, redirigir a inicio
  if (!isAuthenticated) {
    return null; // No renderizar nada mientras se redirige
  }

  return (
    <div className="min-h-screen bg-gray-900 py-6 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Cabecera del juego */}
        <div className="bg-gray-800 rounded-lg shadow-xl p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-bold text-white">
              BlackJack Ethereum
            </h1>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate("/")}
                className="text-blue-400 hover:text-blue-300 flex items-center"
              >
                Tutorial
              </button>
              <div>
                <span className="text-gray-400 mr-2">Usuario:</span>
                <span className="text-white font-medium truncate max-w-[150px] inline-block align-bottom">
                  {userName.substring(0, 10)}...
                </span>
              </div>
            </div>
          </div>

          {/* Mensaje de estado del juego */}
          {message && (
            <div className="bg-blue-900/30 border border-blue-800/40 rounded-lg p-3 mb-6 text-blue-300 text-center">
              {message}
            </div>
          )}

          {/* Controles de depósito y retiro */}
          <div className="flex justify-between mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Cantidad a depositar:
              </label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleDeposit}
                className="mt-2 w-full py-2 px-4 bg-green-600 hover:bg-green-700 text-white rounded-lg"
              >
                Depositar
              </button>
            </div>
            <div>
              <button
                onClick={handleWithdraw}
                className="mt-8 w-full py-2 px-4 bg-red-600 hover:bg-red-700 text-white rounded-lg"
              >
                Retirar Fondos
              </button>
            </div>
          </div>

          {/* Mesa de juego */}
          <div
            className={`bg-green-900 rounded-lg p-6 mb-6 transition-opacity duration-300 ${
              gameState === "betting" ? "opacity-70" : "opacity-100"
            }`}
          >
            {/* Cartas del dealer */}
            <div className="mb-6">
              <h2 className="text-white text-lg mb-2">
                Dealer:{" "}
                {gameState === "betting" && dealerCards.cards.length < 1
                  ? "?"
                  : dealerTotal}
              </h2>
              <div className="flex flex-wrap">
                {dealerCards.cards.length > 0 ? (
                  <Hand cards={dealerCards.cards} />
                ) : (
                  <Hand cards={dealerCards.cards} isHidden={true} />
                )}
              </div>
            </div>

            {/* Cartas del jugador */}
            <div>
              <h2 className="text-white text-lg mb-2">
                Jugador: {playerTotal}
              </h2>
              <div className="flex flex-wrap">
                {playerCards.cards.length > 0 ? (
                  <Hand cards={playerCards.cards} />
                ) : (
                  <Hand cards={dealerCards.cards} isHidden={true} />
                )}
              </div>
            </div>

            {/* Resultado del juego */}
            {gameResult && (
              <div className="bg-gray-800/80 text-white text-xl font-bold py-3 px-6 rounded-lg mt-4 text-center">
                {gameResult}
              </div>
            )}
          </div>

          {/* Controles del juego */}
          {gameState === "betting" ? (
            <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
              <div className="w-full md:w-2/3">
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Cantidad a apostar:
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0.00001"
                    step="0.00001"
                    value={betAmount}
                    onChange={(e) => setBetAmount(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <span className="text-gray-400">ETH</span>
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Apuesta mínima: 0.00001 ETH
                </p>
              </div>

              <div className="w-full md:w-1/3 flex items-end">
                <button
                  onClick={placeBet}
                  disabled={
                    !account || isBetting || parseFloat(betAmount) < 0.00001
                  }
                  className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                    !account || isBetting || parseFloat(betAmount) < 0.00001
                      ? "bg-gray-600 cursor-not-allowed"
                      : "bg-green-600 hover:bg-green-700 text-white"
                  }`}
                >
                  {isBetting ? "Procesando..." : "Apostar"}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex justify-between space-x-4">
              <button
                onClick={handleHit}
                disabled={
                  gameState === "gameOver" || playerTotal >= 21 || isDealing
                }
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                  gameState === "gameOver" || playerTotal >= 21 || isDealing
                    ? "bg-gray-600 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700 text-white"
                }`}
              >
                Pedir Carta
              </button>

              <button
                onClick={handleStand}
                disabled={gameState === "gameOver" || isDealing}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                  gameState === "gameOver" || isDealing
                    ? "bg-gray-600 cursor-not-allowed"
                    : "bg-amber-600 hover:bg-amber-700 text-white"
                }`}
              >
                Plantarse
              </button>

              <button
                onClick={startNewGame}
                disabled={isBetting || isDealing}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                  isBetting || isDealing
                    ? "bg-gray-600 cursor-not-allowed"
                    : "bg-green-600 hover:bg-green-700 text-white"
                }`}
              >
                {gameState === "gameOver" ? "Nueva Partida" : "Cancelar"}
              </button>
            </div>
          )}
        </div>
        {/* Sección de MetaMask */}
        <div className="bg-gray-800 rounded-lg shadow-xl p-6 mb-6">
          <h2 className="text-xl font-bold text-white mb-4">
            Conexión con Blockchain
          </h2>

          <div className="mb-4 flex flex-wrap justify-between items-center">
            <button
              onClick={connect}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                account
                  ? "bg-green-600 text-white"
                  : "bg-blue-600 hover:bg-blue-700 text-white"
              }`}
            >
              {account
                ? "MetaMask Conectado"
                : "Conectar MetaMask para Apostar"}
            </button>

            {account && (
              <Balance
                account={account}
                refreshTrigger={balanceRefreshTrigger}
              />
            )}
          </div>

          {account ? (
            <div className="mt-2 text-sm text-gray-300">
              <span className="font-medium text-gray-400">Dirección: </span>
              <span className="font-mono">
                {account.substring(0, 6)}...
                {account.substring(account.length - 4)}
              </span>
            </div>
          ) : (
            <p className="mt-2 text-sm text-yellow-500">
              Debes conectar tu wallet de MetaMask para poder apostar
            </p>
          )}

          <div className="bg-blue-900/20 border border-blue-800/30 rounded-lg p-3 mt-4">
            <h3 className="text-sm font-medium text-blue-300 mb-2">
              Información de blockchain:
            </h3>
            <p className="text-xs text-gray-300 mb-1">
              • Todas las apuestas se registran en la blockchain de Ethereum
            </p>
            <p className="text-xs text-gray-300 mb-1">
              • Los pagos son automáticos mediante smart contracts
            </p>
            <p className="text-xs text-gray-300 mb-1">
              • Apuesta máxima: {maxBetAmount} ETH
            </p>
            <p className="text-xs text-gray-300">
              • Los resultados son verificables y transparentes
            </p>
          </div>
        </div>

        <button
          onClick={() => navigate("/stats")}
          className="text-blue-400 hover:text-blue-300 flex items-center"
        >
          <svg className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M3 3a1 1 0 000 2h10a1 1 0 100-2H3zm0 4a1 1 0 000 2h6a1 1 0 100-2H3zm0 4a1 1 0 100 2h8a1 1 0 100-2H3z"
              clipRule="evenodd"
            />
          </svg>
          Mis Estadísticas
        </button>
      </div>
    </div>
  );
};

export default Game;

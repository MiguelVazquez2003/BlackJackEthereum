import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getAuthenticatedUser } from "../utils/sessionUtils";
import { useMetaMask } from "../hooks/useMetaMask";
import Hand from "../components/Hand";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  checkAndRegisterCertificate,
  getMaxBet,
  recordGame,
  signGameResult,
  checkPlayerDebt,
  payPlayerDebt,
  getPlayerStats,
  recordUnpaidGame,
} from "../services/blackjackService";
import { GameResult, PlayerStats } from "../interfaces/IPlayer";
import {
  dealInitialCards,
  calculateHandValue,
  handleDealerTurn,
  startNewGameState,
  addRandomCardToHand,
  getGameResult,
} from "../services/gameService";
import { IHand } from "../types";
import { ClipLoader } from "react-spinners";
// Import the modal components
import Apuesta from "./apuesta";
import Depositos from "./depositos";

const Game = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [userName, setUserName] = useState<string>("");
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const { account } = useMetaMask();
  const [betAmount, setBetAmount] = useState<string>("0.00001");
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
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Estados para la actualización del saldo
  const [balanceRefreshTrigger, setBalanceRefreshTrigger] = useState<number>(0);
  const [maxBetAmount, setMaxBetAmount] = useState<string>("0.0001");
  const [playerStats, setPlayerStats] = useState<PlayerStats | null>(null);
  const [hasDebt, setHasDebt] = useState<boolean>(false);
  const [debtAmount, setDebtAmount] = useState<string>("0");
  const [initialDeposit, setInitialDeposit] = useState<string>("0");

  // Estados para modales
  const [showDepositModal, setShowDepositModal] = useState<boolean>(false);
  const [showBetModal, setShowBetModal] = useState<boolean>(false);

  useEffect(() => {
    // Obtener la apuesta desde los parámetros de URL si existe
    const urlBet = searchParams.get("bet");
    if (urlBet) {
      setBetAmount(urlBet);
    }
    
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
  }, [searchParams]);

  useEffect(() => {
    // Verificar si el usuario está autenticado
    const checkAuthentication = async () => {
      const userId = getAuthenticatedUser();
      if (userId) {
        setIsAuthenticated(true);
        setUserName(userId);
      } else {
        navigate("/");
      }
    };

    checkAuthentication();
  }, [navigate]);

  useEffect(() => {
    // Verificar deudas y estadísticas del jugador cuando se conecta la wallet
    const checkPlayerStatus = async () => {
      if (account) {
        try {
          // Verificar si el jugador tiene deudas pendientes
          const { hasDebt: playerHasDebt, debtAmount: playerDebtAmount } = 
            await checkPlayerDebt(account);
          
          setHasDebt(playerHasDebt);
          setDebtAmount(playerDebtAmount);
          
          // Obtener estadísticas del jugador
          const stats = await getPlayerStats(account);
          setPlayerStats(stats);
          setInitialDeposit(stats.initialDeposit);
          
          if (playerHasDebt) {
            toast.error(`Tienes una deuda pendiente de ${playerDebtAmount} ETH. Debes saldarla antes de jugar.`);
          }
        } catch (error) {
          console.error("Error al obtener el estado del jugador:", error);
        }
      }
    };
    
    checkPlayerStatus();
  }, [account, balanceRefreshTrigger]);

  const startNewGame = () => {
    const newState = startNewGameState();
    setDealerCards(newState.dealerCards);
    setPlayerCards(newState.playerCards);
    setGameResult(newState.gameResult);
    setMessage(newState.message);

    setGameState("betting");
  };

  const handlePayDebt = async () => {
    if (!account) {
      toast.error("Conecta tu wallet para saldar la deuda");
      return;
    }

    setIsProcessing(true);
    try {
      setMessage(`Pagando deuda de ${debtAmount} ETH...`);
      await payPlayerDebt();
      toast.success("¡Deuda pagada con éxito!");
      setHasDebt(false);
      setDebtAmount("0");
      setBalanceRefreshTrigger((prev) => prev + 1);
      setMessage("Deuda saldada. Ya puedes seguir jugando.");
    } catch (error) {
      console.error("Error al pagar la deuda:", error);
      setMessage(`Error al saldar la deuda: ${(error as Error).message}`);
      toast.error("Error al pagar la deuda");
    } finally {
      setIsProcessing(false);
    }
  };

  const placeBet = async () => {
    if (!account) {
      toast.error("Debes conectar tu wallet de MetaMask para apostar");
      return;
    }

    if (hasDebt) {
      toast.error(`Tienes una deuda pendiente de ${debtAmount} ETH. Debes saldarla antes de jugar.`);
      return;
    }

    if (parseFloat(initialDeposit) <= 0) {
      toast.error("Necesitas hacer un depósito inicial antes de jugar");
      return;
    }

    try {
      setIsBetting(true);
      setMessage("Preparando tu apuesta...");

      // Verificar que la apuesta es válida
      if (parseFloat(betAmount) <= 0) {
        throw new Error("La cantidad apostada debe ser mayor que 0");
      }

      if (parseFloat(betAmount) > parseFloat(maxBetAmount)) {
        throw new Error(`La apuesta máxima permitida es ${maxBetAmount} ETH`);
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
      setShowBetModal(false); // Cerrar el modal de apuesta si está abierto
      setMessage(null);
    } catch (error) {
      console.error("Error al realizar la apuesta:", error);
      toast.error(`Error: ${(error as Error).message}`);
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
      
      // Si es blackjack, procesar el pago automáticamente
      const dealerTotal = calculateHandValue(dealerCards);
      processPayment(playerTotal, dealerTotal);
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
    setIsProcessing(true);
    // Convertir la puntuación a un formato que entienda el contrato
    const contractResult: GameResult = getGameResult(playerTotal, dealerTotal);

    // Si es empate, no realizar ninguna transacción
    if (contractResult === 0) {
      setMessage("Empate. No se realiza ninguna transacción.");
      setIsProcessing(false);
      return;
    }

    // Generar un nonce único para la partida
    const nonce = Math.floor(Date.now() / 1000);

    // Firmar el resultado
    setMessage("Firmando el resultado del juego...");
    
    let signature;
    try {
      signature = await signGameResult(
        account,
        contractResult,
        betAmount,
        nonce
      );
    } catch (error) {
      console.error("Error al firmar el resultado:", error);
      // Si hay un error al firmar, registrar como partida no liquidada
      await handleUnpaidGame();
      return;
    }

    setMessage("Procesando transacción en blockchain...");

    // Registrar el resultado en el contrato
    try {
      await recordGame(contractResult, betAmount, signature, nonce);
      
      // Actualizar el estado para refrescar el saldo después de la transacción
      setBalanceRefreshTrigger((prev) => prev + 1);

      // Actualizar mensaje según el resultado
      if (contractResult > 0) {
        toast.success(`¡Felicidades! Has ganado ${parseFloat(betAmount) * 2} ETH`);
        setMessage(`¡Felicidades! Has ganado. El resultado se ha registrado.`);
      } else {
        toast.warning(`Has perdido tu apuesta de ${betAmount} ETH`);
        setMessage("Has perdido tu apuesta.");
      }
    } catch (error) {
      console.error("Error al procesar el pago:", error);
      toast.error("Error al procesar el pago en la blockchain");
      setMessage(`Error al procesar el pago: ${(error as Error).message}`);
      
      // Si hay un error al registrar la partida, marcarla como no liquidada
      await handleUnpaidGame();
    }
  } catch (error) {
    console.error("Error general en processPayment:", error);
    toast.error("Error al procesar el pago");
    setMessage(`Error al procesar el pago: ${(error as Error).message}`);
    
    // En caso de error general, también intentar registrar como no liquidada
    await handleUnpaidGame();
  } finally {
    setIsProcessing(false);
  }
};

// Nueva función para manejar partidas no liquidadas
const handleUnpaidGame = async () => {
  if (!account) return;
  
  try {
    toast.warning(`Se registrará esta partida como no liquidada. Por favor, salda tu deuda pendiente.`);
    
    // Registrar la partida como no pagada
    await recordUnpaidGame(account, betAmount);
    
    // Actualizar el estado local
    setHasDebt(true);
    setDebtAmount(betAmount);
    setBalanceRefreshTrigger(prev => prev + 1);
    
    // Mostrar mensaje al usuario
    setMessage(`Se ha registrado una deuda pendiente de ${betAmount} ETH. Por favor, sáldala para seguir jugando.`);
  } catch (error) {
    console.error("Error al registrar partida no pagada:", error);
    toast.error("No se pudo registrar la partida correctamente. Contacta con soporte.");
    setMessage("Error al registrar partida. Por favor, contacta con soporte técnico.");
  }
};
  
  

  // Función para manejar nueva apuesta
  const handleNewBet = () => {
    setShowBetModal(true);
  };

  // Función para gestionar depósitos
  const handleManageDeposits = () => {
    setShowDepositModal(true);
  };
  
  // Handle callbacks from modals
  const handleApuestaComplete = (newBetAmount: string) => {
    setBetAmount(newBetAmount);
    setShowBetModal(false);
    placeBet();
  };
  
  const handleDepositComplete = () => {
    setShowDepositModal(false);
    setBalanceRefreshTrigger(prev => prev + 1);
  };

  const playerTotal = calculateHandValue(playerCards);
  const dealerTotal = calculateHandValue(dealerCards);

  // Si el usuario no está autenticado, redirigir a inicio
  if (!isAuthenticated) {
    return null; // No renderizar nada mientras se redirige
  }

  return (
    <div className="min-h-screen bg-casinogreen py-6 px-4">
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


      <div className="max-w-4xl mx-auto">
        {/* Cabecera del juego */}
        <div className="p-6 mb-6">

          <div className="flex justify-center items-center mb-4">
            <h1 className="text-4xl font-bold text-white">
              BlackJack Ethereum
            </h1>
          </div>


          <div>
                <span className="text-white mr-2">Usuario:</span>
                <span className="text-white font-medium truncate max-w-[150px] inline-block align-bottom">
                  {userName.substring(0, 30)}
                </span>
          </div>

          {/* Mensaje de estado del juego */}
          {message && (
            <div className="bg-blue-900/30 border border-blue-800/40 rounded-lg p-3 mb-6 text-blue-300 text-center">
              {message}
            </div>
          )}

          {/* Alerta de deuda pendiente */}
          {hasDebt && (
            <div className="bg-red-900/30 border border-red-800/40 rounded-lg p-4 mb-6">
              <h3 className="text-red-300 font-bold mb-2">¡Tienes una deuda pendiente!</h3>
              <p className="text-red-200 mb-2">
                Debes saldar tu deuda de {debtAmount} ETH antes de poder seguir jugando.
              </p>
              <button
                onClick={handlePayDebt}
                disabled={isProcessing}
                className="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg w-full"
              >
                {isProcessing ? (
                  <span className="flex items-center justify-center">
                    <ClipLoader color="#ffffff" size={16} className="mr-2" />
                    Procesando...
                  </span>
                ) : (
                  `Pagar Deuda (${debtAmount} ETH)`
                )}
              </button>
            </div>
          )}

          
          {/* Información de depósito inicial */}
          <div className="p-4 mb-8 m-7">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-white font-bold ">Depósito inicial:</h3>
                <p className="text-xl font-bold text-green-400">
                  {initialDeposit} ETH
                </p>
              </div>
              {playerStats && (
                <div className="text-right">
                  <p className="text-gray-400 text-sm">
                    Partidas jugadas: <span className="text-white">{playerStats.gamesPlayed}</span>
                  </p>
                  <p className="text-gray-400 text-sm">
                    Partidas ganadas: <span className="text-green-400">{playerStats.gamesWon}</span>
                  </p>
                </div>
              )}
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
{gameState === "playing" ? (
  <div className="flex justify-between space-x-4">
    <button
      onClick={handleHit}
      disabled={
        gameState !== "playing" || playerTotal >= 21 || isDealing || isProcessing
      }
      className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
        gameState !== "playing" || playerTotal >= 21 || isDealing || isProcessing
          ? "bg-gray-600 cursor-not-allowed"
          : "bg-blue-600 hover:bg-blue-700 text-white"
      }`}
    >
      Pedir Carta
    </button>

    <button
      onClick={handleStand}
      disabled={gameState !== "playing" || isDealing || isProcessing}
      className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
        gameState !== "playing" || isDealing || isProcessing
          ? "bg-gray-600 cursor-not-allowed"
          : "bg-amber-600 hover:bg-amber-700 text-white"
      }`}
    >
      Plantarse
    </button>

   <button
  onClick={startNewGame}
  disabled={isBetting || isDealing || isProcessing}
  className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
    isBetting || isDealing || isProcessing
      ? "bg-gray-600 cursor-not-allowed"
      : "bg-green-600 hover:bg-green-700 text-white"
  }`}
>
  Cancelar
</button>
    
  </div>
          ) : (
            <div className="flex flex-col space-y-4">
              <button
                onClick={handleNewBet}
                disabled={isProcessing || hasDebt || parseFloat(initialDeposit) <= 0}
                className={`py-2 px-4 rounded-lg font-medium transition-colors ${
                  isProcessing || hasDebt || parseFloat(initialDeposit) <= 0
                    ? "bg-gray-600 cursor-not-allowed"
                    : "bg-green-600 hover:bg-green-700 text-white"
                }`}
              >
                Nueva Apuesta
              </button>
              
              <button
                onClick={handleManageDeposits}
                disabled={isProcessing}
                className="py-2 px-4 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-medium"
              >
                Gestionar Depósitos
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal para Nueva Apuesta */}
      {showBetModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/80 z-50">
          <div className="bg-gray-800 p-6 rounded-lg shadow-xl max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">Nueva Apuesta</h2>
              <button onClick={() => setShowBetModal(false)} className="text-gray-400 hover:text-white">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path>
                </svg>
              </button>
            </div>
            <Apuesta onApuestaComplete={handleApuestaComplete} />
          </div>
        </div>
      )}

      {/* Modal para Gestionar Depósitos */}
      {showDepositModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/80 z-50">
          <div className="bg-gray-800 p-6 rounded-lg shadow-xl max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">Gestionar Depósitos</h2>
              <button onClick={() => setShowDepositModal(false)} className="text-gray-400 hover:text-white">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path>
                </svg>
              </button>
            </div>
            <Depositos onDepositComplete={handleDepositComplete} />
          </div>
        </div>
      )}
    </div>
  );
};

export default Game;
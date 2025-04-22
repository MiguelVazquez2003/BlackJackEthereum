import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuthenticatedUser } from '../utils/sessionUtils';
import { getCertificate } from '../utils/indexedDB';
import { useMetaMask } from '../hooks/useMetaMask';
import Hand from '../components/Hand';
import Balance from '../components/Balance';
import { 
  BlackjackGame, 
  recordGameResult, 
  signGameResult,
  GameResult,
  getMaxBet,
  registerPlayerCertificate
} from '../contracts/blackjack';

const Game = () => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState<string>('');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const { account, connect } = useMetaMask();
  const [betAmount, setBetAmount] = useState<string>('0.00001');
  const [gameState, setGameState] = useState<'betting' | 'playing' | 'gameOver'>('betting');
  const [message, setMessage] = useState<string | null>(null);
  
  // Cartas del juego
  const [dealerCards, setDealerCards] = useState<number[]>([]);
  const [playerCards, setPlayerCards] = useState<number[]>([]);
  
  // Estados del juego
  const [gameResult, setGameResult] = useState<string | null>(null);
  const [isDealing, setIsDealing] = useState<boolean>(false);
  const [isBetting, setIsBetting] = useState<boolean>(false);

  // Estados para la actualización del saldo
  const [balanceRefreshTrigger, setBalanceRefreshTrigger] = useState<number>(0);
  const [maxBetAmount, setMaxBetAmount] = useState<string>('0.0001');

  useEffect(() => {
    // Obtener la apuesta máxima permitida del contrato
    const fetchMaxBet = async () => {
      try {
        const maxBet = await getMaxBet();
        setMaxBetAmount(maxBet);
      } catch (error) {
        console.error('Error al obtener la apuesta máxima:', error);
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
        
        try {
          const certificate = await getCertificate(userId);
          if (certificate) {
            // Aquí podrías hacer algo con el certificado si es necesario
          }
        } catch (error) {
          console.error('Error al obtener el certificado:', error);
        }
      } else {
        // Si no está autenticado, redirigir a inicio
        navigate('/');
      }
    };
    
    checkAuthentication();
  }, [navigate]);

  // Lógica del juego
  const startNewGame = () => {
    // Reiniciamos el estado del juego
    setDealerCards([]);
    setPlayerCards([]);
    setGameResult(null);
    setGameState('betting');
    setMessage(null);
  };

  const placeBet = async () => {
    if (!account) {
      setMessage('Debes conectar tu wallet de MetaMask para apostar');
      return;
    }
    
    try {
      setIsBetting(true);
      setMessage('Preparando tu apuesta...');
      
      // Verificar que la apuesta es válida
      if (parseFloat(betAmount) <= 0) {
        throw new Error('La cantidad apostada debe ser mayor que 0');
      }
      
      // Verificar y registrar el certificado del jugador
      const isCertificateValid = await checkAndRegisterCertificate();
      if (!isCertificateValid) {
        throw new Error('No se pudo verificar o registrar tu certificado. Intenta de nuevo.');
      }
      
      // Iniciar el juego después de verificar los requisitos
      dealInitialCards();
      setGameState('playing');
      setMessage(null);
    } catch (error) {
      console.error('Error al realizar la apuesta:', error);
      setMessage(`Error al procesar la apuesta: ${(error as Error).message}`);
    } finally {
      setIsBetting(false);
    }
  };

  const dealInitialCards = () => {
    setIsDealing(true);
    
    // Generar cartas iniciales aleatorias
    const newDealerCards = [
      Math.floor(Math.random() * 13) + 1,
      Math.floor(Math.random() * 13) + 1
    ];
    
    const newPlayerCards = [
      Math.floor(Math.random() * 13) + 1,
      Math.floor(Math.random() * 13) + 1
    ];
    
    setDealerCards(newDealerCards);
    setPlayerCards(newPlayerCards);
    
    // Verificar si hay BlackJack natural
    const playerTotal = calculateHandTotal(newPlayerCards);
    if (playerTotal === 21) {
      handleDealerTurn(newPlayerCards, newDealerCards);
    }
    
    setIsDealing(false);
  };

  const handleHit = () => {
    // Añadir una carta aleatoria entre 1 y 13
    const newCard = Math.floor(Math.random() * 13) + 1;
    const updatedPlayerCards = [...playerCards, newCard];
    setPlayerCards(updatedPlayerCards);
    
    // Verificar si el jugador se pasa de 21
    const playerTotal = calculateHandTotal(updatedPlayerCards);
    if (playerTotal > 21) {
      setGameResult('¡Te has pasado! Pierdes.');
      setGameState('gameOver');
      
      // Procesar el pago cuando el jugador pierde por pasarse de 21
      processPayment('Pierdes.');
    } else if (playerTotal === 21) {
      // Si llega a 21, automáticamente hacer stand
      handleStand();
    }
  };

  const handleStand = () => {
    handleDealerTurn(playerCards, dealerCards);
  };

  const handleDealerTurn = (updatedPlayerCards: number[], currentDealerCards: number[]) => {
    // Simular el turno del dealer
    let newDealerCards = [...currentDealerCards];
    let dealerTotal = calculateHandTotal(newDealerCards);
    
    // El dealer toma cartas hasta tener 17 o más
    while (dealerTotal < 17) {
      const newCard = Math.floor(Math.random() * 13) + 1;
      newDealerCards.push(newCard);
      dealerTotal = calculateHandTotal(newDealerCards);
    }
    
    setDealerCards(newDealerCards);
    
    // Determinar el resultado del juego
    const playerTotal = calculateHandTotal(updatedPlayerCards);
    
    let result: string;
    if (playerTotal > 21) {
      result = '¡Te has pasado! Pierdes.';
    } else if (dealerTotal > 21) {
      result = '¡El dealer se pasó! Ganas.';
    } else if (playerTotal === dealerTotal) {
      result = 'Empate.';
    } else if (playerTotal > dealerTotal) {
      result = '¡Ganas!';
    } else {
      result = 'Pierdes.';
    }
    
    // Actualizar estado de juego
    setGameResult(result);
    setGameState('gameOver');
    
    processPayment(result);
  };

  const processPayment = async (result: string) => {
    if (!account) {
      setMessage('Necesitas conectar tu wallet para procesar el pago');
      return;
    }

    try {
      // Determinar el resultado del juego para el contrato
      let gameResultValue: GameResult;
      
      if (result.includes('Ganas')) {
        gameResultValue = 1; // Jugador gana
      } else if (result.includes('Empate')) {
        gameResultValue = 0; // Empate
      } else {
        gameResultValue = -1; // Jugador pierde
      }
      
      // Convertir la puntuación a un formato que entienda el contrato
      const contractResult: GameResult = BlackjackGame.getGameResult(
        calculateHandTotal(playerCards),
        calculateHandTotal(dealerCards)
      );
      
      // Firmar el resultado
      setMessage('Firmando el resultado del juego...');
      const signature = await signGameResult(account, contractResult, betAmount);
      
      setMessage('Procesando transacción en blockchain...');
      
      // Registrar el resultado en el contrato
      await recordGameResult(contractResult, betAmount, signature);
      
      // Actualizar el estado para refrescar el saldo después de la transacción
      setBalanceRefreshTrigger(prev => prev + 1);
      
      // Actualizar mensaje según el resultado
      if (contractResult > 0) {
        // Si hay blackjack natural (21 con 2 cartas) paga 3:2
        const isBlackjack = playerCards.length === 2 && calculateHandTotal(playerCards) === 21;
        const multiplier = isBlackjack ? 1.5 : 1; // Multiplicador adicional para blackjack
        const winAmount = (parseFloat(betAmount) * multiplier).toFixed(8);
        
        setMessage(`¡Felicidades! Has ganado ${winAmount} ETH. El pago se ha procesado en la blockchain.`);
      } else if (contractResult === 0) {
        setMessage('Empate. Tu apuesta de ' + betAmount + ' ETH ha sido devuelta.');
      } else {
        setMessage('Has perdido tu apuesta de ' + betAmount + ' ETH.');
      }
    } catch (error) {
      console.error('Error al procesar el pago:', error);
      setMessage(`Error al procesar el pago: ${(error as Error).message}`);
    }
  };

  // Calcular total de las manos
  const calculateHandTotal = (cards: number[]) => {
    let total = 0;
    let aces = 0;
    
    for (const card of cards) {
      if (card === 1) {
        aces += 1;
        total += 11;
      } else {
        total += Math.min(card, 10);
      }
    }
    
    // Ajustar los ases si es necesario
    while (total > 21 && aces > 0) {
      total -= 10;
      aces -= 1;
    }
    
    return total;
  };

  // Función para verificar y registrar el certificado del jugador en el contrato
  const checkAndRegisterCertificate = async () => {
    if (!account) return false;
    
    try {
      // Obtener el certificado del almacenamiento local
      const certificate = await getCertificate(userName);
      if (!certificate) {
        setMessage('No tienes un certificado registrado. Ve a tu perfil para registrarlo.');
        return false;
      }
      
      // Intentar registrar el certificado en el contrato
      setMessage('Registrando tu certificado en la blockchain...');
      
      // Limpiar campos privados sensibles antes de enviarlo al contrato
      const secureCertificate = {
        ...certificate,
        publicKey: certificate.publicKey || {},  // Asegurar que publicKey existe
        userID: certificate.userID || account,   // Usar account si no hay userID
        date: certificate.date || new Date().toISOString(),
        // No incluir la clave privada en los datos enviados al contrato
        privateKey: undefined
      };
      
      await registerPlayerCertificate(secureCertificate);
      setMessage('Certificado registrado correctamente.');
      return true;
    } catch (error: any) {
      // Si el error contiene "execution reverted", pero no "Jugador no registrado"
      // significa que el certificado ya podría estar registrado
      if (error.message && error.message.includes('execution reverted') && 
          !error.message.includes('Jugador no registrado')) {
        console.log('El certificado probablemente ya está registrado');
        return true;
      }
      
      console.error('Error al registrar el certificado:', error);
      // Mostrar mensaje más amigable y detallado
      const errorMsg = error.message?.includes('invalid string value') 
        ? 'Error en el formato del certificado. Intenta actualizar tu certificado en la página de perfil.'
        : `Error al registrar el certificado: ${error.message}`;
      
      setMessage(errorMsg);
      return false;
    }
  };

  const playerTotal = calculateHandTotal(playerCards);
  const dealerTotal = calculateHandTotal(dealerCards);

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
            <h1 className="text-3xl font-bold text-white">BlackJack Ethereum</h1>
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => navigate('/')}
                className="text-blue-400 hover:text-blue-300 flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
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
          
          {/* Mesa de juego */}
          <div className={`bg-green-900 rounded-lg p-6 mb-6 transition-opacity duration-300 ${gameState === 'betting' ? 'opacity-60' : 'opacity-100'}`}>
            {/* Cartas del dealer */}
            <div className="mb-6">
              <h2 className="text-white text-lg mb-2">Dealer: {gameState === 'playing' && dealerCards.length > 0 ? '?' : dealerTotal}</h2>
              <div className="flex flex-wrap">
                {dealerCards.length > 0 ? (
                  <Hand 
                    cards={dealerCards} 
                    hideFirstCard={gameState === 'playing'} 
                  />
                ) : (
                  <div className="w-16 h-24 bg-gray-800/50 rounded-lg border border-gray-700 flex items-center justify-center">
                    <span className="text-gray-500">?</span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Cartas del jugador */}
            <div>
              <h2 className="text-white text-lg mb-2">Jugador: {playerTotal}</h2>
              <div className="flex flex-wrap">
                {playerCards.length > 0 ? (
                  <Hand cards={playerCards} />
                ) : (
                  <div className="w-16 h-24 bg-gray-800/50 rounded-lg border border-gray-700 flex items-center justify-center">
                    <span className="text-gray-500">?</span>
                  </div>
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
          {gameState === 'betting' ? (
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
                <p className="text-xs text-gray-400 mt-1">Apuesta mínima: 0.00001 ETH</p>
              </div>
              
              <div className="w-full md:w-1/3 flex items-end">
                <button
                  onClick={placeBet}
                  disabled={!account || isBetting || parseFloat(betAmount) < 0.00001}
                  className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                    !account || isBetting || parseFloat(betAmount) < 0.00001
                      ? 'bg-gray-600 cursor-not-allowed'
                      : 'bg-green-600 hover:bg-green-700 text-white'
                  }`}
                >
                  {isBetting ? 'Procesando...' : 'Apostar'}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex justify-between space-x-4">
              <button
                onClick={handleHit}
                disabled={gameState === 'gameOver' || playerTotal >= 21 || isDealing}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                  gameState === 'gameOver' || playerTotal >= 21 || isDealing
                    ? 'bg-gray-600 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                Pedir Carta
              </button>
              
              <button
                onClick={handleStand}
                disabled={gameState === 'gameOver' || isDealing}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                  gameState === 'gameOver' || isDealing
                    ? 'bg-gray-600 cursor-not-allowed'
                    : 'bg-amber-600 hover:bg-amber-700 text-white'
                }`}
              >
                Plantarse
              </button>
              
              <button
                onClick={startNewGame}
                disabled={isBetting || isDealing}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                  isBetting || isDealing
                    ? 'bg-gray-600 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
              >
                {gameState === 'gameOver' ? 'Nueva Partida' : 'Cancelar'}
              </button>
            </div>
          )}
        </div>
        
        {/* Sección de MetaMask */}
        <div className="bg-gray-800 rounded-lg shadow-xl p-6 mb-6">
          <h2 className="text-xl font-bold text-white mb-4">Conexión con Blockchain</h2>
          
          <div className="mb-4 flex flex-wrap justify-between items-center">
            <button 
              onClick={connect}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                account 
                  ? 'bg-green-600 text-white' 
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {account ? 'MetaMask Conectado' : 'Conectar MetaMask para Apostar'}
            </button>
            
            {account && <Balance account={account} refreshTrigger={balanceRefreshTrigger} />}
          </div>
          
          {account ? (
            <div className="mt-2 text-sm text-gray-300">
              <span className="font-medium text-gray-400">Dirección: </span>
              <span className="font-mono">{account.substring(0, 6)}...{account.substring(account.length - 4)}</span>
            </div>
          ) : (
            <p className="mt-2 text-sm text-yellow-500">
              Debes conectar tu wallet de MetaMask para poder apostar
            </p>
          )}
          
          <div className="bg-blue-900/20 border border-blue-800/30 rounded-lg p-3 mt-4">
            <h3 className="text-sm font-medium text-blue-300 mb-2">Información de blockchain:</h3>
            <p className="text-xs text-gray-300 mb-1">• Todas las apuestas se registran en la blockchain de Ethereum</p>
            <p className="text-xs text-gray-300 mb-1">• Los pagos son automáticos mediante smart contracts</p>
            <p className="text-xs text-gray-300 mb-1">• Apuesta máxima: {maxBetAmount} ETH</p>
            <p className="text-xs text-gray-300">• Los resultados son verificables y transparentes</p>
          </div>
        </div>
        
        <p className="text-center text-xs text-gray-500 mt-6">
          BlackJack Ethereum v1.0 • Desarrollado con tecnología blockchain • {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
};

export default Game;
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { getAuthenticatedUser } from '../utils/sessionUtils';
import { getCertificate } from '../utils/indexedDB';
import { useMetaMask } from '../hooks/useMetaMask';
import Hand from '../components/Hand';

const Inicio = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [setUserName] = useState<string>('');
  const [showTutorial, setShowTutorial] = useState<boolean>(false);
  
  // Cartas para demo simple
  const [dealerCards] = useState<number[]>([1, 11]); // As y Rey (valores para demo)
  const [playerCards] = useState<number[]>([8, 7]); // 8 y 7 (valores para demo)
  
  useEffect(() => {
    // Verificar si el usuario está autenticado
    const checkAuthentication = async () => {
      const userId = getAuthenticatedUser();
      if (userId) {
        setIsAuthenticated(true);
        
        try {
          const certificate = await getCertificate(userId);
          if (certificate) {
            // Aquí podrías hacer algo con el certificado si es necesario
          }
        } catch (error) {
          console.error('Error al obtener el certificado:', error);
        }
      }
    };
    
    checkAuthentication();
  }, []);
  
  // Función simplificada para el tutorial
  const handleDemoAction = () => {
    // En el tutorial solo mostramos los componentes sin funcionalidad real
    alert('¡Esto es solo una demostración! Para jugar ve a la página del juego real.');
  };
  
  // Calcular total de las manos (para la demo)
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
    
    while (total > 21 && aces > 0) {
      total -= 10;
      aces -= 1;
    }
    
    return total;
  };
  
  const playerTotal = calculateHandTotal(playerCards);
  const dealerTotal = calculateHandTotal(dealerCards);

  return (
    <div className="min-h-screen bg-gray-900 py-6 px-4">
      {!isAuthenticated ? (
        // Mostrar la página de bienvenida si no está autenticado
        <div className="max-w-md mx-auto bg-gray-800 rounded-lg shadow-xl p-8 text-center">
          <h1 className="text-4xl font-bold text-white mb-8">Blackjack Ethereum</h1>
          
          <div className="mx-auto mb-8">
            <img 
              src="/src/assets/cards.jpg" 
              alt="Blackjack" 
              className="w-full h-48 object-cover rounded-lg shadow-lg"
            />
          </div>
          
          <p className="text-gray-300 mb-8">
            Bienvenido a la aplicación de Blackjack con tecnología Blockchain y criptografía.
            Para empezar, elige una de las siguientes opciones:
          </p>
          
          <div className="space-y-4">
            <button
              onClick={() => navigate('/register')}
              className="w-full py-3 px-4 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-md transition"
            >
              Registrarse
            </button>
            
            <button
              onClick={() => navigate('/login')}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md transition"
            >
              Iniciar Sesión
            </button>
          </div>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto">
          {/* Modal de Tutorial */}
          {showTutorial && (
            <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
              <div className="bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-white">Tutorial: BlackJack con Ethereum</h2>
                    <button 
                      onClick={() => setShowTutorial(false)}
                      className="text-gray-400 hover:text-white"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  
                  <div className="space-y-4 text-gray-300">
                    <section>
                      <h3 className="text-xl font-semibold text-white mb-2">Reglas del Juego</h3>
                      <p>El objetivo del BlackJack es conseguir una mano con un valor más cercano a 21 que la mano del crupier, sin pasarse.</p>
                      <ul className="list-disc pl-5 mt-2 space-y-1">
                        <li>Las cartas numéricas valen su número</li>
                        <li>Las figuras (J, Q, K) valen 10 puntos</li>
                        <li>Los Ases valen 11 o 1, lo que más te convenga</li>
                      </ul>
                    </section>
                    
                    <section>
                      <h3 className="text-xl font-semibold text-white mb-2">Apuestas con Ethereum</h3>
                      <p>Este juego utiliza la red Ethereum para gestionar todas las apuestas de forma transparente y descentralizada.</p>
                      <div className="bg-blue-900/40 border border-blue-700/50 rounded-lg p-3 my-2">
                        <p className="font-semibold text-blue-300">Apuesta mínima: 0.00001 ETH (aproximadamente $0.05 USD)</p>
                      </div>
                      <p>Todas las apuestas, pagos y resultados quedan registrados en la blockchain, lo que garantiza:</p>
                      <ul className="list-disc pl-5 mt-2 space-y-1">
                        <li>Transparencia total en el juego</li>
                        <li>Pagos automáticos e inmediatos</li>
                        <li>Verificabilidad de todas las operaciones</li>
                        <li>Imposibilidad de manipulación de resultados</li>
                      </ul>
                    </section>
                    
                    <section>
                      <h3 className="text-xl font-semibold text-white mb-2">Cómo Jugar</h3>
                      <ol className="list-decimal pl-5 space-y-2">
                        <li>
                          <span className="font-medium text-white">Conecta tu Wallet</span>
                          <p>Usa el botón "Conectar MetaMask" para enlazar tu billetera Ethereum.</p>
                        </li>
                        <li>
                          <span className="font-medium text-white">Realiza tu Apuesta</span>
                          <p>Ingresa la cantidad de ETH que deseas apostar (mínimo 0.00001 ETH).</p>
                        </li>
                        <li>
                          <span className="font-medium text-white">Confirma la Transacción</span>
                          <p>Aprueba la transacción en MetaMask para que la apuesta quede registrada en la blockchain.</p>
                        </li>
                        <li>
                          <span className="font-medium text-white">Juega tu Mano</span>
                          <p>Usa los botones "Pedir Carta" o "Plantarse" para jugar tu mano.</p>
                        </li>
                        <li>
                          <span className="font-medium text-white">Recibe tus Ganancias</span>
                          <p>Si ganas, recibirás automáticamente tus ganancias en tu wallet de Ethereum.</p>
                        </li>
                      </ol>
                    </section>
                    
                    <section>
                      <h3 className="text-xl font-semibold text-white mb-2">Pagos y Ganancias</h3>
                      <ul className="list-disc pl-5 space-y-1">
                        <li><span className="text-white">BlackJack Natural (21 con 2 cartas)</span>: Paga 3:2</li>
                        <li><span className="text-white">Victoria normal</span>: Paga 1:1</li>
                        <li><span className="text-white">Empate</span>: Se devuelve la apuesta</li>
                      </ul>
                    </section>
                    
                    <section>
                      <h3 className="text-xl font-semibold text-white mb-2">Seguridad Criptográfica</h3>
                      <p>Todas las operaciones están protegidas por:</p>
                      <ul className="list-disc pl-5 mt-2 space-y-1">
                        <li>Certificados digitales para autenticación</li>
                        <li>Encriptación asimétrica RSA para comunicaciones seguras</li>
                        <li>Firma digital de transacciones</li>
                        <li>Smart Contracts auditados en la red Ethereum</li>
                      </ul>
                      <div className="bg-yellow-900/40 border border-yellow-700/50 rounded-lg p-3 mt-3">
                        <p className="text-yellow-200 text-sm">
                          <span className="font-bold">Importante:</span> Guarda tus certificados de forma segura. Son necesarios para verificar tu identidad y acceder a tus fondos.
                        </p>
                      </div>
                    </section>
                  </div>
                  
                  <button
                    onClick={() => setShowTutorial(false)}
                    className="w-full mt-6 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                  >
                    Entendido
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Contenido principal cuando está autenticado */}
          <div className="bg-gray-800 rounded-lg shadow-xl p-6 mb-6">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-3xl font-bold text-white">Tutorial BlackJack</h1>
              <div className="flex items-center">
                <button 
                  onClick={() => setShowTutorial(true)}
                  className="mr-4 text-blue-400 hover:text-blue-300 flex items-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                  </svg>
                  Ver Tutorial
                </button>
              </div>
            </div>
            
            <div className="bg-green-900 rounded-lg p-6 mb-8">
              <div className="mb-6">
                <h2 className="text-white text-lg mb-2">Dealer: {dealerTotal}</h2>
                <div className="flex flex-wrap">
                  <Hand cards={dealerCards} />
                </div>
              </div>
              
              <div>
                <h2 className="text-white text-lg mb-2">Jugador: {playerTotal}</h2>
                <div className="flex flex-wrap">
                  <Hand cards={playerCards} />
                </div>
              </div>
              
              <div className="bg-gray-800/80 text-white text-xl font-bold py-3 px-6 rounded-lg mt-4 text-center">
                Demo de juego - No interactivo
              </div>
            </div>
            
            <div className="flex justify-between space-x-4">
              <button
                onClick={handleDemoAction}
                className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
              >
                Pedir Carta (Demo)
              </button>
              
              <button
                onClick={handleDemoAction}
                className="flex-1 py-2 px-4 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-lg transition-colors"
              >
                Plantarse (Demo)
              </button>
              
              <button
                onClick={handleDemoAction}
                className="flex-1 py-2 px-4 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
              >
                Nueva Partida (Demo)
              </button>
            </div>
          </div>
          
          {/* Call-to-action para ir al juego real */}
          <div className="bg-gray-800 rounded-lg shadow-xl p-6 text-center">
            <h2 className="text-2xl font-bold text-white mb-4">¿Listo para jugar?</h2>
            <p className="text-gray-300 mb-6">
              Has completado el tutorial. Ahora puedes dirigirte al juego real para comenzar a apostar con Ethereum.
            </p>
            
            <button
              onClick={() => navigate('/game')}
              className="py-3 px-8 bg-green-600 hover:bg-green-700 text-white text-lg font-semibold rounded-lg transition-colors inline-flex items-center"
            >
              Ir al Juego Real
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
            
            <div className="mt-4 text-sm text-gray-400">
              Recuerda que necesitarás MetaMask conectado para poder realizar apuestas
            </div>
          </div>
          
          <p className="text-center text-xs text-gray-500 mt-6">
            BlackJack Ethereum v1.0 • Desarrollado con tecnología blockchain • {new Date().getFullYear()}
          </p>
        </div>
      )}
    </div>
  );
};

export default Inicio;
import { useNavigate } from "react-router-dom";
import Lottie from "lottie-react";
// Importa tus archivos JSON de Lottie 
import animationData from "../assets/cards.json"
import ethereumAnimation from "../assets/ehterium.json"

const Inicio = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-casinogreen flex flex-col items-center text-white px-4 py-8">
      {/* Hero Section */}
      <div className="w-full max-w-6xl flex flex-col items-center justify-center pt-8 pb-12">
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-8xl font-bold mb-6 font-title text-center">Blackjack Ethereum</h1>
        
        {/* Animaciones*/}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-12 mb-8">
          <div className="w-40 h-40 sm:w-48 sm:h-48 md:w-56 md:h-56">
            <Lottie animationData={animationData} loop={true} className="w-full h-full" />
          </div>
          <div className="w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48">
            <Lottie animationData={ethereumAnimation} loop={true} className="w-full h-full" />
          </div>
        </div>
        
        <p className="text-lg md:text-xl max-w-2xl text-center mb-8">
          Bienvenido a la experiencia definitiva de Blackjack en la blockchain de Ethereum
        </p>
        
        <div className="flex gap-4">
          <button
            onClick={() => navigate("/game")}
            className="py-2 px-6 md:py-3 md:px-8 bg-red-950 hover:bg-red-900 text-white font-semibold rounded-md transition text-sm md:text-base"
          >
            Jugar
          </button>

        </div>
      </div>

      {/* breve descripcion*/}
      <div className="w-full max-w-6xl py-12 border-t border-white/10">
        <h2 className="text-3xl md:text-4xl font-bold mb-8 text-center font-title">¿Qué es Blackjack Ethereum?</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <div className="bg-secondarygreen p-6 rounded-xl">
            <h3 className="text-xl font-bold mb-4">Juego de Blackjack Descentralizado</h3>
            <p className="text-gray-200">
              Blackjack Ethereum es un juego de blackjack tradicional que opera completamente
              en la blockchain de Ethereum. Cada partida, apuesta y pago se registra de forma
              transparente en la cadena de bloques.
            </p>
          </div>
          
          <div className="bg-secondarygreen p-6 rounded-xl">
            <h3 className="text-xl font-bold mb-4">Tecnología Blockchain</h3>
            <p className="text-gray-200">
              Utilizamos contratos inteligentes de Ethereum para garantizar la transparencia y 
              justicia en el juego. Todas las operaciones se realizan automáticamente, sin 
              intermediarios ni posibilidad de manipulación.
            </p>
          </div>
        </div>
      </div>

      {/* pequeño tutorial */}
      <div className="w-full max-w-6xl py-12 border-t border-white/10">
        <h2 className="text-3xl md:text-4xl font-bold mb-8 text-center font-title">Cómo Jugar</h2>
        
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row items-start gap-4">
            <div className="bg-gray-800 rounded-full w-10 h-10 flex items-center justify-center flex-shrink-0">
              <span className="font-bold">1</span>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-2">Conecta tu Wallet</h3>
              <p className="text-gray-200">
                Conecta tu wallet de MetaMask para acceder a tu cuenta y gestionar tus fondos de Ethereum.
              </p>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row items-start gap-4">
            <div className="bg-gray-800 rounded-full w-10 h-10 flex items-center justify-center flex-shrink-0">
              <span className="font-bold">2</span>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-2">Deposita Fondos</h3>
              <p className="text-gray-200">
                Deposita ETH en el contrato inteligente para comenzar a jugar. Puedes retirar tus fondos en cualquier momento.
              </p>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row items-start gap-4">
            <div className="bg-gray-800 rounded-full w-10 h-10 flex items-center justify-center flex-shrink-0">
              <span className="font-bold">3</span>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-2">Realiza tu Apuesta</h3>
              <p className="text-gray-200">
                Establece la cantidad que deseas apostar y recibe tus cartas iniciales.
              </p>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row items-start gap-4">
            <div className="bg-gray-800 rounded-full w-10 h-10 flex items-center justify-center flex-shrink-0">
              <span className="font-bold">4</span>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-2">¡Juega a Blackjack!</h3>
              <p className="text-gray-200">
                Pide cartas o plántate con el objetivo de acercarte a 21 sin pasarte, y vence al dealer para ganar.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* caracteristricas */}
      <div className="w-full max-w-6xl py-12 border-t border-white/10">
        <h2 className="text-3xl md:text-4xl font-bold mb-8 text-center font-title">Ventajas de Jugar con Nosotros</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-secondarygreen p-5 rounded-xl">
            <h3 className="text-lg font-bold mb-3">100% Transparente</h3>
            <p className="text-sm text-gray-200">
              Todas las operaciones se registran en la blockchain de Ethereum y son verificables por cualquier persona.
            </p>
          </div>
          
          <div className="bg-secondarygreen p-5 rounded-xl">
            <h3 className="text-lg font-bold mb-3">Pagos Instantáneos</h3>
            <p className="text-sm text-gray-200">
              Recibe tus ganancias directamente en tu wallet sin demoras ni procesos de verificación.
            </p>
          </div>
          
          <div className="bg-secondarygreen p-5 rounded-xl">
            <h3 className="text-lg font-bold mb-3">Sin Intermediarios</h3>
            <p className="text-sm text-gray-200">
              Juega directamente contra el contrato inteligente sin casas de apuestas tradicionales.
            </p>
          </div>
          
          <div className="bg-secondarygreen p-5 rounded-xl">
            <h3 className="text-lg font-bold mb-3">Certificados Digitales</h3>
            <p className="text-sm text-gray-200">
              Utilizamos certificados digitales para garantizar la identidad y las operaciones de cada jugador.
            </p>
          </div>
          
          <div className="bg-secondarygreen p-5 rounded-xl">
            <h3 className="text-lg font-bold mb-3">Historial Completo</h3>
            <p className="text-sm text-gray-200">
              Accede al historial completo de tus partidas y estadísticas en todo momento.
            </p>
          </div>
          
          <div className="bg-secondarygreen p-5 rounded-xl">
            <h3 className="text-lg font-bold mb-3">Seguridad Garantizada</h3>
            <p className="text-sm text-gray-200">
              La seguridad de tus fondos está garantizada por la tecnología blockchain de Ethereum.
            </p>
          </div>
        </div>
      </div>

      
      {/* Footer  (hacerlo componente faltaria)*/}
      <div className="w-full max-w-6xl mt-12 border-t border-white/10 pt-8 pb-4 text-center">
        <p className="text-sm text-gray-400">© {new Date().getFullYear()} Blackjack Ethereum. Todos los derechos reservados.</p>
        <p className="text-xs text-gray-500 mt-2">Juega de manera responsable. El juego con criptomonedas involucra riesgos financieros.</p>
      </div>
    </div>


  );
};

export default Inicio;
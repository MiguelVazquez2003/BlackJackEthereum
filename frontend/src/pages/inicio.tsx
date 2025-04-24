import { useNavigate } from "react-router-dom";

const Inicio = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center text-white">
      <h1 className="text-4xl font-bold mb-4">Blackjack Ethereum</h1>
      <p className="text-lg mb-8 text-center max-w-md">
        Juega al Blackjack en la blockchain. ¡Haz clic en el botón para
        comenzar!
      </p>
      <button
        onClick={() => navigate("/game")}
        className="py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md transition"
      >
        Ir al Juego
      </button>
    </div>
  );
};

export default Inicio;

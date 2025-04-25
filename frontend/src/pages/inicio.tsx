import { useNavigate } from "react-router-dom";

const Inicio = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-casinogreen flex flex-col items-center justify-center text-white gap-16">
      <h1 className="text-8xl font-bold mb-4 font-title ">Blackjack Ethereum</h1>
      <p className="text-lg mb-8 text-center max-w-md">
        Juega al Blackjack en la blockchain. ¡Haz clic en el botón para
        comenzar!
      </p>
      <button
        onClick={() => navigate("/game")}
        className="py-3 px-6 bg-red-950 hover:cursor-pointer hover:bg-red-900 text-white font-semibold rounded-md transition "
      >
        Ir al Juego
      </button>
    </div>
  );
};

export default Inicio;

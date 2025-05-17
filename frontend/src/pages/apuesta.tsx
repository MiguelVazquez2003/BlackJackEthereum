import { useState, useEffect } from "react";
import { useMetaMask } from "../hooks/useMetaMask";
import { getMaxBet, checkPlayerDebt } from "../services/blackjackService";
import Balance from "../components/Balance";
import { toast } from "react-toastify";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { ApuestaProps } from "../interfaces/IPlayer";



const Apuesta: React.FC<ApuestaProps> = ({ onApuestaComplete }) => {
  const { account, connect } = useMetaMask();
  const [betAmount, setBetAmount] = useState<string>("0.00001");
  const [maxBet, setMaxBet] = useState<string>("0");
  const [hasDebt, setHasDebt] = useState<boolean>(false);
  const [debtAmount, setDebtAmount] = useState<string>("0");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    const fetchContractData = async () => {
      if (account) {
        try {
          setIsLoading(true);
          // Obtener la apuesta máxima permitida desde el contrato
          const maxBetValue = await getMaxBet();
          setMaxBet(maxBetValue);

          // Verificar si el jugador tiene deudas pendientes
          const { hasDebt, debtAmount } = await checkPlayerDebt(account);
          setHasDebt(hasDebt);
          setDebtAmount(debtAmount);
        } catch (error) {
          console.error("Error al obtener datos del contrato:", error);
          toast.error("Error al obtener datos del contrato.");
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchContractData();
  }, [account]);

  const handleBet = () => {
    if (!account) {
      toast.error("Conecta tu wallet para apostar.");
      return;
    }
    if (hasDebt) {
      toast.error(`Tienes una deuda pendiente de ${debtAmount} ETH. Por favor, salda tu deuda antes de apostar.`);
      return;
    }
    if (parseFloat(betAmount) > parseFloat(maxBet)) {
      toast.error(`La apuesta máxima permitida es ${maxBet} ETH.`);
      return;
    }

    // Llamar a la función callback en lugar de navegar
    if (onApuestaComplete) {
      onApuestaComplete(betAmount);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {!account ? (
        <button
          onClick={connect}
          className="py-3 px-6 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium transition"
        >
          Conectar MetaMask
        </button>
      ) : (
        <div className="w-full">
        <Balance account={account} />
                      
                       <DotLottieReact
            src="https://lottie.host/abad69aa-8548-4da9-bd97-a1c5e4a16a7a/F4wTPOfrhR.lottie"
          loop
          autoplay
          className="w-80 h-80 mx-auto mb-6"
            />
          
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">
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
                disabled={hasDebt || isLoading}
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <span className="text-gray-400">ETH</span>
              </div>
            </div>
            <div className="flex justify-between mt-1 text-xs text-gray-400">
              <span>Mín: 0.00001 ETH</span>
              <span>Máx: {maxBet} ETH</span>
            </div>
          </div>

          <button
            onClick={handleBet}
            className="mt-4 w-full py-2 px-4 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium"
            disabled={hasDebt || isLoading}
          >
            Apostar
          </button>

          {hasDebt && (
            <div className="mt-3 text-red-400 text-sm">
              Tienes una deuda pendiente de {debtAmount} ETH. Por favor, salda tu deuda antes de apostar.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Apuesta;
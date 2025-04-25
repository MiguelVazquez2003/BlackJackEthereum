import { useState, useEffect } from "react";
import { useMetaMask } from "../hooks/useMetaMask";
import { setAuthenticatedUser } from "../utils/sessionUtils";
import { useNavigate } from "react-router-dom";
import { userExists } from "../services/blackjackService";

const Login = () => {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { account, connect } = useMetaMask();
  const navigate = useNavigate();

  useEffect(() => {
    const checkCertificate = async () => {
      setIsLoading(true);
      setError(null);
  
      try {
        const exists = await userExists(account!);
        if (exists) {
          setAuthenticatedUser(account!);
          navigate("/inicio"); // Redirige al inicio si el certificado está registrado
        } else {
          setError(
            `La cuenta de MetaMask "${account}" no tiene un certificado registrado. Por favor, regístrate primero.`
          );
        }
      } catch (err) {
        console.error("Error al verificar el certificado:", err);
        setError("Error al verificar el certificado. Intenta nuevamente.");
      } finally {
        setIsLoading(false);
      }
    };

    
    if (account) {
      checkCertificate();
    }
  }, [account, navigate]);

  

  return (
    <div className="min-h-screen bg-casinogreen py-12 px-4 sm:px-6 lg:px-8 flex flex-col items-center gap-16">
      <h1 className="font-title font-bold text-8xl text-white">Blackjack</h1>
      <div className="max-w-md mx-auto bg-secondarygreen rounded-xl shadow-md overflow-hidden p-6 space-y-6">
        <h1 className="text-xl font-bold text-center text-white">
          Iniciar Sesión
        </h1>

        {error && (
          <div className="bg-red-900/40 border border-red-700/50 text-red-200 px-4 py-3 rounded-lg">
            <p>{error}</p>
          </div>
        )}

        <button
          onClick={connect}
          disabled={isLoading}
          className={`w-full hover:cursor-pointer px-4 py-2 rounded-lg font-medium transition-colors ${
            account
              ? "bg-green-600 hover:bg-green-700"
              : "bg-blue-600 hover:bg-blue-700"
          } text-white ${isLoading ? "opacity-70 cursor-not-allowed" : ""}`}
        >
          {isLoading
            ? "Verificando..."
            : account
            ? "Conectado a MetaMask"
            : "Conectar con MetaMask"}
        </button>

        <div className="text-center pt-2">
          <button
            onClick={() => navigate("/register")}
            className="text-sm text-blue-400 hover:text-blue-300 hover:cursor-pointer"
          >
            ¿No tienes cuenta? Regístrate
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;

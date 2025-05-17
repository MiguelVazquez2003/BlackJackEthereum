import { useState, useEffect } from "react";
import { useMetaMask } from "../hooks/useMetaMask";
import { setAuthenticatedUser } from "../utils/sessionUtils";
import { useNavigate } from "react-router-dom";
import { userExists } from "../services/blackjackService";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Login = ({setAuth}:{setAuth:(auth:boolean) => void}) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showWalletSelector, setShowWalletSelector] = useState(false);
  const { account, connect, availableProviders } = useMetaMask();
  const navigate = useNavigate();

  useEffect(() => {
    const checkCertificate = async () => {
      setIsLoading(true);
      
      try {
        const exists = await userExists(account!);
        if (exists) {
          setAuthenticatedUser(account!);
          setAuth(true);
          navigate("/inicio"); // Redirige al inicio si el certificado está registrado
        } else {
          toast.error(
            `La cuenta de MetaMask "${account}" no tiene un certificado registrado. Por favor, regístrate primero.`
          );
        }
      } catch (err) {
        console.error("Error al verificar el certificado:", err);
        toast.error("Error al verificar el certificado. Intenta nuevamente.");
      } finally {
        setIsLoading(false);
      }
    };
    
    if (account) {
      checkCertificate();
    }
  }, [account, navigate, setAuth]);

  return (
    <div className="min-h-screen bg-casinogreen py-12 px-4 sm:px-6 lg:px-8 flex flex-col items-center gap-16">
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
      <h1 className="font-title font-bold text-8xl text-white">Blackjack</h1>
      <div className="max-w-md mx-auto bg-secondarygreen rounded-xl shadow-md overflow-hidden p-6 space-y-6">
        <h1 className="text-xl font-bold text-center text-white">
          Iniciar Sesión
        </h1>

        {account ? (
          // Si ya hay cuenta conectada
          <div className="w-full px-4 py-2 rounded-lg font-medium bg-green-600 text-white flex items-center justify-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z"/>
            </svg>
            Wallet conectada
          </div>
        ) : (
          // Si no hay cuenta, mostrar botón para conectar
          <>
            <button
              type="button"
              onClick={() => setShowWalletSelector(true)}
              disabled={isLoading}
              className="w-full px-4 py-2 rounded-lg font-medium transition-colors bg-blue-600 hover:bg-blue-700 hover:cursor-pointer text-white"
            >
              Conectar Wallet
            </button>
            
            {/* Selector de wallets */}
            {showWalletSelector && (
              <div className="p-3 bg-gray-800 rounded-lg border border-gray-700">
                <h4 className="text-sm font-medium mb-2 text-gray-300">Selecciona tu wallet:</h4>
                
                <div className="space-y-2">
                  {availableProviders.length > 0 ? (
                    availableProviders.map(provider => (
                      <button
                        key={provider.info.uuid}
                        type="button"
                        onClick={() => {
                          connect(provider);
                          setShowWalletSelector(false);
                        }}
                        className="flex items-center gap-2 w-full p-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white text-sm"
                      >
                        <img 
                          src={provider.info.icon} 
                          alt={provider.info.name} 
                          className="w-5 h-5"
                        />
                        <span>{provider.info.name}</span>
                      </button>
                    ))
                  ) : (
                    <p className="text-amber-400 text-sm">No se detectaron wallets. Por favor, instala MetaMask u otra wallet compatible.</p>
                  )}
                </div>
                
                <button 
                  type="button"
                  onClick={() => setShowWalletSelector(false)}
                  className="mt-3 w-full text-xs text-gray-400 hover:text-gray-300"
                >
                  Cancelar
                </button>
              </div>
            )}
          </>
        )}

        {account && (
          <div className="p-3 bg-black/60 rounded-lg break-all text-sm text-gray-300">
            <span className="font-semibold block mb-1">Dirección:</span>{" "}
            {account}
          </div>
        )}

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
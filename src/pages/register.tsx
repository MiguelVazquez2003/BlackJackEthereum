import { useState } from "react";
import { useMetaMask } from "../hooks/useMetaMask";
import { setAuthenticatedUser } from "../utils/sessionUtils";
import { useNavigate } from "react-router-dom";
import {
  generateKeyPair,
  encryptWithPassword,
  exportPublicKeyAsPEM,
  exportPrivateKeyAsJSON,
} from "../utils/cryptoUtils";
import {
  userExists,
  registerPlayerCertificate,
} from "../services/blackjackService";
import { DiscoverWalletProviders } from "../components/WalletProviders";

const Register = ({setAuth}:{setAuth:(auth:boolean) => void}) => {
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showWalletSelector, setShowWalletSelector] = useState(false);
  const { account, connect, availableProviders } = useMetaMask();
  const navigate = useNavigate();

  const handleRegister = async () => {
    if (!account) {
      setError("Por favor, conecta tu cuenta de MetaMask.");
      return;
    }

    if (!password) {
      setError("Por favor, ingresa una contraseña segura.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const exists = await userExists(account);
      if (exists) {
        setError(`La cuenta de MetaMask "${account}" ya está registrada.`);
        return;
      }

      const { publicKey, privateKey } = await generateKeyPair();
      const encryptedPrivateKey = await encryptWithPassword(
        password,
        privateKey
      );

      const certificate = {
        userID: account,
        publicKey,
        privateKey: encryptedPrivateKey.encryptedData,
        iv: encryptedPrivateKey.iv,
        salt: encryptedPrivateKey.salt,
        date: new Date().toISOString(),
      };

      await registerPlayerCertificate(certificate);
      setAuthenticatedUser(account);
      setAuth(true);

      const publicKeyPEM = await exportPublicKeyAsPEM(publicKey);
      const privateKeyJSON = await exportPrivateKeyAsJSON(
        encryptedPrivateKey.encryptedData,
        encryptedPrivateKey.iv,
        encryptedPrivateKey.salt
      );

      downloadAsFile(
        publicKeyPEM,
        "clave_publica.pem",
        "application/x-pem-file"
      );
      downloadAsFile(
        privateKeyJSON,
        "clave_privada.enc.json",
        "application/json"
      );

      navigate("/login");
    } catch (err) {
      console.error("Error al registrar:", err);
      setError("Error al registrar. Intenta nuevamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const downloadAsFile = (
    content: string,
    fileName: string,
    contentType: string
  ) => {
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    
    <div className="min-h-screen bg-casinogreen py-12 px-4 sm:px-6 lg:px-8 flex flex-col items-center gap-16">
        <h1 className="font-title font-bold text-8xl text-white">Blackjack</h1>
      <form className="max-w-md mx-auto bg-secondarygreen rounded-xl shadow-md overflow-hidden p-6 space-y-6">
        <h2 className="text-xl font-bold text-center text-white">Registro</h2>

        {error && (
          <div className="bg-red-900/40 border border-red-700/50 text-red-200 px-4 py-3 rounded-lg">
            <p>{error}</p>
          </div>
        )}

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


        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-300">
            Contraseña (para cifrar la llave privada):
          </label>
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 bg-black/60 border border-gray-600 rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <button
          onClick={handleRegister}
          disabled={isLoading}
          className={`w-full px-4 py-2 font-medium rounded-lg transition-colors ${
            isLoading
              ? "bg-gray-500 cursor-not-allowed"
              : "bg-green-600 hover:bg-green-700 text-white hover:cursor-pointer"
          }`}
        >
          {isLoading ? "Registrando..." : "Registrar"}
        </button>

        <div className="text-center pt-2">
          <button
            onClick={() => navigate("/login")}
            className="text-sm text-blue-400 hover:text-blue-300 hover:cursor-pointer"
          >
            ¿Ya tienes cuenta? Inicia sesión
          </button>
        </div>
      </form>
    </div>
  );
};

export default Register;

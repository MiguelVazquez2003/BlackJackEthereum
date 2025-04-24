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

const Register = () => {
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { account, connect } = useMetaMask();
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
    <div className="min-h-screen bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-gray-800 rounded-xl shadow-md overflow-hidden p-6 space-y-6">
        <h1 className="text-xl font-bold text-center text-white">Registro</h1>

        {error && (
          <div className="bg-red-900/40 border border-red-700/50 text-red-200 px-4 py-3 rounded-lg">
            <p>{error}</p>
          </div>
        )}

        <button
          onClick={connect}
          disabled={isLoading}
          className={`w-full px-4 py-2 rounded-lg font-medium transition-colors ${
            account
              ? "bg-green-600 hover:bg-green-700"
              : "bg-blue-600 hover:bg-blue-700"
          } text-white ${isLoading ? "opacity-70 cursor-not-allowed" : ""}`}
        >
          {account ? "Conectado a MetaMask" : "Conectar con MetaMask"}
        </button>

        {account && (
          <div className="p-3 bg-gray-700 rounded-lg break-all text-sm text-gray-300">
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
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <button
          onClick={handleRegister}
          disabled={isLoading}
          className={`w-full px-4 py-2 font-medium rounded-lg transition-colors ${
            isLoading
              ? "bg-gray-500 cursor-not-allowed"
              : "bg-green-600 hover:bg-green-700 text-white"
          }`}
        >
          {isLoading ? "Registrando..." : "Registrar"}
        </button>

        <div className="text-center pt-2">
          <button
            onClick={() => navigate("/login")}
            className="text-sm text-blue-400 hover:text-blue-300"
          >
            ¿Ya tienes cuenta? Inicia sesión
          </button>
        </div>
      </div>
    </div>
  );
};

export default Register;

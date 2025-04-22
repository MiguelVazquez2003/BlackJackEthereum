// src/pages/register.tsx

import React, { useState, useEffect } from 'react';
import { 
  generateKeyPair, 
  encryptWithPassword, 
  exportPublicKeyAsPEM, 
  exportPrivateKeyAsJSON 
} from '../utils/cryptoUtils';
import { saveCertificate, userExists } from '../utils/indexedDB';
import { useMetaMask } from '../hooks/useMetaMask';
import { setAuthenticatedUser } from '../utils/sessionUtils';
import { useNavigate } from 'react-router-dom';

const Register = () => {
  const [password, setPassword] = useState<string>('');
  const [userID, setUserID] = useState<string>('');
  const [registrationComplete, setRegistrationComplete] = useState<boolean>(false);
  const [publicKeyPEM, setPublicKeyPEM] = useState<string | null>(null);
  const [privateKeyJSON, setPrivateKeyJSON] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCheckingUser, setIsCheckingUser] = useState<boolean>(false);
  const { account, connect } = useMetaMask();
  const navigate = useNavigate();

  // Use MetaMask account as userID when connected
  useEffect(() => {
    if (account) {
      setUserID(account);
      // Verificar si la cuenta de MetaMask ya está registrada
      checkUserExists(account);
    }
  }, [account]);

  // Verificar si el usuario ya existe cuando cambia el ID
  useEffect(() => {
    if (userID && !account) {
      const timer = setTimeout(() => {
        checkUserExists(userID);
      }, 500); // Retraso para evitar muchas verificaciones
      
      return () => clearTimeout(timer);
    }
  }, [userID]);

  const checkUserExists = async (id: string) => {
    if (!id) return;
    
    setIsCheckingUser(true);
    setError(null);
    
    try {
      const exists = await userExists(id);
      if (exists) {
        setError(`El usuario con ID "${id}" ya está registrado.`);
      }
    } catch (err) {
      console.error('Error al verificar el usuario:', err);
    } finally {
      setIsCheckingUser(false);
    }
  };

  const handleRegister = async () => {
    try {
      setError(null);
      
      // Validación básica
      if (!password) {
        setError('Por favor, ingresa una contraseña segura');
        return;
      }
      
      if (!userID && !account) {
        setError('Por favor, conéctate con MetaMask o ingresa un ID de usuario');
        return;
      }

      // Verificar nuevamente si el usuario ya existe
      const userIdentifier = account || userID;
      const exists = await userExists(userIdentifier);
      if (exists) {
        setError(`El usuario con ID "${userIdentifier}" ya está registrado.`);
        return;
      }
      
      // Generate keys
      const { publicKey, privateKey } = await generateKeyPair();
      
      // Encrypt private key with password
      const encryptedPrivateKey = await encryptWithPassword(password, privateKey);
      
      // Create certificate object
      const certificate = {
        userID: userIdentifier,
        publicKey,
        privateKey: encryptedPrivateKey.encryptedData,
        iv: encryptedPrivateKey.iv,
        salt: encryptedPrivateKey.salt,
        date: new Date().toISOString()
      };
      
      // Save to IndexedDB
      await saveCertificate(certificate);
      
      // Almacenar solo el ID del usuario en sessionStorage (más seguro)
      setAuthenticatedUser(userIdentifier);
      
      // Create downloadable files
      const publicKeyPEM = await exportPublicKeyAsPEM(publicKey);
      const privateKeyJSON = await exportPrivateKeyAsJSON(
        encryptedPrivateKey.encryptedData,
        encryptedPrivateKey.iv,
        encryptedPrivateKey.salt
      );
      
      setPublicKeyPEM(publicKeyPEM);
      setPrivateKeyJSON(privateKeyJSON);
      setRegistrationComplete(true);
      
      // Eliminar cualquier error previo
      setError(null);
      
      // Redireccionar a la página de inicio después de completar el registro y la descarga
      setTimeout(() => {
        navigate('/');
      }, 5000); // Retraso de 5 segundos para permitir la descarga de los certificados
    } catch (error) {
      console.error(error);
      setError('Error al registrar: ' + (error instanceof Error ? error.message : 'Error desconocido'));
    }
  };

  const downloadAsFile = (content: string, fileName: string, contentType: string) => {
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadPublicKey = () => {
    if (publicKeyPEM) {
      downloadAsFile(publicKeyPEM, 'clave_publica.pem', 'application/x-pem-file');
    }
  };

  const downloadPrivateKey = () => {
    if (privateKeyJSON) {
      downloadAsFile(privateKeyJSON, 'clave_privada.enc.json', 'application/json');
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-gray-800 rounded-xl shadow-md overflow-hidden p-6 space-y-6">
        <h1 className="text-xl font-bold text-center text-white">Registro de Usuario</h1>
        
        {/* Mostrar errores */}
        {error && (
          <div className="bg-red-900/40 border border-red-700/50 text-red-200 px-4 py-3 rounded-lg">
            <p>{error}</p>
          </div>
        )}
        
        <div className="space-y-4">
          <h3 className="text-md font-semibold text-gray-300">Autenticación con Blockchain</h3>
          <button 
            onClick={connect}
            className={`w-full px-4 py-2 rounded-lg font-medium transition-colors ${
              account 
                ? 'bg-green-600 hover:bg-green-700' 
                : 'bg-blue-600 hover:bg-blue-700'
            } text-white`}
          >
            {account ? 'Conectado a MetaMask' : 'Conectar con MetaMask'}
          </button>
          
          {account && (
            <div className="p-3 bg-gray-700 rounded-lg break-all text-sm text-gray-300">
              <span className="font-semibold block mb-1">Dirección:</span> {account}
            </div>
          )}
        </div>
        
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-300">
            ID de Usuario:
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="ID de Usuario (o usa MetaMask)"
              value={userID}
              onChange={(e) => setUserID(e.target.value)}
              disabled={!!account}
              className={`w-full px-3 py-2 bg-gray-700 border rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                error && error.includes(userID || account || '') 
                  ? 'border-red-500' 
                  : 'border-gray-600'
              }`}
            />
            {isCheckingUser && (
              <span className="absolute right-3 top-2.5 text-gray-400 text-sm">
                Verificando...
              </span>
            )}
          </div>
          {account && <p className="text-xs text-gray-400 mt-1">Usando dirección de MetaMask como ID</p>}
        </div>
        
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
          disabled={!!error || isCheckingUser}
          className={`w-full px-4 py-2 font-medium rounded-lg transition-colors ${
            !!error || isCheckingUser
              ? 'bg-gray-500 cursor-not-allowed' 
              : 'bg-green-600 hover:bg-green-700 text-white'
          }`}
        >
          {isCheckingUser ? 'Verificando...' : 'Registrar'}
        </button>

        <div className="text-center pt-2">
          <button 
            onClick={() => navigate('/login')}
            className="text-sm text-blue-400 hover:text-blue-300"
          >
            ¿Ya tienes cuenta? Inicia sesión
          </button>
        </div>
        
        {registrationComplete && (
          <div className="mt-4 space-y-4 animate-fade-in">
            <h3 className="text-lg font-medium text-green-400">Registro Completo - Descarga tus certificados</h3>
            <p className="text-sm text-gray-300">Para futura autenticación, descarga estos archivos y guárdalos de forma segura:</p>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <button 
                onClick={downloadPublicKey}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex-1"
              >
                Descargar Llave Pública
              </button>
              
              <button 
                onClick={downloadPrivateKey}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-lg transition-colors flex-1"
              >
                Descargar Llave Privada
              </button>
            </div>
            
            <div className="p-3 bg-yellow-900/50 border border-yellow-700/50 rounded-lg text-sm text-yellow-200">
              <strong className="block mb-1">Importante:</strong> 
              La llave privada está cifrada con tu contraseña. Necesitarás ambos archivos y tu contraseña para autenticarte en el futuro.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Register;

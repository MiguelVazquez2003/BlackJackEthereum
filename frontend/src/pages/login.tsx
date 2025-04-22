// src/pages/login.tsx

import React, { useState, useRef, useEffect } from 'react';
import { decryptWithPassword, importCertificateFromFiles } from '../utils/cryptoUtils';
import { getCertificate, saveCertificate, userExists } from '../utils/indexedDB';
import { useMetaMask } from '../hooks/useMetaMask';
import { setAuthenticatedUser } from '../utils/sessionUtils';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [userID] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loginMethod, setLoginMethod] = useState<'indexeddb' | 'file' | 'metamask'>('indexeddb');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const publicKeyRef = useRef<HTMLInputElement>(null);
  const privateKeyRef = useRef<HTMLInputElement>(null);
  const { account, connect } = useMetaMask();
  const navigate = useNavigate();
  
  // References to hold file contents
  const [publicKeyContent, setPublicKeyContent] = useState<string | null>(null);
  const [privateKeyContent, setPrivateKeyContent] = useState<string | null>(null);

  // Verificar si la cuenta de MetaMask está registrada
  useEffect(() => {
    if (account && loginMethod === 'metamask') {
      checkMetaMaskAccount();
    }
  }, [account, loginMethod]);

  const checkMetaMaskAccount = async () => {
    if (!account) return;

    setIsLoading(true);
    setError(null);
    
    try {
      const exists = await userExists(account);
      if (!exists) {
        setError(`La cuenta de MetaMask "${account}" no está registrada. Por favor, regístrate primero.`);
      }
    } catch (err) {
      console.error('Error al verificar la cuenta:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'public' | 'private') => {
    setError(null); // Limpiar errores al cambiar archivos
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (type === 'public') {
        setPublicKeyContent(event.target?.result as string);
      } else {
        setPrivateKeyContent(event.target?.result as string);
      }
    };
    
    reader.onerror = () => {
      setError(`Error al leer el archivo ${type === 'public' ? 'de clave pública' : 'de clave privada'}`);
    };
    
    if (type === 'public') {
      reader.readAsText(file);
    } else {
      reader.readAsText(file);
    }
  };

  const handleDBLogin = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Validación básica
      if (!userID) {
        setError('Por favor, ingresa tu ID de usuario');
        return;
      }
      
      if (!password) {
        setError('Por favor, ingresa tu contraseña');
        return;
      }
      
      // Verificar si el usuario existe
      const exists = await userExists(userID);
      if (!exists) {
        setError(`El usuario con ID "${userID}" no está registrado`);
        return;
      }
      
      const certificate = await getCertificate(userID);

      try {
        // Try to decrypt the private key as a validation step
        await decryptWithPassword(
          password,
          certificate.privateKey,
          certificate.iv,
          certificate.salt
        );
        
        // Si la desencriptación fue exitosa, el usuario está autenticado
        setAuthenticatedUser(certificate.userID);
        setIsAuthenticated(true);
        setError(null);
        
        // Redireccionar a la página de inicio después de autenticación exitosa
        setTimeout(() => {
          navigate('/');
        }, 1500); // Pequeño retraso para mostrar el mensaje de éxito
      } catch (error) {
        setError('Contraseña incorrecta. Por favor, verifica tus credenciales.');
      }
    } catch (error) {
      console.error(error);
      setError('Error en el inicio de sesión: ' + (error instanceof Error ? error.message : 'Error desconocido'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileLogin = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      if (!publicKeyContent) {
        setError('Por favor, sube el archivo de llave pública');
        return;
      }
      
      if (!privateKeyContent) {
        setError('Por favor, sube el archivo de llave privada');
        return;
      }
      
      if (!password) {
        setError('Por favor, ingresa la contraseña para descifrar la llave privada');
        return;
      }

      const result = await importCertificateFromFiles(
        publicKeyContent,
        privateKeyContent,
        password
      );

      if (!result.success) {
        setError(result.error || 'Error al importar el certificado. Verifica los archivos y la contraseña.');
        return;
      }

      // Create an ID for the certificate based on the public key or MetaMask address
      const certificateID = account || `imported-${new Date().getTime()}`;
      
      // Create and save the certificate to IndexedDB for future use
      const certificate = {
        userID: certificateID,
        publicKey: result.publicKey,
        privateKey: result.privateKey.encryptedData,
        iv: result.privateKey.iv,
        salt: result.privateKey.salt,
        date: new Date().toISOString()
      };

      await saveCertificate(certificate);
      
      // Solo almacenamos el ID del usuario
      setAuthenticatedUser(certificateID);
      setIsAuthenticated(true);
      setError(null);
      
      // Redireccionar a la página de inicio después de autenticación exitosa
      setTimeout(() => {
        navigate('/');
      }, 1500); // Pequeño retraso para mostrar el mensaje de éxito
    } catch (error) {
      console.error(error);
      setError('Error al procesar los certificados: ' + (error instanceof Error ? error.message : 'Error desconocido'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleMetaMaskLogin = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      if (!account) {
        await connect();
        setIsLoading(false);
        return;
      }

      // Verificar si la cuenta existe
      const exists = await userExists(account);
      if (!exists) {
        setError(`La cuenta de MetaMask "${account}" no está registrada. Por favor, regístrate primero.`);
        return;
      }

      // Verificar la contraseña
      if (!password) {
        setError('Por favor, ingresa la contraseña para descifrar la llave privada');
        return;
      }

      const certificate = await getCertificate(account);
      
      try {
        await decryptWithPassword(
          password,
          certificate.privateKey,
          certificate.iv,
          certificate.salt
        );
        
        // Solo almacenamos el ID del usuario
        setAuthenticatedUser(certificate.userID);
        setIsAuthenticated(true);
        setError(null);
        
        // Redireccionar a la página de inicio después de autenticación exitosa
        setTimeout(() => {
          navigate('/');
        }, 1500); // Pequeño retraso para mostrar el mensaje de éxito
      } catch (error) {
        setError('Contraseña incorrecta para esta cuenta de MetaMask');
      }
    } catch (error) {
      console.error(error);
      setError('Error al iniciar sesión con MetaMask: ' + (error instanceof Error ? error.message : 'Error desconocido'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async () => {
    if (loginMethod === 'indexeddb') {
      await handleDBLogin();
    } else if (loginMethod === 'file') {
      await handleFileLogin();
    } else if (loginMethod === 'metamask') {
      await handleMetaMaskLogin();
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-gray-800 rounded-xl shadow-md overflow-hidden p-6 space-y-6">
        <h1 className="text-xl font-bold text-center text-white">Iniciar Sesión</h1>
        
        {/* Mostrar errores */}
        {error && (
          <div className="bg-red-900/40 border border-red-700/50 text-red-200 px-4 py-3 rounded-lg">
            <p>{error}</p>
          </div>
        )}
        
        <div className="space-y-3">
          <h3 className="text-md font-semibold text-gray-300">Método de autenticación</h3>
          <div className="grid grid-cols-3 gap-2">
            <button 
              onClick={() => {
                setLoginMethod('indexeddb');
                setError(null);
              }}
              className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                loginMethod === 'indexeddb' 
                  ? 'bg-green-600 text-white' 
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              Base de datos
            </button>
            
            <button 
              onClick={() => {
                setLoginMethod('file');
                setError(null);
              }}
              className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                loginMethod === 'file' 
                  ? 'bg-green-600 text-white' 
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              Certificados
            </button>
            
            <button 
              onClick={() => {
                setLoginMethod('metamask');
                setError(null);
                if (account) checkMetaMaskAccount();
              }}
              className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                loginMethod === 'metamask' 
                  ? 'bg-green-600 text-white' 
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              MetaMask
            </button>
          </div>
        </div>
        
        
        {loginMethod === 'file' && (
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-300">
                Archivo de Llave Pública:
              </label>
              <input
                type="file"
                ref={publicKeyRef}
                accept=".pem"
                onChange={(e) => handleFileChange(e, 'public')}
                className={`w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-gray-700 file:text-gray-300 hover:file:bg-gray-600 ${
                  error && error.includes('clave pública') ? 'border border-red-500 rounded-lg' : ''
                }`}
              />
              {publicKeyContent && (
                <p className="text-xs text-green-400 mt-1">Archivo de llave pública cargado</p>
              )}
            </div>
            
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-300">
                Archivo de Llave Privada:
              </label>
              <input
                type="file"
                ref={privateKeyRef}
                accept=".json"
                onChange={(e) => handleFileChange(e, 'private')}
                className={`w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-gray-700 file:text-gray-300 hover:file:bg-gray-600 ${
                  error && error.includes('clave privada') ? 'border border-red-500 rounded-lg' : ''
                }`}
              />
              {privateKeyContent && (
                <p className="text-xs text-green-400 mt-1">Archivo de llave privada cargado</p>
              )}
            </div>
            
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-300">
                Contraseña:
              </label>
              <input
                type="password"
                placeholder="Contraseña para descifrar la llave"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(null);
                }}
                className={`w-full px-3 py-2 bg-gray-700 border rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  error && error.includes('contraseña') ? 'border-red-500' : 'border-gray-600'
                }`}
              />
            </div>
          </div>
        )}
        
        {loginMethod === 'metamask' && (
          <div className="space-y-4">
            <button 
              onClick={connect}
              disabled={isLoading}
              className={`w-full px-4 py-2 rounded-lg font-medium transition-colors ${
                account 
                  ? 'bg-green-600 hover:bg-green-700' 
                  : 'bg-blue-600 hover:bg-blue-700'
              } text-white ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {isLoading ? 'Conectando...' : account ? 'Conectado a MetaMask' : 'Conectar con MetaMask'}
            </button>
            
            {account && (
              <>
                <div className="p-3 bg-gray-700 rounded-lg break-all text-sm text-gray-300">
                  <span className="font-semibold block mb-1">Dirección:</span> {account}
                </div>
                
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-300">
                    Contraseña:
                  </label>
                  <input
                    type="password"
                    placeholder="Contraseña para descifrar la llave"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError(null);
                    }}
                    className={`w-full px-3 py-2 bg-gray-700 border rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      error && error.includes('contraseña') ? 'border-red-500' : 'border-gray-600'
                    }`}
                  />
                </div>
              </>
            )}
          </div>
        )}
        
        <button 
          onClick={handleLogin}
          disabled={isLoading}
          className={`w-full px-4 py-2 font-medium rounded-lg transition-colors ${
            isLoading
              ? 'bg-gray-500 cursor-not-allowed' 
              : 'bg-green-600 hover:bg-green-700 text-white'
          }`}
        >
          {isLoading ? 'Procesando...' : 'Iniciar Sesión'}
        </button>
        
        <div className="text-center pt-2">
          <button 
            onClick={() => navigate('/register')}
            className="text-sm text-blue-400 hover:text-blue-300"
          >
            ¿No tienes cuenta? Regístrate
          </button>
        </div>
        
        {isAuthenticated && (
          <div className="mt-4 p-4 bg-green-900/30 border border-green-700/50 rounded-lg text-center animate-fade-in">
            <h3 className="text-lg font-medium text-green-400 mb-1">¡Autenticación Exitosa!</h3>
            <p className="text-sm text-gray-300">Has iniciado sesión correctamente.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;

import { useState } from "react"
import { useSyncProviders } from "../hooks/useSyncProviders"
import { formatAddress } from "../utils"

export const DiscoverWalletProviders = () => {
  const [selectedWallet, setSelectedWallet] = useState<EIP6963ProviderDetail>()
  const [userAccount, setUserAccount] = useState<string>("")
  const providers = useSyncProviders()

  // Connect to the selected provider using eth_requestAccounts.
  const handleConnect = async (providerWithInfo: EIP6963ProviderDetail) => {
    const accounts: string[] | undefined =
      await (
        providerWithInfo.provider
          .request({ method: "eth_requestAccounts" })
          .catch(console.error)
      ) as string[] | undefined;

    if (accounts?.[0]) {
      setSelectedWallet(providerWithInfo)
      setUserAccount(accounts?.[0])
    }
  }

  // Display detected providers as connect buttons.
  return (
    <div className="bg-gray-900 rounded-lg p-6 max-w-md mx-auto shadow-xl border border-gray-800">
      <h2 className="text-2xl font-bold mb-6 text-white border-b border-gray-700 pb-3">Wallets Detectadas</h2>
      
      <div className="grid grid-cols-2 gap-4 mb-8">
        {providers.length > 0 ? providers?.map((provider: EIP6963ProviderDetail) => (
          <button 
            key={provider.info.uuid} 
            onClick={() => handleConnect(provider)}
            className={`flex flex-col items-center justify-center bg-gray-800 hover:bg-gray-700 transition-all p-4 rounded-lg border ${
              selectedWallet?.info.uuid === provider.info.uuid ? 'border-blue-500 ring-2 ring-blue-500/50' : 'border-gray-700'
            }`}
          >
            <img 
              src={provider.info.icon} 
              alt={provider.info.name} 
              className="w-12 h-12 mb-2 rounded-md" 
            />
            <div className="text-sm font-medium text-white">{provider.info.name}</div>
          </button>
        )) : (
          <div className="col-span-2 bg-yellow-900/30 text-yellow-500 p-4 rounded-lg border border-yellow-900 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>No se detectaron wallets</span>
          </div>
        )}
      </div>
      
      <div className="border-t border-gray-800 pt-4">
        <h2 className="text-xl font-medium mb-4 text-white">
          {userAccount ? "Wallet Conectada" : "No hay wallet seleccionada"}
        </h2>
        
        {userAccount && selectedWallet && (
          <div className="bg-blue-900/20 rounded-lg p-4 border border-blue-800">
            <div className="flex items-center">
              <img 
                src={selectedWallet.info.icon} 
                alt={selectedWallet.info.name} 
                className="w-8 h-8 rounded-md mr-3" 
              />
              <div className="flex-1">
                <div className="font-medium text-white">{selectedWallet.info.name}</div>
                <div className="text-blue-300 text-sm mt-1 font-mono">
                  {formatAddress(userAccount)}
                </div>
              </div>
              <div className="bg-green-900/50 rounded-full px-2 py-1 text-xs text-green-400 border border-green-700">
                Conectado
              </div>
            </div>
          </div>
        )}
        
        {!userAccount && (
          <div className="text-gray-400 text-center p-3 bg-gray-800/50 rounded-lg">
            Selecciona una wallet para conectarte
          </div>
        )}
      </div>
    </div>
  )
}
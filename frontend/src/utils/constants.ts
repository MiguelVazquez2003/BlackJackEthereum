// Constantes globales del juego
export const BLACKJACK = 21;
export const DEALER_MIN = 17;


declare global {
  interface Window {
    ethereum: any;
  }
}

// Dirección del contrato en la red de prueba Sepolia
export const BLACKJACK_CONTRACT_ADDRESS = import.meta.env.VITE_BLACKJACK_CONTRACT_ADDRESS;

// ABI del contrato Blackjack
export const BLACKJACK_ABI =
    [
        {
            "inputs": [],
            "name": "ECDSAInvalidSignature",
            "type": "error"
        },
        {
            "inputs": [
                {
                    "internalType": "uint256",
                    "name": "length",
                    "type": "uint256"
                }
            ],
            "name": "ECDSAInvalidSignatureLength",
            "type": "error"
        },
        {
            "inputs": [
                {
                    "internalType": "bytes32",
                    "name": "s",
                    "type": "bytes32"
                }
            ],
            "name": "ECDSAInvalidSignatureS",
            "type": "error"
        },
        {
            "anonymous": false,
            "inputs": [
                {
                    "indexed": true,
                    "internalType": "address",
                    "name": "player",
                    "type": "address"
                }
            ],
            "name": "CertificateRegistered",
            "type": "event"
        },
        {
            "anonymous": false,
            "inputs": [
                {
                    "indexed": true,
                    "internalType": "address",
                    "name": "player",
                    "type": "address"
                },
                {
                    "indexed": false,
                    "internalType": "int256",
                    "name": "result",
                    "type": "int256"
                }
            ],
            "name": "GameEnded",
            "type": "event"
        },
        {
            "anonymous": false,
            "inputs": [
                {
                    "indexed": true,
                    "internalType": "address",
                    "name": "player",
                    "type": "address"
                },
                {
                    "indexed": false,
                    "internalType": "uint256",
                    "name": "bet",
                    "type": "uint256"
                }
            ],
            "name": "GameStarted",
            "type": "event"
        },
        {
            "inputs": [
                {
                    "internalType": "bytes",
                    "name": "signature",
                    "type": "bytes"
                },
                {
                    "internalType": "int256",
                    "name": "result",
                    "type": "int256"
                },
                {
                    "internalType": "uint256",
                    "name": "bet",
                    "type": "uint256"
                }
            ],
            "name": "recordGameResult",
            "outputs": [],
            "stateMutability": "payable",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "bytes",
                    "name": "certificate",
                    "type": "bytes"
                }
            ],
            "name": "registerCertificate",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "stateMutability": "payable",
            "type": "receive"
        },
        {
            "inputs": [],
            "name": "withdrawFunds",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [],
            "stateMutability": "nonpayable",
            "type": "constructor"
        },
        {
            "inputs": [
                {
                    "internalType": "address",
                    "name": "player",
                    "type": "address"
                }
            ],
            "name": "getPlayerStats",
            "outputs": [
                {
                    "internalType": "uint256",
                    "name": "gamesPlayed",
                    "type": "uint256"
                },
                {
                    "internalType": "uint256",
                    "name": "gamesWon",
                    "type": "uint256"
                },
                {
                    "internalType": "uint256",
                    "name": "totalWinnings",
                    "type": "uint256"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [],
            "name": "maxBet",
            "outputs": [
                {
                    "internalType": "uint256",
                    "name": "",
                    "type": "uint256"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "address",
                    "name": "",
                    "type": "address"
                }
            ],
            "name": "playerCertificates",
            "outputs": [
                {
                    "internalType": "bytes",
                    "name": "",
                    "type": "bytes"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "address",
                    "name": "",
                    "type": "address"
                }
            ],
            "name": "playerStats",
            "outputs": [
                {
                    "internalType": "uint256",
                    "name": "gamesPlayed",
                    "type": "uint256"
                },
                {
                    "internalType": "uint256",
                    "name": "gamesWon",
                    "type": "uint256"
                },
                {
                    "internalType": "uint256",
                    "name": "totalWinnings",
                    "type": "uint256"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        }
    ];
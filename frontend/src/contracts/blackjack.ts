import { ethers } from 'ethers';
import { BLACKJACK_ABI } from './abi';

// Dirección del contrato en la red de prueba Sepolia
export const BLACKJACK_CONTRACT_ADDRESS = '0xEf8Fbf3c5D2D8554Dc94B90f276aFb60B9133DE8';


// Tipo para estadísticas del jugador
export interface PlayerStats {
  gamesPlayed: number;
  gamesWon: number;
  totalWinnings: string; // En ETH
}

// Tipo para el resultado del juego
export type GameResult = number; // positivo = ganado, 0 = empate, negativo = perdido

// Clase para interactuar con el contrato de Blackjack
export class BlackjackGame {
  // Constantes del juego
  static readonly BLACKJACK = 21;
  static readonly DEALER_MIN = 17;
  
  // Convertir resultado del juego al formato del contrato
  static getGameResult(playerScore: number, dealerScore: number): GameResult {
    // Si el jugador se pasó de 21, pierde
    if (playerScore > BlackjackGame.BLACKJACK) {
      return -1;
    }
    
    // Si el dealer se pasó de 21, el jugador gana
    if (dealerScore > BlackjackGame.BLACKJACK) {
      return 1;
    }
    
    // Comparar puntuaciones
    if (playerScore > dealerScore) {
      return 1; // Jugador gana
    } else if (playerScore < dealerScore) {
      return -1; // Jugador pierde
    } else {
      return 0; // Empate
    }
  }
  
  // Calcular el valor de una mano
  static calculateHandValue(cards: string[]): number {
    let value = 0;
    let aces = 0;
    
    for (const card of cards) {
      // Extraer solo el valor de la carta (sin el palo)
      const cardValue = card.slice(0, -1);
      
      if (cardValue === 'A') {
        value += 11;
        aces += 1;
      } else if (['K', 'Q', 'J'].includes(cardValue)) {
        value += 10;
      } else {
        value += parseInt(cardValue);
      }
    }
    
    // Ajustar el valor de los ases si nos pasamos de 21
    while (value > BlackjackGame.BLACKJACK && aces > 0) {
      value -= 10; // Cambiar un as de 11 a 1
      aces -= 1;
    }
    
    return value;
  }
}

// Función para obtener la instancia del contrato con un proveedor de solo lectura
export function getBlackjackContractReadOnly() {
  const provider = new ethers.BrowserProvider(window.ethereum);
  return new ethers.Contract(BLACKJACK_CONTRACT_ADDRESS, BLACKJACK_ABI, provider);
}

// Función para obtener la instancia del contrato con un proveedor firmante (para transacciones)
export async function getBlackjackContractWithSigner() {
  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  return new ethers.Contract(BLACKJACK_CONTRACT_ADDRESS, BLACKJACK_ABI, signer);
}

// Función para registrar un certificado de jugador
export async function registerPlayerCertificate(certificate: any) {
  try {
    const contract = await getBlackjackContractWithSigner();
    
    // Convertir el objeto de certificado a una cadena JSON
    const certificateJSON = JSON.stringify(certificate);
    
    // Registrar el certificado convertido a bytes
    const tx = await contract.registerCertificate(ethers.toUtf8Bytes(certificateJSON));
    return await tx.wait();
  } catch (error) {
    console.error('Error al registrar el certificado:', error);
    throw error;
  }
}

// Función para obtener la apuesta máxima permitida
export async function getMaxBet() {
  try {
    const contract = getBlackjackContractReadOnly();
    const maxBet = await contract.maxBet();
    return ethers.formatEther(maxBet); // Convertir de wei a ether
  } catch (error) {
    console.error('Error al obtener la apuesta máxima:', error);
    throw error;
  }
}

// Función para registrar el resultado de un juego y enviar/recibir ETH
export async function recordGameResult(
  result: GameResult,
  betAmount: string, // en ETH
  signature: string
) {
  try {
    const contract = await getBlackjackContractWithSigner();
    const betInWei = ethers.parseEther(betAmount);
    
    // Si el jugador pierde, debe enviar ETH al contrato
    let options = {};
    if (result < 0) {
      console.log(`Enviando ${betAmount} ETH al contrato porque el jugador perdió`);
      options = { value: betInWei };
    }
    
    console.log(`Llamando a recordGameResult con resultado ${result}, apuesta ${betAmount} ETH`);
    console.log(`Opciones de transacción:`, options);
    
    // Asegurarse de que options se pasa correctamente como último parámetro
    const tx = await contract.recordGameResult(
      signature,
      result,
      betInWei,
      options
    );
    
    console.log(`Transacción enviada: ${tx.hash}`);
    const receipt = await tx.wait();
    console.log(`Transacción confirmada: ${receipt.hash}`);
    
    return receipt;
  } catch (error) {
    console.error('Error al registrar el resultado del juego:', error);
    throw error;
  }
}

// Función para obtener las estadísticas de un jugador
export async function getPlayerStats(playerAddress: string): Promise<PlayerStats> {
  try {
    const contract = getBlackjackContractReadOnly();
    const stats = await contract.getPlayerStats(playerAddress);
    
    return {
      gamesPlayed: Number(stats.gamesPlayed),
      gamesWon: Number(stats.gamesWon),
      totalWinnings: ethers.formatEther(stats.totalWinnings) // Convertir de wei a ether
    };
  } catch (error) {
    console.error('Error al obtener las estadísticas del jugador:', error);
    throw error;
  }
}

// Función para firmar un mensaje que contiene el resultado del juego
export async function signGameResult(
  playerAddress: string,
  result: GameResult,
  betAmount: string // en ETH
): Promise<string> {
  try {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const betInWei = ethers.parseEther(betAmount);
    
    // Crear el mensaje hash según la lógica del contrato
    const messageHash = ethers.solidityPackedKeccak256(
      ['address', 'int256', 'uint256'],
      [playerAddress, result, betInWei]
    );
    
    // Firma el hash
    const signature = await signer.signMessage(ethers.getBytes(messageHash));
    return signature;
  } catch (error) {
    console.error('Error al firmar el resultado del juego:', error);
    throw error;
  }
}

export { BLACKJACK_ABI };

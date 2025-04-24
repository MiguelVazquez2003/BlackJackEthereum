import { ethers } from "ethers";
import { BLACKJACK_ABI, BLACKJACK_CONTRACT_ADDRESS } from "../utils/constants";
import { Game, GameResult, PlayerStats } from "../interfaces/IPlayer";

// Función para obtener la instancia del contrato con un proveedor de solo lectura
export function getBlackjackContractReadOnly() {
  const provider = new ethers.BrowserProvider(window.ethereum);

  return new ethers.Contract(
    BLACKJACK_CONTRACT_ADDRESS,
    BLACKJACK_ABI,
    provider
  );
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

    console.log(contract);

    console.log(certificate);

    // Convertir el objeto de certificado a una cadena JSON
    const certificateJSON = JSON.stringify(certificate);

    // Registrar el certificado convertido a bytes
    const tx = await contract.registerCertificate(
      ethers.toUtf8Bytes(certificateJSON)
    );
    return await tx.wait();
  } catch (error) {
    console.error("Error al registrar el certificado:", error);
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
    console.error("Error al obtener la apuesta máxima:", error);
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
      ["address", "int256", "uint256"],
      [playerAddress, result, betInWei]
    );

    // Firma el hash
    const signature = await signer.signMessage(ethers.getBytes(messageHash));
    return signature;
  } catch (error) {
    console.error("Error al firmar el resultado del juego:", error);
    throw error;
  }
}

// Función para registrar el resultado de una partida y almacenar estadísticas
export async function recordGame(
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
      console.log(
        `Enviando ${betAmount} ETH al contrato porque el jugador perdió`
      );
      options = { value: betInWei };
    }

    console.log(
      `Llamando a recordGame con resultado ${result}, apuesta ${betAmount} ETH`
    );
    console.log(`Opciones de transacción:`, options);

    // Llamar a la función recordGame del contrato
    const tx = await contract.recordGame(signature, result, betInWei, options);

    console.log(`Transacción enviada: ${tx.hash}`);
    const receipt = await tx.wait();
    console.log(`Transacción confirmada: ${receipt.hash}`);

    return receipt;
  } catch (error) {
    console.error("Error al registrar la partida:", error);
    throw error;
  }
}

// Función para obtener las estadísticas de un jugador
export async function getPlayerStats(
  playerAddress: string
): Promise<PlayerStats> {
  try {
    const contract = getBlackjackContractReadOnly();
    const stats = await contract.getPlayerStats(playerAddress);

    return {
      gamesPlayed: Number(stats.gamesPlayed),
      gamesWon: Number(stats.gamesWon),
      totalWinnings: ethers.formatEther(stats.totalWinnings), // Convertir de wei a ether
    };
  } catch (error) {
    console.error("Error al obtener las estadísticas del jugador:", error);
    throw error;
  }
}

// Función para verificar y registrar un certificado
export async function checkAndRegisterCertificate(
  account: string,
  setMessage: (msg: string) => void
): Promise<boolean> {
  if (!account) return false;

  try {
    const contract = getBlackjackContractReadOnly();

    // Verificar si el certificado ya está registrado en la blockchain
    const isRegistered = await contract.isCertificateRegistered(account);
    if (isRegistered) {
      setMessage("Certificado ya registrado en la blockchain.");
      return true;
    }

    setMessage("Registrando tu certificado en la blockchain...");

    // Crear un certificado seguro
    const secureCertificate = {
      userID: account,
      date: new Date().toISOString(),
    };

    // Registrar el certificado en la blockchain
    await registerPlayerCertificate(secureCertificate);
    setMessage("Certificado registrado correctamente.");
    return true;
  } catch (error: any) {
    console.error("Error al registrar el certificado:", error);
    const errorMsg = error.message?.includes("execution reverted")
      ? "Error en la lógica del contrato. Verifica tu conexión o intenta nuevamente."
      : `Error al registrar el certificado: ${error.message}`;

    setMessage(errorMsg);
    return false;
  }
}

export async function userExists(userID: string): Promise<boolean> {
  if (!userID) return false;

  try {
    const contract = getBlackjackContractReadOnly();
    const exists = await contract.isCertificateRegistered(userID);
    return exists;
  } catch (error) {
    console.error("Error al verificar si el usuario existe:", error);
    return false;
  }
}

export async function getPlayerGames(playerAddress: string): Promise<Game[]> {
  try {
    const contract = getBlackjackContractReadOnly();
    const games = await contract.getPlayerGames(playerAddress);

    // Mapear
    return games.map((game: any) => ({
      timestamp: new Date(Number(game.timestamp) * 1000).toLocaleString(),
      result: game.result,
      bet: ethers.formatEther(game.bet), // Convertir de wei a ether
    }));
  } catch (error) {
    console.error("Error al obtener las partidas del jugador:", error);
    throw error;
  }
}


export { BLACKJACK_ABI };

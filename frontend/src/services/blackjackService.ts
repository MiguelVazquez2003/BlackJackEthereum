import { ethers } from "ethers";
import { BLACKJACK_ABI, BLACKJACK_CONTRACT_ADDRESS } from "../utils/constants";
import { IUserCertificate } from "../interfaces/IUserCertificate";
import { GameResult, PlayerStats } from "../interfaces/IPlayer";
import { getCertificate } from "../utils/indexedDB";

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
export async function registerPlayerCertificate(certificate: IUserCertificate) {
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
      console.log(
        `Enviando ${betAmount} ETH al contrato porque el jugador perdió`
      );
      options = { value: betInWei };
    }

    console.log(
      `Llamando a recordGameResult con resultado ${result}, apuesta ${betAmount} ETH`
    );
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
    console.error("Error al registrar el resultado del juego:", error);
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
  userName: string,
  setMessage: (msg: string) => void
): Promise<boolean> {
  if (!account) return false;

  try {
    const certificate = await getCertificate(userName);
    if (!certificate) {
      setMessage(
        "No tienes un certificado registrado. Ve a tu perfil para registrarlo."
      );
      return false;
    }

    setMessage("Registrando tu certificado en la blockchain...");

    const secureCertificate = {
      ...certificate,
      publicKey: certificate.publicKey || {},
      userID: certificate.userID || account,
      date: certificate.date || new Date().toISOString(),
      privateKey: undefined,
    };

    await registerPlayerCertificate(secureCertificate);
    setMessage("Certificado registrado correctamente.");
    return true;
  } catch (error: any) {
    if (
      error.message &&
      error.message.includes("execution reverted") &&
      !error.message.includes("Jugador no registrado")
    ) {
      console.log("El certificado probablemente ya está registrado");
      return true;
    }

    console.error("Error al registrar el certificado:", error);
    const errorMsg = error.message?.includes("invalid string value")
      ? "Error en el formato del certificado. Intenta actualizar tu certificado en la página de perfil."
      : `Error al registrar el certificado: ${error.message}`;

    setMessage(errorMsg);
    return false;
  }
}

export { BLACKJACK_ABI };

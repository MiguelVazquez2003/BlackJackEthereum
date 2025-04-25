// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

contract Blackjack {
    using MessageHashUtils for bytes32;
    using ECDSA for bytes32;

    struct PlayerStats {
        uint256 gamesPlayed;
        uint256 gamesWon;
        uint256 totalWinnings;
    }

    struct Game {
        uint256 timestamp;
        int256 result; // 1: Gana, 0: Empate, -1: Pierde
        uint256 bet;
    }

    // Mapeo de direcciones a certificados de jugadores
    mapping(address => bytes) public playerCertificates;

    // Mapeo de direcciones a estadísticas de jugadores
    mapping(address => PlayerStats) public playerStats;

    // Mapeo de direcciones a historial de partidas
    mapping(address => Game[]) public playerGames;

    // Mapeo de direcciones a balances internos
    mapping(address => uint256) public playerBalances;

    // Mapeo para registrar firmas ya utilizadas
    mapping(bytes32 => bool) private usedSignatures;

    // Apuesta máxima permitida
    uint256 public maxBet = 0.00001 ether;

    // Eventos
    event GameStarted(address indexed player, uint256 bet);
    event GameEnded(address indexed player, int256 result);
    event CertificateRegistered(address indexed player);
    event GameRecorded(address indexed player, int256 result, uint256 bet);
    event FundsDeposited(address indexed player, uint256 amount);
    event FundsWithdrawn(address indexed player, uint256 amount);

    // Constructor del contrato
    constructor() {}

    // Función para verificar si un jugador ya tiene un certificado registrado
    function isCertificateRegistered(address player) public view returns (bool) {
        return playerCertificates[player].length > 0;
    }

    // Función para registrar un certificado de jugador
    function registerCertificate(bytes memory certificate) public {
        require(playerCertificates[msg.sender].length == 0, "Certificado ya registrado");
        playerCertificates[msg.sender] = certificate;
        emit CertificateRegistered(msg.sender);
    }

    // Función para depositar fondos en el balance interno
    function depositFunds() public payable {
        require(msg.value > 0, "Debes enviar ETH para depositar.");
        playerBalances[msg.sender] += msg.value;
        emit FundsDeposited(msg.sender, msg.value);
    }

    // Función para registrar el resultado de un juego
 function recordGame(
    bytes memory signature,
    int256 result,
    uint256 bet,
    uint256 nonce // Agregar nonce como argumento
) public {
    require(playerCertificates[msg.sender].length > 0, "Jugador no registrado");
    require(bet <= maxBet, "Apuesta demasiado alta");
    require(playerBalances[msg.sender] >= bet, "Saldo insuficiente");

    // Verificar la firma del resultado
    bytes32 messageHash = keccak256(abi.encodePacked(msg.sender, result, bet, nonce));
    bytes32 ethSignedMessageHash = messageHash.toEthSignedMessageHash();

    address signer = ethSignedMessageHash.recover(signature);
    require(signer == msg.sender, unicode"Firma inválida");

    // Verificar si la firma ya fue utilizada
    require(!usedSignatures[ethSignedMessageHash], "Firma ya utilizada");

    // Registrar la firma como utilizada
    usedSignatures[ethSignedMessageHash] = true;

    // Deducir la apuesta del balance del jugador
    playerBalances[msg.sender] -= bet;

    // Actualizar estadísticas del jugador
    playerStats[msg.sender].gamesPlayed += 1;

    if (result > 0) {
        // Si el jugador gana, se le paga el doble de su apuesta
        uint256 winnings = bet * 2;
        playerBalances[msg.sender] += winnings;
        playerStats[msg.sender].gamesWon += 1;
        playerStats[msg.sender].totalWinnings += bet;
    }

    // Registrar la partida en el historial
    playerGames[msg.sender].push(Game(block.timestamp, result, bet));

    emit GameRecorded(msg.sender, result, bet);
}

    // Función para retirar el balance restante
    function withdrawFunds() public {
        uint256 balance = playerBalances[msg.sender];
        require(balance > 0, "No tienes fondos para retirar.");
        playerBalances[msg.sender] = 0;
        payable(msg.sender).transfer(balance);
        emit FundsWithdrawn(msg.sender, balance);
    }

    // Función para obtener las estadísticas de un jugador
    function getPlayerStats(
        address player
    )
        public
        view
        returns (uint256 gamesPlayed, uint256 gamesWon, uint256 totalWinnings)
    {
        PlayerStats memory stats = playerStats[player];
        return (stats.gamesPlayed, stats.gamesWon, stats.totalWinnings);
    }

    // Función para obtener el historial de partidas de un jugador
    function getPlayerGames(address player) public view returns (Game[] memory) {
        return playerGames[player];
    }

    // Función para que el propietario del contrato retire fondos
    function withdrawContractFunds() public {
        payable(address(this)).transfer(address(this).balance);
    }

    // Función para recibir ETH
    receive() external payable {}
}
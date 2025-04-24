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

    // Apuesta máxima permitida
    uint256 public maxBet = 0.00001 ether;

    // Eventos
    event GameStarted(address indexed player, uint256 bet);
    event GameEnded(address indexed player, int256 result);
    event CertificateRegistered(address indexed player);
    event GameRecorded(address indexed player, int256 result, uint256 bet);

    // Constructor del contrato
    constructor() {}

    // Función para verificar si un jugador ya tiene un certificado registrado
    function isCertificateRegistered(address player) public view returns (bool) {
        return playerCertificates[player].length > 0;
    }

    // Actualizar la función de registro para evitar sobrescribir certificados existentes
    function registerCertificate(bytes memory certificate) public {
        require(playerCertificates[msg.sender].length == 0, "Certificado ya registrado");
        playerCertificates[msg.sender] = certificate;
        emit CertificateRegistered(msg.sender);
    }

    // Función para registrar el resultado de un juego
    function recordGameResult(
        bytes memory signature,
        int256 result,
        uint256 bet
    ) public payable {
        require(
            playerCertificates[msg.sender].length > 0,
            "Jugador no registrado"
        );
        require(bet <= maxBet, "Apuesta demasiado alta");

        // Verificar la firma del resultado
        bytes32 messageHash = keccak256(
            abi.encodePacked(msg.sender, result, bet)
        );
        bytes32 ethSignedMessageHash = messageHash.toEthSignedMessageHash();

        // Recuperar la dirección que firmó el mensaje
        address signer = ethSignedMessageHash.recover(signature);
        require(signer == msg.sender, unicode"Firma inválida");

        // Si el jugador pierde, debe enviar ETH
        if (result < 0) {
            require(msg.value >= bet, "Apuesta insuficiente");
        }

        // Registrar el inicio del juego
        emit GameStarted(msg.sender, bet);

        // Actualizar estadísticas del jugador
        playerStats[msg.sender].gamesPlayed += 1;

        // Si el jugador ganó
        if (result > 0) {
            playerStats[msg.sender].gamesWon += 1;
            playerStats[msg.sender].totalWinnings += bet;
            // La casa transfiere la apuesta al jugador
            payable(msg.sender).transfer(bet);
        } else if (result == 0) {
            // Empate - no se envía nada
        }
        // Si result < 0, la casa gana y se queda con la apuesta

        emit GameEnded(msg.sender, result);
    }

    // Función para registrar una partida
    function recordGame(
        bytes memory signature,
        int256 result,
        uint256 bet
    ) public payable {
        require(
            playerCertificates[msg.sender].length > 0,
            "Jugador no registrado"
        );
        require(bet <= maxBet, "Apuesta demasiado alta");

        bytes32 messageHash = keccak256(
            abi.encodePacked(msg.sender, result, bet)
        );
        bytes32 ethSignedMessageHash = messageHash.toEthSignedMessageHash();

        address signer = ethSignedMessageHash.recover(signature);
        require(signer == msg.sender, unicode"Firma inválida");

        if (result < 0) {
            require(msg.value >= bet, "Apuesta insuficiente");
        }

        playerStats[msg.sender].gamesPlayed += 1;

        if (result > 0) {
            playerStats[msg.sender].gamesWon += 1;
            playerStats[msg.sender].totalWinnings += bet;
            payable(msg.sender).transfer(bet);
        }

        playerGames[msg.sender].push(Game(block.timestamp, result, bet));

        emit GameRecorded(msg.sender, result, bet);
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
    function withdrawFunds() public {
        payable(address(this)).transfer(address(this).balance);
    }

    // Función para recibir ETH
    receive() external payable {}
}

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
        uint256 totalLosses; // Pérdidas totales
        bool hasPendingDebt; // Indicador de deuda pendiente
        uint256 pendingDebtAmount; // Monto de deuda pendiente
        uint256 initialDeposit; // Depósito inicial activo
        uint256 depositTimestamp; // Cuándo se realizó el depósito
    }

    struct Game {
        uint256 timestamp;
        int256 result; // 1: Gana, 0: Empate, -1: Pierde
        uint256 bet;
        bool settled; // Indica si la partida fue liquidada correctamente
    }

    // Mapeos existentes
    mapping(address => bytes) public playerCertificates;
    mapping(address => PlayerStats) public playerStats;
    mapping(address => Game[]) public playerGames;
    mapping(address => uint256) public playerBalances;
    mapping(bytes32 => bool) private usedSignatures;

    uint256 public maxBet = 0.00001 ether;

    // Eventos
    event GameStarted(address indexed player, uint256 bet);
    event GameEnded(address indexed player, int256 result);
    event CertificateRegistered(address indexed player);
    event GameRecorded(address indexed player, int256 result, uint256 bet);
    event FundsDeposited(address indexed player, uint256 amount);
    event FundsWithdrawn(address indexed player, uint256 amount);
    event DebtSettled(address indexed player, uint256 amount);
    event SessionFinalized(address indexed player, uint256 finalBalance);

    constructor() {}

    // Funciones de verificación - Sin cambios
    function isCertificateRegistered(address player) public view returns (bool) {
        return playerCertificates[player].length > 0;
    }

    function hasPendingDebt(address player) public view returns (bool) {
        return playerStats[player].hasPendingDebt;
    }

    function getPendingDebtAmount(address player) public view returns (uint256) {
        return playerStats[player].pendingDebtAmount;
    }

    function registerCertificate(bytes memory certificate) public {
        require(
            playerCertificates[msg.sender].length == 0,
            "Certificado ya registrado"
        );
        playerCertificates[msg.sender] = certificate;
        emit CertificateRegistered(msg.sender);
    }

    // Función modificada para depositar fondos como un depósito inicial
    function depositFunds() public payable {
        require(msg.value > 0, "Debes enviar ETH para depositar.");
        
        // Si tiene deuda pendiente, saldarla primero
        if (playerStats[msg.sender].hasPendingDebt) {
            uint256 debtAmount = playerStats[msg.sender].pendingDebtAmount;
            require(msg.value >= debtAmount, "El deposito debe cubrir tu deuda pendiente");
            
            // Liquidar la deuda
            uint256 remainingAmount = msg.value - debtAmount;
            playerStats[msg.sender].hasPendingDebt = false;
            playerStats[msg.sender].pendingDebtAmount = 0;
            emit DebtSettled(msg.sender, debtAmount);
            
            // Asignar el resto como depósito inicial
            playerBalances[msg.sender] += remainingAmount;
            playerStats[msg.sender].initialDeposit = remainingAmount;
            playerStats[msg.sender].depositTimestamp = block.timestamp;
        } else {
            // Sin deudas, se asigna todo el valor como depósito inicial
            playerBalances[msg.sender] += msg.value;
            playerStats[msg.sender].initialDeposit = msg.value;
            playerStats[msg.sender].depositTimestamp = block.timestamp;
        }

        emit FundsDeposited(msg.sender, msg.value);
    }

    // Función para saldar deudas - Sin cambios mayores
    function settleDebt() public payable {
        require(
            playerStats[msg.sender].hasPendingDebt,
            "No tienes deudas pendientes"
        );
        uint256 debtAmount = playerStats[msg.sender].pendingDebtAmount;
        require(
            msg.value >= debtAmount,
            "El valor enviado es menor que la deuda"
        );

        // Marcar la deuda como saldada
        playerStats[msg.sender].hasPendingDebt = false;
        playerStats[msg.sender].pendingDebtAmount = 0;

        // Enviar el excedente al balance del jugador si envió más de lo necesario
        if (msg.value > debtAmount) {
            uint256 excess = msg.value - debtAmount;
            playerBalances[msg.sender] += excess;
            playerStats[msg.sender].initialDeposit += excess; // Actualizar el depósito inicial con el excedente
        }

        emit DebtSettled(msg.sender, debtAmount);
    }

    // Función para registrar juegos - Con verificación de depósito inicial
    function recordGame(
        bytes memory signature,
        int256 result,
        uint256 bet,
        uint256 nonce
    ) public {
        require(
            playerCertificates[msg.sender].length > 0,
            "Jugador no registrado"
        );
        require(bet <= maxBet, "Apuesta demasiado alta");
        require(
            !playerStats[msg.sender].hasPendingDebt,
            "Tienes deudas pendientes"
        );
        require(playerBalances[msg.sender] >= bet, "Saldo insuficiente");
        
        // Verificar que hay un depósito inicial activo
        require(
            playerStats[msg.sender].initialDeposit > 0,
            unicode"No tienes un depósito actual activo"
        );

        // Verificación de firma y resto del código igual
        bytes32 messageHash = keccak256(
            abi.encodePacked(msg.sender, result, bet, nonce)
        );
        bytes32 ethSignedMessageHash = messageHash.toEthSignedMessageHash();

        address signer = ethSignedMessageHash.recover(signature);
        require(signer == msg.sender, unicode"Firma inválida");

        require(!usedSignatures[ethSignedMessageHash], "Firma ya utilizada");
        usedSignatures[ethSignedMessageHash] = true;

        // Deducir la apuesta del balance y actualizar estadísticas
        playerBalances[msg.sender] -= bet;

        playerStats[msg.sender].gamesPlayed += 1;

        if (result > 0) {
            uint256 winnings = bet * 2;
            playerBalances[msg.sender] += winnings + bet;
            playerStats[msg.sender].gamesWon += 1;
            playerStats[msg.sender].totalWinnings += bet;
        } else if (result < 0) {
            playerStats[msg.sender].totalLosses += bet;
        }

        // Registrar la partida en el historial
        playerGames[msg.sender].push(Game(block.timestamp, result, bet, true));

        emit GameRecorded(msg.sender, result, bet);
    }

    // Función para registrar partida no pagada
    function recordUnpaidGame(address player, uint256 bet) public {
        require(playerCertificates[player].length > 0, "Jugador no registrado");

        // Registrar la deuda
        playerStats[player].hasPendingDebt = true;
        playerStats[player].pendingDebtAmount = bet;

        // Registrar la partida como no liquidada en el historial
        playerGames[player].push(Game(block.timestamp, -1, bet, false));
    }

    // Función para finalizar sesión y retirar fondos
    function finalizeSession() public {
        uint256 balance = playerBalances[msg.sender];
        require(balance > 0, "No tienes fondos para retirar.");
        require(
            !playerStats[msg.sender].hasPendingDebt,
            "No puedes retirar con deudas pendientes"
        );

        // Resetear los valores de depósito
        playerBalances[msg.sender] = 0;
        playerStats[msg.sender].initialDeposit = 0;
        
        // Transferir el balance final al jugador
        payable(msg.sender).transfer(balance);
        emit SessionFinalized(msg.sender, balance);
    }

    // Función para obtener estadísticas del jugador - Actualizada para incluir el depósito inicial
    function getPlayerStats(
        address player
    )
        public
        view
        returns (
            uint256 gamesPlayed,
            uint256 gamesWon,
            uint256 totalWinnings,
            uint256 totalLosses,
            bool playerHasDebt,
            uint256 pendingDebtAmount,
            uint256 initialDepositAmount,  // Nuevo campo
            uint256 depositTime           // Nuevo campo
        )
    {
        PlayerStats memory stats = playerStats[player];
        return (
            stats.gamesPlayed,
            stats.gamesWon,
            stats.totalWinnings,
            stats.totalLosses,
            stats.hasPendingDebt,
            stats.pendingDebtAmount,
            stats.initialDeposit,          // Retornamos el depósito inicial
            stats.depositTimestamp         // Retornamos cuándo se hizo el depósito
        );
    }

    function getPlayerGames(address player) public view returns (Game[] memory) {
        return playerGames[player];
    }

    function withdrawContractFunds() public {
        payable(address(this)).transfer(address(this).balance);
    }

    receive() external payable {}
}
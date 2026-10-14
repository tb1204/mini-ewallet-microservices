package com.example.walletservice.service;

import com.example.walletservice.constants.ErrorCode;
import com.example.walletservice.constants.WalletStatus;
import com.example.walletservice.dto.request.BalanceOperationRequest;
import com.example.walletservice.dto.request.CreateWalletRequest;
import com.example.walletservice.dto.request.TopUpRequest;
import com.example.walletservice.dto.request.WithdrawRequest;
import com.example.walletservice.dto.response.WalletResponse;
import com.example.walletservice.entity.Wallet;
import com.example.walletservice.exception.AppException;
import com.example.walletservice.entity.WalletOperation;
import com.example.walletservice.repository.WalletOperationRepository;
import com.example.walletservice.repository.WalletRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Core Service managing electronic wallet creation, balance inquiries, top-ups, withdrawals, and Saga transaction operations.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class WalletService {

    private final WalletRepository walletRepository;
    private final WalletOperationRepository walletOperationRepository;

    /**
     * Create a new wallet associated with user ID:
     * - Check if user already owns a wallet
     * - Build and persist initial active Wallet with zero balance
     */
    @Transactional
    public WalletResponse createWallet(CreateWalletRequest request) {
        log.info("Creating initial wallet for user ID: {}", request.getUserId());

        if (walletRepository.existsByUserId(request.getUserId())) {
            throw new AppException(ErrorCode.WALLET_ALREADY_EXISTS);
        }

        Wallet wallet = Wallet.builder()
                .userId(request.getUserId())
                .balance(BigDecimal.ZERO)
                .currency("VND")
                .status(WalletStatus.ACTIVE)
                .build();

        Wallet savedWallet = walletRepository.save(wallet);
        return mapToWalletResponse(savedWallet);
    }

    /**
     * Retrieve wallet details by user UUID.
     */
    public WalletResponse getWalletByUserId(UUID userId) {
        Wallet wallet = walletRepository.findByUserId(userId)
                .orElseThrow(() -> new AppException(ErrorCode.WALLET_NOT_FOUND));
        return mapToWalletResponse(wallet);
    }

    /**
     * Top-up funds into user wallet:
     * - Acquire pessimistic write lock on wallet record
     * - Verify wallet is in ACTIVE status
     * - Add positive amount to balance and save
     */
    @Transactional
    public WalletResponse topUp(UUID userId, TopUpRequest request) {
        log.info("Processing top-up of {} for user ID: {}", request.getAmount(), userId);

        Wallet wallet = walletRepository.findByUserIdWithLock(userId)
                .orElseThrow(() -> new AppException(ErrorCode.WALLET_NOT_FOUND));

        validateWalletActive(wallet);

        wallet.setBalance(wallet.getBalance().add(request.getAmount()));
        Wallet updatedWallet = walletRepository.save(wallet);

        return mapToWalletResponse(updatedWallet);
    }

    /**
     * Withdraw funds from user wallet:
     * - Acquire pessimistic write lock on wallet record
     * - Verify active status and balance sufficiency
     * - Deduct amount from balance and save
     */
    @Transactional
    public WalletResponse withdraw(UUID userId, WithdrawRequest request) {
        log.info("Processing withdrawal of {} for user ID: {}", request.getAmount(), userId);

        Wallet wallet = walletRepository.findByUserIdWithLock(userId)
                .orElseThrow(() -> new AppException(ErrorCode.WALLET_NOT_FOUND));

        validateWalletActive(wallet);
        validateSufficientBalance(wallet, request.getAmount());

        wallet.setBalance(wallet.getBalance().subtract(request.getAmount()));
        Wallet updatedWallet = walletRepository.save(wallet);

        return mapToWalletResponse(updatedWallet);
    }

    /**
     * Internal Saga Pattern Operation: Deposit funds into target wallet (e.g. transfer recipient).
     * Guaranteed Idempotent by transactionId.
     */
    @Transactional
    public WalletResponse depositInternal(BalanceOperationRequest request) {
        log.info("Saga Deposit: Adding {} for user ID: {}, transactionId: {}", request.getAmount(), request.getUserId(), request.getTransactionId());

        Wallet wallet = walletRepository.findByUserIdWithLock(request.getUserId())
                .orElseThrow(() -> new AppException(ErrorCode.WALLET_NOT_FOUND));

        validateWalletActive(wallet);

        // Idempotency check: If this transaction deposit was already processed, return existing wallet directly
        String operationKey = "DEPOSIT_" + (request.getTransactionId() != null ? request.getTransactionId() : UUID.randomUUID().toString());
        if (walletOperationRepository.existsByOperationKey(operationKey)) {
            log.warn("Duplicate deposit detected for operationKey: {}. Returning current wallet (Idempotent).", operationKey);
            return mapToWalletResponse(wallet);
        }

        wallet.setBalance(wallet.getBalance().add(request.getAmount()));
        Wallet updatedWallet = walletRepository.save(wallet);

        walletOperationRepository.save(WalletOperation.builder()
                .operationKey(operationKey)
                .walletId(wallet.getId())
                .userId(wallet.getUserId())
                .amount(request.getAmount())
                .operationType("DEPOSIT")
                .build());

        return mapToWalletResponse(updatedWallet);
    }

    /**
     * Internal Saga Pattern Operation: Deduct funds from source wallet (e.g. transfer sender).
     * Guaranteed Idempotent by transactionId.
     */
    @Transactional
    public WalletResponse deductInternal(BalanceOperationRequest request) {
        log.info("Saga Deduct: Subtracting {} for user ID: {}, transactionId: {}", request.getAmount(), request.getUserId(), request.getTransactionId());

        Wallet wallet = walletRepository.findByUserIdWithLock(request.getUserId())
                .orElseThrow(() -> new AppException(ErrorCode.WALLET_NOT_FOUND));

        validateWalletActive(wallet);

        // Idempotency check: If this transaction deduction was already processed, return existing wallet directly
        String operationKey = "DEDUCT_" + (request.getTransactionId() != null ? request.getTransactionId() : UUID.randomUUID().toString());
        if (walletOperationRepository.existsByOperationKey(operationKey)) {
            log.warn("Duplicate deduct detected for operationKey: {}. Returning current wallet (Idempotent).", operationKey);
            return mapToWalletResponse(wallet);
        }

        validateSufficientBalance(wallet, request.getAmount());

        wallet.setBalance(wallet.getBalance().subtract(request.getAmount()));
        Wallet updatedWallet = walletRepository.save(wallet);

        walletOperationRepository.save(WalletOperation.builder()
                .operationKey(operationKey)
                .walletId(wallet.getId())
                .userId(wallet.getUserId())
                .amount(request.getAmount())
                .operationType("DEDUCT")
                .build());

        return mapToWalletResponse(updatedWallet);
    }

    /** Helper method ensuring wallet status is ACTIVE. */
    private void validateWalletActive(Wallet wallet) {
        if (wallet.getStatus() != WalletStatus.ACTIVE) {
            throw new AppException(ErrorCode.WALLET_LOCKED);
        }
    }

    /** Helper method ensuring wallet balance is sufficient for deduction. */
    private void validateSufficientBalance(Wallet wallet, BigDecimal amount) {
        if (wallet.getBalance().compareTo(amount) < 0) {
            throw new AppException(ErrorCode.INSUFFICIENT_BALANCE);
        }
    }

    /** Map Wallet entity to WalletResponse DTO. */
    public WalletResponse mapToWalletResponse(Wallet wallet) {
        return WalletResponse.builder()
                .id(wallet.getId())
                .userId(wallet.getUserId())
                .balance(wallet.getBalance())
                .currency(wallet.getCurrency())
                .status(wallet.getStatus())
                .createdAt(wallet.getCreatedAt())
                .updatedAt(wallet.getUpdatedAt())
                .build();
    }

    /**
     * Admin/Staff Query: Retrieve paginated wallets with optional keyword and status filters.
     */
    public org.springframework.data.domain.Page<WalletResponse> getAllWallets(
            String keyword, WalletStatus status, org.springframework.data.domain.Pageable pageable) {
        org.springframework.data.domain.Page<Wallet> walletsPage = walletRepository.searchWallets(keyword, status, pageable);
        return walletsPage.map(this::mapToWalletResponse);
    }

    /**
     * Admin Action: Toggle wallet status between ACTIVE and LOCKED.
     */
    @Transactional
    public WalletResponse toggleWalletStatus(UUID walletId) {
        Wallet wallet = walletRepository.findById(walletId)
                .orElseThrow(() -> new AppException(ErrorCode.WALLET_NOT_FOUND));

        WalletStatus newStatus = wallet.getStatus() == WalletStatus.ACTIVE ? WalletStatus.LOCKED : WalletStatus.ACTIVE;
        wallet.setStatus(newStatus);
        Wallet saved = walletRepository.save(wallet);
        return mapToWalletResponse(saved);
    }

    /**
     * Admin Action: Update wallet status.
     */
    @Transactional
    public WalletResponse updateWalletStatus(UUID walletId, WalletStatus newStatus) {
        Wallet wallet = walletRepository.findById(walletId)
                .orElseThrow(() -> new AppException(ErrorCode.WALLET_NOT_FOUND));

        wallet.setStatus(newStatus);
        Wallet saved = walletRepository.save(wallet);
        return mapToWalletResponse(saved);
    }
}

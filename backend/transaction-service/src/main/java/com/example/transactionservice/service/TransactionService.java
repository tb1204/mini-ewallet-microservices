package com.example.transactionservice.service;

import com.example.transactionservice.client.IdentityClient;
import com.example.transactionservice.client.WalletClient;
import com.example.transactionservice.constants.ErrorCode;
import com.example.transactionservice.dto.request.CreateTransferRequest;
import com.example.transactionservice.dto.request.VerifyPinRequest;
import com.example.transactionservice.dto.response.ApiResponse;
import com.example.transactionservice.dto.response.TransactionResponse;
import com.example.transactionservice.dto.response.WalletResponse;
import com.example.transactionservice.entity.IdempotencyKey;
import com.example.transactionservice.entity.Transaction;
import com.example.transactionservice.exception.AppException;
import com.example.transactionservice.repository.TransactionRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class TransactionService {

    private final TransferSagaOrchestrator transferSagaOrchestrator;
    private final TransactionRepository transactionRepository;
    private final WalletClient walletClient;
    private final IdentityClient identityClient;
    private final IdempotencyService idempotencyService;
    private final ObjectMapper objectMapper;

    /**
     * Process P2P Money Transfer with PIN verification & Idempotency Key check.
     */
    public TransactionResponse transferMoney(UUID senderUserId, String authHeader, CreateTransferRequest request) {
        log.info("Processing transfer request for user: {}", senderUserId);

        // 1. Verify PIN via Identity Service
        try {
            VerifyPinRequest pinReq = VerifyPinRequest.builder().pin(request.getPin()).build();
            ApiResponse<Boolean> pinRes = identityClient.verifyPin(authHeader, pinReq);
            if (pinRes == null || pinRes.getResult() == null || !pinRes.getResult()) {
                throw new AppException(ErrorCode.INVALID_PIN);
            }
        } catch (AppException e) {
            throw e;
        } catch (Exception e) {
            log.error("PIN verification error: {}", e.getMessage());
            throw new AppException(ErrorCode.INVALID_PIN);
        }

        // 2. Check Idempotency Key if provided
        String key = request.getIdempotencyKey();
        if (key != null && !key.isBlank()) {
            Optional<IdempotencyKey> existingKey = idempotencyService.checkKey(key);
            if (existingKey.isPresent() && existingKey.get().getResponseBody() != null) {
                try {
                    return objectMapper.readValue(existingKey.get().getResponseBody(), TransactionResponse.class);
                } catch (Exception e) {
                    log.error("Failed to deserialize idempotency response: {}", e.getMessage());
                }
            }
            idempotencyService.createKey(key, senderUserId, "/api/v1/transactions/transfer");
        }

        // 3. Execute Saga Pattern Transfer
        Transaction transaction;
        try {
            transaction = transferSagaOrchestrator.executeTransferSaga(senderUserId, request, key);
        } catch (Exception e) {
            if (key != null && !key.isBlank()) {
                idempotencyService.failKey(key);
            }
            throw e;
        }

        TransactionResponse response = mapToTransactionResponse(transaction);

        // 4. Complete Idempotency Key
        if (key != null && !key.isBlank()) {
            try {
                String jsonBody = objectMapper.writeValueAsString(response);
                idempotencyService.completeKey(key, 200, jsonBody);
            } catch (Exception e) {
                log.error("Failed to save idempotency response: {}", e.getMessage());
            }
        }

        return response;
    }

    /**
     * Retrieve all transaction history for the authenticated user's wallet.
     */
    public List<TransactionResponse> getMyTransactionHistory(UUID userId) {
        // Fetch user's wallet
        ApiResponse<WalletResponse> walletRes = walletClient.getWalletByUserId(userId);
        if (walletRes == null || walletRes.getResult() == null) {
            throw new AppException(ErrorCode.SENDER_WALLET_NOT_FOUND);
        }

        UUID walletId = walletRes.getResult().getId();
        List<Transaction> transactions = transactionRepository.findAllByWalletId(walletId);

        return transactions.stream()
                .map(this::mapToTransactionResponse)
                .collect(Collectors.toList());
    }

    /**
     * Retrieve transaction details by transaction UUID.
     */
    public TransactionResponse getTransactionById(UUID transactionId) {
        Transaction transaction = transactionRepository.findById(transactionId)
                .orElseThrow(() -> new AppException(ErrorCode.TRANSACTION_NOT_FOUND));
        return mapToTransactionResponse(transaction);
    }

    /**
     * Retrieve transaction details by transaction code.
     */
    public TransactionResponse getTransactionByCode(String code) {
        Transaction transaction = transactionRepository.findByTransactionCode(code)
                .orElseThrow(() -> new AppException(ErrorCode.TRANSACTION_NOT_FOUND));
        return mapToTransactionResponse(transaction);
    }

    public TransactionResponse mapToTransactionResponse(Transaction tx) {
        return TransactionResponse.builder()
                .id(tx.getId())
                .transactionCode(tx.getTransactionCode())
                .senderWalletId(tx.getSenderWalletId())
                .receiverWalletId(tx.getReceiverWalletId())
                .serviceType(tx.getServiceType())
                .amount(tx.getAmount())
                .fee(tx.getFee())
                .status(tx.getStatus())
                .description(tx.getDescription())
                .idempotencyKey(tx.getIdempotencyKey())
                .createdAt(tx.getCreatedAt())
                .build();
    }

    /**
     * Admin/Staff Query: Retrieve paginated system transactions with keyword and status filters.
     */
    public org.springframework.data.domain.Page<TransactionResponse> getAllTransactions(
            String keyword, com.example.transactionservice.constants.TransactionStatus status, org.springframework.data.domain.Pageable pageable) {
        org.springframework.data.domain.Page<Transaction> page = transactionRepository.searchTransactions(keyword, status, pageable);
        return page.map(this::mapToTransactionResponse);
    }
}

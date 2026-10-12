package com.example.transactionservice.service;

import com.example.transactionservice.client.IdentityClient;
import com.example.transactionservice.client.WalletClient;
import com.example.transactionservice.constants.ErrorCode;
import com.example.transactionservice.constants.TransactionStatus;
import com.example.transactionservice.constants.TransactionType;
import com.example.transactionservice.dto.request.BalanceOperationRequest;
import com.example.transactionservice.dto.request.CreateTransferRequest;
import com.example.transactionservice.dto.response.ApiResponse;
import com.example.transactionservice.dto.response.UserResponse;
import com.example.transactionservice.dto.response.WalletResponse;
import com.example.transactionservice.entity.Transaction;
import com.example.transactionservice.exception.AppException;
import com.example.transactionservice.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class TransferSagaOrchestrator {

    private final IdentityClient identityClient;
    private final WalletClient walletClient;
    private final TransactionRepository transactionRepository;

    /**
     * Execute P2P Transfer using 2-step Saga Pattern with Compensating Action.
     */
    public Transaction executeTransferSaga(UUID senderUserId, CreateTransferRequest request, String idempotencyKey) {
        log.info("Starting Transfer Saga from senderUserId: {} to recipient: {}, amount: {}", 
                senderUserId, request.getRecipient(), request.getAmount());

        // 1. Resolve receiver user details from Identity Service
        UserResponse receiverUser;
        try {
            ApiResponse<UserResponse> userRes = identityClient.findUserByIdentifier(request.getRecipient());
            if (userRes == null || userRes.getResult() == null) {
                throw new AppException(ErrorCode.RECEIVER_NOT_FOUND);
            }
            receiverUser = userRes.getResult();
        } catch (AppException e) {
            throw e;
        } catch (Exception e) {
            log.error("Failed to query receiver user info: {}", e.getMessage());
            throw new AppException(ErrorCode.RECEIVER_NOT_FOUND);
        }

        UUID receiverUserId = receiverUser.getId();

        // 2. Validate sender is not transferring to self
        if (senderUserId.equals(receiverUserId)) {
            throw new AppException(ErrorCode.CANNOT_TRANSFER_TO_SELF);
        }

        // 3. Resolve Sender Wallet and Receiver Wallet
        WalletResponse senderWallet = fetchWallet(senderUserId, ErrorCode.SENDER_WALLET_NOT_FOUND);
        WalletResponse receiverWallet = fetchWallet(receiverUserId, ErrorCode.RECEIVER_WALLET_NOT_FOUND);

        // 4. Validate sender balance
        if (senderWallet.getBalance().compareTo(request.getAmount()) < 0) {
            throw new AppException(ErrorCode.INSUFFICIENT_BALANCE);
        }

        // 5. Build Initial Transaction Record
        String txCode = "TXN" + Instant.now().toEpochMilli();
        Transaction transaction = Transaction.builder()
                .transactionCode(txCode)
                .senderWalletId(senderWallet.getId())
                .receiverWalletId(receiverWallet.getId())
                .serviceType(TransactionType.TRANSFER)
                .amount(request.getAmount())
                .fee(java.math.BigDecimal.ZERO)
                .status(TransactionStatus.PENDING)
                .description(request.getDescription() != null && !request.getDescription().isBlank() 
                        ? request.getDescription() 
                        : "Chuyển tiền P2P tới " + (receiverUser.getFullName() != null ? receiverUser.getFullName() : receiverUser.getUsername()))
                .idempotencyKey(idempotencyKey)
                .build();

        Transaction savedTx = transactionRepository.save(transaction);

        // 6. Saga Step 1: Deduct funds from Sender Wallet
        boolean senderDeducted = false;
        try {
            BalanceOperationRequest deductRequest = BalanceOperationRequest.builder()
                    .userId(senderUserId)
                    .amount(request.getAmount())
                    .transactionId(savedTx.getId().toString())
                    .build();

            ApiResponse<WalletResponse> deductRes = walletClient.deductInternal(deductRequest);
            if (deductRes != null && deductRes.getCode() == 1000) {
                senderDeducted = true;
                log.info("Saga Step 1 Success: Deducted {} from sender {}", request.getAmount(), senderUserId);
            } else {
                throw new AppException(ErrorCode.TRANSACTION_FAILED);
            }
        } catch (Exception e) {
            log.error("Saga Step 1 Failed (Deduct Sender): {}", e.getMessage());
            savedTx.setStatus(TransactionStatus.FAILED);
            return transactionRepository.save(savedTx);
        }

        // 7. Saga Step 2: Deposit funds into Receiver Wallet
        try {
            BalanceOperationRequest depositRequest = BalanceOperationRequest.builder()
                    .userId(receiverUserId)
                    .amount(request.getAmount())
                    .transactionId(savedTx.getId().toString())
                    .build();

            ApiResponse<WalletResponse> depositRes = walletClient.depositInternal(depositRequest);
            if (depositRes != null && depositRes.getCode() == 1000) {
                log.info("Saga Step 2 Success: Deposited {} to receiver {}", request.getAmount(), receiverUserId);
                savedTx.setStatus(TransactionStatus.SUCCESS);
                return transactionRepository.save(savedTx);
            } else {
                throw new Exception("Deposit response returned non-1000 code");
            }
        } catch (Exception e) {
            log.error("Saga Step 2 Failed (Deposit Receiver). Initiating Compensating Rollback... Error: {}", e.getMessage());

            // 8. Compensating Action (Rollback): Refund money back to Sender Wallet with retry
            if (senderDeducted) {
                boolean refundSuccess = false;
                int maxRetries = 3;
                BalanceOperationRequest refundRequest = BalanceOperationRequest.builder()
                        .userId(senderUserId)
                        .amount(request.getAmount())
                        .transactionId(savedTx.getId().toString() + "-ROLLBACK")
                        .build();

                for (int attempt = 1; attempt <= maxRetries; attempt++) {
                    try {
                        log.info("Attempting Saga Compensating Rollback (Attempt {}/{}) for sender {}", 
                                attempt, maxRetries, senderUserId);
                        ApiResponse<WalletResponse> refundRes = walletClient.depositInternal(refundRequest);
                        if (refundRes != null && refundRes.getCode() == 1000) {
                            refundSuccess = true;
                            log.info("Saga Compensating Rollback Executed Successfully for sender {}", senderUserId);
                            break;
                        }
                    } catch (Exception rollbackEx) {
                        log.warn("Saga Rollback attempt {} failed for sender {}: {}", attempt, senderUserId, rollbackEx.getMessage());
                        if (attempt < maxRetries) {
                            try {
                                Thread.sleep(200L * attempt);
                            } catch (InterruptedException ie) {
                                Thread.currentThread().interrupt();
                                break;
                            }
                        }
                    }
                }

                if (refundSuccess) {
                    savedTx.setStatus(TransactionStatus.FAILED);
                    savedTx.setDescription(savedTx.getDescription() + " (Đã hoàn tiền về ví người gửi do giao dịch lỗi)");
                } else {
                    log.error("CRITICAL ALARM: Saga Rollback FAILED after {} attempts for sender {}. Transaction ID: {}. Requires manual reconciliation!",
                            maxRetries, senderUserId, savedTx.getId());
                    savedTx.setStatus(TransactionStatus.COMPENSATING_FAILED);
                    savedTx.setDescription(savedTx.getDescription() + " (CẢNH BÁO: Trừ tiền thành công nhưng hoàn tiền thất bại)");
                }
            } else {
                savedTx.setStatus(TransactionStatus.FAILED);
            }

            return transactionRepository.save(savedTx);
        }
    }

    private WalletResponse fetchWallet(UUID userId, ErrorCode notFoundErrorCode) {
        try {
            ApiResponse<WalletResponse> res = walletClient.getWalletByUserId(userId);
            if (res != null && res.getResult() != null) {
                return res.getResult();
            }
        } catch (Exception e) {
            log.error("Error fetching wallet for userId {}: {}", userId, e.getMessage());
        }
        throw new AppException(notFoundErrorCode);
    }
}

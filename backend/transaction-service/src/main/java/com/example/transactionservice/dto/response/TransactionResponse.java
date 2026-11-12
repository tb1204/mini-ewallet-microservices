package com.example.transactionservice.dto.response;

import com.example.transactionservice.constants.TransactionStatus;
import com.example.transactionservice.constants.TransactionType;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TransactionResponse {
    private UUID id;
    private String transactionCode;
    private UUID senderWalletId;
    private UUID receiverWalletId;
    private TransactionType serviceType;
    private BigDecimal amount;
    private BigDecimal fee;
    private TransactionStatus status;
    private String description;
    private String idempotencyKey;
    private Instant createdAt;
}

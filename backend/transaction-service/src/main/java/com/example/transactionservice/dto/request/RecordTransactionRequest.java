package com.example.transactionservice.dto.request;

import com.example.transactionservice.constants.TransactionStatus;
import com.example.transactionservice.constants.TransactionType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Payload for recording an external transaction (Top-up, Withdraw, Utilities).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RecordTransactionRequest {

    @NotNull(message = "Loại giao dịch không được để trống")
    private TransactionType serviceType;

    @NotNull(message = "Số tiền không được để trống")
    @DecimalMin(value = "0.01", message = "Số tiền phải lớn hơn 0")
    private BigDecimal amount;

    private BigDecimal fee;

    private String description;

    private String idempotencyKey;

    private TransactionStatus status;
}


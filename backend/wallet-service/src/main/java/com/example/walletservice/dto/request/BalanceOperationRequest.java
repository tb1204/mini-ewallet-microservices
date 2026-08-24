package com.example.walletservice.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Internal Request payload used by Transaction Service / Saga Orchestrator for balance modification.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BalanceOperationRequest {

    @NotNull(message = "User ID không được để trống")
    private UUID userId;

    @NotNull(message = "Số tiền không được để trống")
    @DecimalMin(value = "0.01", message = "Số tiền phải lớn hơn 0")
    private BigDecimal amount;

    private String transactionId;
}

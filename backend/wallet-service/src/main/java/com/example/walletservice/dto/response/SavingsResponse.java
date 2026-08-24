package com.example.walletservice.dto.response;

import com.example.walletservice.constants.SavingsStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * Data Transfer Object representing savings account details and calculated interest.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SavingsResponse {

    private UUID id;
    private UUID walletId;
    private String title;
    private BigDecimal principalAmount;
    private BigDecimal interestRate;
    private Integer termMonths;
    private SavingsStatus status;
    private BigDecimal estimatedInterest;
    private BigDecimal totalPayout;
    private Instant createdAt;
    private Instant updatedAt;
}

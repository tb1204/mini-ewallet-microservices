package com.example.walletservice.dto.response;

import com.example.walletservice.constants.WalletStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * Data Transfer Object representing wallet details and balance.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WalletResponse {

    private UUID id;
    private UUID userId;
    private BigDecimal balance;
    private String currency;
    private WalletStatus status;
    private Instant createdAt;
    private Instant updatedAt;
}

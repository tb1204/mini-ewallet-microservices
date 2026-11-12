package com.example.transactionservice.dto.response;

import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WalletResponse {
    private UUID id;
    private UUID userId;
    private BigDecimal balance;
    private String currency;
    private String status;
    private Instant createdAt;
    private Instant updatedAt;
}

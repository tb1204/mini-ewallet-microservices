package com.example.walletservice.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

/**
 * Response DTO representing a linked bank account.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LinkedBankResponse {
    private UUID id;
    private UUID userId;
    private String bankCode;
    private String bankName;
    private String accountNumber;
    private String accountHolderName;
    private Integer isDefault; // 1: Mặc định, 0: Không mặc định
    private String status;
    private Instant createdAt;
}


package com.example.transactionservice.dto.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TransactionNotificationEvent implements Serializable {
    private static final long serialVersionUID = 1L;

    private UUID userId;
    private String title;
    private String detail;
    private String type;
    private BigDecimal amount;
    private String transactionId;
}


package com.example.walletservice.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "wallet_operations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WalletOperation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "operation_key", unique = true, nullable = false, length = 100)
    private String operationKey;

    @Column(name = "wallet_id", nullable = false)
    private UUID walletId;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal amount;

    @Column(name = "operation_type", nullable = false, length = 20)
    private String operationType; // DEDUCT, DEPOSIT

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;
}

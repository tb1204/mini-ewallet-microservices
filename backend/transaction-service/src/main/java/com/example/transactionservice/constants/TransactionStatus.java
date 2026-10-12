package com.example.transactionservice.constants;

public enum TransactionStatus {
    PENDING,
    SUCCESS,
    FAILED,
    COMPENSATING_FAILED, // Trừ tiền ví nguồn thành công nhưng hoàn tiền (bù trừ) thất bại
    CANCELLED
}

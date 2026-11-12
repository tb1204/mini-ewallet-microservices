package com.example.transactionservice.repository;

import com.example.transactionservice.entity.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, UUID> {

    Optional<Transaction> findByTransactionCode(String transactionCode);

    Optional<Transaction> findByIdempotencyKey(String idempotencyKey);

    @Query("SELECT t FROM Transaction t WHERE t.senderWalletId = :walletId OR t.receiverWalletId = :walletId ORDER BY t.createdAt DESC")
    List<Transaction> findAllByWalletId(@Param("walletId") UUID walletId);

    @Query("SELECT t FROM Transaction t WHERE " +
           "(:keyword IS NULL OR :keyword = '' OR " +
           "LOWER(t.transactionCode) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(t.description) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "t.idempotencyKey LIKE CONCAT('%', :keyword, '%')) AND " +
           "(:status IS NULL OR t.status = :status)")
    org.springframework.data.domain.Page<Transaction> searchTransactions(
            @Param("keyword") String keyword,
            @Param("status") com.example.transactionservice.constants.TransactionStatus status,
            org.springframework.data.domain.Pageable pageable);
}

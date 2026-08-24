package com.example.walletservice.repository;

import com.example.walletservice.entity.Wallet;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

/**
 * Repository interface providing persistence queries for Wallet entities.
 */
@Repository
public interface WalletRepository extends JpaRepository<Wallet, UUID> {

    /** Find wallet entity by user UUID. */
    Optional<Wallet> findByUserId(UUID userId);

    /** Check if a wallet exists for the given user UUID. */
    boolean existsByUserId(UUID userId);

    /** Acquire pessimistic write lock on wallet entity to prevent concurrent balance modifications. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT w FROM Wallet w WHERE w.userId = :userId")
    Optional<Wallet> findByUserIdWithLock(@Param("userId") UUID userId);
}

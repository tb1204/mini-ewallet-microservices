package com.example.walletservice.repository;

import com.example.walletservice.entity.LinkedBankAccount;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Spring Data JPA Repository for LinkedBankAccount entity.
 */
@Repository
public interface LinkedBankAccountRepository extends JpaRepository<LinkedBankAccount, UUID> {

    List<LinkedBankAccount> findByUserIdAndStatusOrderByIsDefaultDescCreatedAtDesc(UUID userId, String status);

    long countByUserIdAndStatus(UUID userId, String status);

    Optional<LinkedBankAccount> findByIdAndUserIdAndStatus(UUID id, UUID userId, String status);

    boolean existsByUserIdAndAccountNumberAndStatus(UUID userId, String accountNumber, String status);

    @Modifying
    @Query("UPDATE LinkedBankAccount b SET b.isDefault = false WHERE b.userId = :userId")
    void clearDefaultByUserId(@Param("userId") UUID userId);

    @Modifying
    @Query("DELETE FROM LinkedBankAccount b WHERE b.accountNumber IN ('1018766809', '9876543210', '0941888999')")
    void deleteSampleSeedAccounts();
}


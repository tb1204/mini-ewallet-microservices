package com.example.walletservice.repository;

import com.example.walletservice.constants.SavingsStatus;
import com.example.walletservice.entity.SavingsAccount;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository interface providing persistence queries for SavingsAccount entities.
 */
@Repository
public interface SavingsAccountRepository extends JpaRepository<SavingsAccount, UUID> {

    /** Find all savings accounts belonging to a specific wallet. */
    List<SavingsAccount> findByWalletId(UUID walletId);

    /** Find all savings accounts with specific status belonging to a wallet. */
    List<SavingsAccount> findByWalletIdAndStatus(UUID walletId, SavingsStatus status);

    /** Find savings account by ID and wallet ID. */
    Optional<SavingsAccount> findByIdAndWalletId(UUID id, UUID walletId);
}

package com.example.walletservice.repository;

import com.example.walletservice.entity.WalletOperation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface WalletOperationRepository extends JpaRepository<WalletOperation, Long> {

    boolean existsByOperationKey(String operationKey);

    Optional<WalletOperation> findByOperationKey(String operationKey);
}

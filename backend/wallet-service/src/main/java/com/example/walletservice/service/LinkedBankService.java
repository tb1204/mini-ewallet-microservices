package com.example.walletservice.service;

import com.example.walletservice.constants.ErrorCode;
import com.example.walletservice.dto.request.CreateLinkedBankRequest;
import com.example.walletservice.dto.response.LinkedBankResponse;
import com.example.walletservice.entity.LinkedBankAccount;
import com.example.walletservice.exception.AppException;
import com.example.walletservice.repository.LinkedBankAccountRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Service managing linked bank accounts for e-wallet users.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class LinkedBankService {

    private final LinkedBankAccountRepository linkedBankAccountRepository;

    @jakarta.annotation.PostConstruct
    @Transactional
    public void cleanupLegacySampleAccounts() {
        try {
            linkedBankAccountRepository.deleteSampleSeedAccounts();
            log.info("Cleaned up any legacy sample seed accounts.");
        } catch (Exception e) {
            log.debug("Notice on cleanup: {}", e.getMessage());
        }
    }

    /**
     * Retrieve all active linked bank accounts for a user.
     * Returns empty list if user has not linked any bank yet.
     */
    @Transactional(readOnly = true)
    public List<LinkedBankResponse> getLinkedBanks(UUID userId) {
        List<LinkedBankAccount> list = linkedBankAccountRepository
                .findByUserIdAndStatusOrderByIsDefaultDescCreatedAtDesc(userId, "ACTIVE");

        return list.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Link a new bank account for a user.
     */
    @Transactional
    public LinkedBankResponse linkBank(UUID userId, CreateLinkedBankRequest request) {
        boolean exists = linkedBankAccountRepository
                .existsByUserIdAndAccountNumberAndStatus(userId, request.getAccountNumber().trim(), "ACTIVE");
        if (exists) {
            throw new AppException(ErrorCode.LINKED_BANK_ALREADY_EXISTS);
        }

        // If user currently has 0 active accounts, this account automatically becomes default
        long activeCount = linkedBankAccountRepository.countByUserIdAndStatus(userId, "ACTIVE");
        boolean isDefault = (activeCount == 0) || (request.getIsDefault() != null && request.getIsDefault() == 1);

        if (isDefault) {
            linkedBankAccountRepository.clearDefaultByUserId(userId);
        }

        LinkedBankAccount entity = LinkedBankAccount.builder()
                .userId(userId)
                .bankCode(request.getBankCode().trim().toUpperCase())
                .bankName(request.getBankName().trim())
                .accountNumber(request.getAccountNumber().trim())
                .accountHolderName(request.getAccountHolderName().trim().toUpperCase())
                .isDefault(isDefault)
                .status("ACTIVE")
                .build();

        LinkedBankAccount saved = linkedBankAccountRepository.save(entity);
        log.info("User {} successfully linked bank account {} ({})", userId, saved.getAccountNumber(), saved.getBankName());
        return mapToResponse(saved);
    }

    /**
     * Set a linked bank account as default.
     */
    @Transactional
    public LinkedBankResponse setDefaultBank(UUID userId, UUID bankId) {
        LinkedBankAccount account = linkedBankAccountRepository
                .findByIdAndUserIdAndStatus(bankId, userId, "ACTIVE")
                .orElseThrow(() -> new AppException(ErrorCode.LINKED_BANK_NOT_FOUND));

        linkedBankAccountRepository.clearDefaultByUserId(userId);
        account.setDefault(true);
        LinkedBankAccount updated = linkedBankAccountRepository.save(account);

        return mapToResponse(updated);
    }

    /**
     * Unlink a bank account.
     */
    @Transactional
    public void unlinkBank(UUID userId, UUID bankId) {
        LinkedBankAccount account = linkedBankAccountRepository
                .findByIdAndUserIdAndStatus(bankId, userId, "ACTIVE")
                .orElseThrow(() -> new AppException(ErrorCode.LINKED_BANK_NOT_FOUND));

        account.setStatus("UNLINKED");
        account.setDefault(false);
        linkedBankAccountRepository.save(account);
        log.info("User {} unlinked bank account {}", userId, bankId);
    }

    private LinkedBankResponse mapToResponse(LinkedBankAccount entity) {
        return LinkedBankResponse.builder()
                .id(entity.getId())
                .userId(entity.getUserId())
                .bankCode(entity.getBankCode())
                .bankName(entity.getBankName())
                .accountNumber(entity.getAccountNumber())
                .accountHolderName(entity.getAccountHolderName())
                .isDefault(entity.isDefault() ? 1 : 0)
                .status(entity.getStatus())
                .createdAt(entity.getCreatedAt())
                .build();
    }
}

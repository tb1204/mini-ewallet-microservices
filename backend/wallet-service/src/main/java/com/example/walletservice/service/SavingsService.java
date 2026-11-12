package com.example.walletservice.service;

import com.example.walletservice.constants.ErrorCode;
import com.example.walletservice.constants.SavingsStatus;
import com.example.walletservice.constants.WalletStatus;
import com.example.walletservice.dto.request.DepositSavingsRequest;
import com.example.walletservice.dto.response.SavingsResponse;
import com.example.walletservice.entity.SavingsAccount;
import com.example.walletservice.entity.Wallet;
import com.example.walletservice.exception.AppException;
import com.example.walletservice.repository.SavingsAccountRepository;
import com.example.walletservice.repository.WalletRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Service managing user savings accounts: creation (deposit), withdrawal (with interest calculation), and inquiries.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class SavingsService {

    private final WalletRepository walletRepository;
    private final SavingsAccountRepository savingsAccountRepository;

    /**
     * Deposit funds from main wallet into a new savings account:
     * - Lock main wallet
     * - Verify wallet is active & has sufficient balance
     * - Deduct amount from main wallet
     * - Save new SavingsAccount record
     */
    @Transactional
    public SavingsResponse depositSavings(UUID userId, DepositSavingsRequest request) {
        log.info("Processing savings deposit of {} for user ID: {}", request.getAmount(), userId);

        Wallet wallet = walletRepository.findByUserIdWithLock(userId)
                .orElseThrow(() -> new AppException(ErrorCode.WALLET_NOT_FOUND));

        if (wallet.getStatus() != WalletStatus.ACTIVE) {
            throw new AppException(ErrorCode.WALLET_LOCKED);
        }

        if (wallet.getBalance().compareTo(request.getAmount()) < 0) {
            throw new AppException(ErrorCode.INSUFFICIENT_BALANCE);
        }

        // Deduct from main wallet balance
        wallet.setBalance(wallet.getBalance().subtract(request.getAmount()));
        walletRepository.save(wallet);

        // Resolve title
        String title = request.getTitle();
        if (!StringUtils.hasText(title)) {
            title = request.getTermMonths() == 0 
                    ? "Tiết kiệm Linh hoạt" 
                    : String.format("Tiết kiệm %d tháng", request.getTermMonths());
        }

        SavingsAccount savingsAccount = SavingsAccount.builder()
                .wallet(wallet)
                .title(title)
                .principalAmount(request.getAmount())
                .interestRate(request.getInterestRate())
                .termMonths(request.getTermMonths())
                .status(SavingsStatus.ACTIVE)
                .build();

        SavingsAccount savedSavings = savingsAccountRepository.save(savingsAccount);
        return mapToSavingsResponse(savedSavings);
    }

    /**
     * Withdraw/settle a savings account:
     * - Lock main wallet
     * - Find savings account and check status
     * - Calculate earned interest based on days active
     * - Add total payout (principal + interest) back to main wallet balance
     * - Mark savings account as WITHDRAWN
     */
    @Transactional
    public SavingsResponse withdrawSavings(UUID userId, UUID savingsId) {
        log.info("Processing savings withdrawal for savings ID: {} and user ID: {}", savingsId, userId);

        Wallet wallet = walletRepository.findByUserIdWithLock(userId)
                .orElseThrow(() -> new AppException(ErrorCode.WALLET_NOT_FOUND));

        SavingsAccount savings = savingsAccountRepository.findByIdAndWalletId(savingsId, wallet.getId())
                .orElseThrow(() -> new AppException(ErrorCode.SAVINGS_NOT_FOUND));

        if (savings.getStatus() == SavingsStatus.WITHDRAWN) {
            throw new AppException(ErrorCode.SAVINGS_ALREADY_WITHDRAWN);
        }

        BigDecimal interest = calculateEstimatedInterest(savings);
        BigDecimal totalPayout = savings.getPrincipalAmount().add(interest);

        // Add total payout back to main wallet
        wallet.setBalance(wallet.getBalance().add(totalPayout));
        walletRepository.save(wallet);

        // Mark savings account as WITHDRAWN
        savings.setStatus(SavingsStatus.WITHDRAWN);
        SavingsAccount updatedSavings = savingsAccountRepository.save(savings);

        SavingsResponse response = mapToSavingsResponse(updatedSavings);
        response.setEstimatedInterest(interest);
        response.setTotalPayout(totalPayout);
        return response;
    }

    /**
     * Get all active & withdrawn savings accounts belonging to the current user.
     */
    @Transactional(readOnly = true)
    public List<SavingsResponse> getMySavingsAccounts(UUID userId) {
        Wallet wallet = walletRepository.findByUserId(userId)
                .orElseThrow(() -> new AppException(ErrorCode.WALLET_NOT_FOUND));

        List<SavingsAccount> accounts = savingsAccountRepository.findByWalletId(wallet.getId());
        return accounts.stream()
                .map(this::mapToSavingsResponse)
                .toList();
    }

    /**
     * Calculate estimated interest earned up to current moment:
     * Formula: Principal * (InterestRate / 100) * (DaysActive / 365)
     */
    private BigDecimal calculateEstimatedInterest(SavingsAccount savings) {
        long daysActive = Math.max(1, Duration.between(savings.getCreatedAt(), Instant.now()).toDays());
        BigDecimal rateFraction = savings.getInterestRate().divide(BigDecimal.valueOf(100), 6, RoundingMode.HALF_UP);
        BigDecimal timeFraction = BigDecimal.valueOf(daysActive).divide(BigDecimal.valueOf(365), 6, RoundingMode.HALF_UP);

        return savings.getPrincipalAmount()
                .multiply(rateFraction)
                .multiply(timeFraction)
                .setScale(2, RoundingMode.HALF_UP);
    }

    /** Map SavingsAccount entity to SavingsResponse DTO. */
    public SavingsResponse mapToSavingsResponse(SavingsAccount savings) {
        BigDecimal interest = calculateEstimatedInterest(savings);
        BigDecimal totalPayout = savings.getPrincipalAmount().add(interest);

        return SavingsResponse.builder()
                .id(savings.getId())
                .walletId(savings.getWallet().getId())
                .title(savings.getTitle())
                .principalAmount(savings.getPrincipalAmount())
                .interestRate(savings.getInterestRate())
                .termMonths(savings.getTermMonths())
                .status(savings.getStatus())
                .estimatedInterest(interest)
                .totalPayout(totalPayout)
                .createdAt(savings.getCreatedAt())
                .updatedAt(savings.getUpdatedAt())
                .build();
    }
}

package com.example.walletservice.controller;

import com.example.walletservice.dto.request.DepositSavingsRequest;
import com.example.walletservice.dto.response.ApiResponse;
import com.example.walletservice.dto.response.SavingsResponse;
import com.example.walletservice.service.SavingsService;
import com.example.walletservice.util.SecurityUtil;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * REST Controller exposing savings account management APIs (deposit, withdraw, inquiry).
 */
@RestController
@RequestMapping("/api/v1/savings")
@RequiredArgsConstructor
@Slf4j
public class SavingsController {

    private final SavingsService savingsService;

    /**
     * Open/deposit a new savings account using funds from current user's wallet.
     */
    @PostMapping
    public ResponseEntity<ApiResponse<SavingsResponse>> depositSavings(@Valid @RequestBody DepositSavingsRequest request) {
        UUID currentUserId = SecurityUtil.getCurrentUserId();
        SavingsResponse response = savingsService.depositSavings(currentUserId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(
                ApiResponse.<SavingsResponse>builder()
                        .message("Gửi tiết kiệm thành công")
                        .result(response)
                        .build()
        );
    }

    /**
     * Withdraw/settle an active savings account and return principal + interest to current user's wallet.
     */
    @PostMapping("/{savingsId}/withdraw")
    public ResponseEntity<ApiResponse<SavingsResponse>> withdrawSavings(@PathVariable UUID savingsId) {
        UUID currentUserId = SecurityUtil.getCurrentUserId();
        SavingsResponse response = savingsService.withdrawSavings(currentUserId, savingsId);
        return ResponseEntity.ok(
                ApiResponse.<SavingsResponse>builder()
                        .message("Rút/Tất toán sổ tiết kiệm thành công")
                        .result(response)
                        .build()
        );
    }

    /**
     * Retrieve all savings accounts belonging to current authenticated user.
     */
    @GetMapping("/me")
    public ResponseEntity<ApiResponse<List<SavingsResponse>>> getMySavingsAccounts() {
        UUID currentUserId = SecurityUtil.getCurrentUserId();
        List<SavingsResponse> response = savingsService.getMySavingsAccounts(currentUserId);
        return ResponseEntity.ok(
                ApiResponse.<List<SavingsResponse>>builder()
                        .result(response)
                        .build()
        );
    }
}

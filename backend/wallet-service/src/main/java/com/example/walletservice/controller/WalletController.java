package com.example.walletservice.controller;

import com.example.walletservice.dto.request.BalanceOperationRequest;
import com.example.walletservice.dto.request.CreateWalletRequest;
import com.example.walletservice.dto.request.TopUpRequest;
import com.example.walletservice.dto.request.WithdrawRequest;
import com.example.walletservice.dto.response.ApiResponse;
import com.example.walletservice.dto.response.WalletResponse;
import com.example.walletservice.service.WalletService;
import com.example.walletservice.util.SecurityUtil;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * REST Controller exposing public, authenticated, and inter-service wallet management APIs.
 */
@RestController
@RequestMapping("/api/v1/wallets")
@RequiredArgsConstructor
@Slf4j
public class WalletController {

    private final WalletService walletService;

    /**
     * Create a new wallet for a user.
     */
    @PostMapping
    public ResponseEntity<ApiResponse<WalletResponse>> createWallet(@Valid @RequestBody CreateWalletRequest request) {
        WalletResponse response = walletService.createWallet(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(
                ApiResponse.<WalletResponse>builder()
                        .message("Tạo ví điện tử thành công")
                        .result(response)
                        .build()
        );
    }

    /**
     * Retrieve wallet details for the current authenticated user.
     */
    @GetMapping("/me")
    public ResponseEntity<ApiResponse<WalletResponse>> getMyWallet() {
        UUID currentUserId = SecurityUtil.getCurrentUserId();
        WalletResponse response = walletService.getWalletByUserId(currentUserId);
        return ResponseEntity.ok(
                ApiResponse.<WalletResponse>builder()
                        .result(response)
                        .build()
        );
    }

    /**
     * Retrieve wallet details by target user UUID.
     */
    @GetMapping("/user/{userId}")
    public ResponseEntity<ApiResponse<WalletResponse>> getWalletByUserId(@PathVariable UUID userId) {
        WalletResponse response = walletService.getWalletByUserId(userId);
        return ResponseEntity.ok(
                ApiResponse.<WalletResponse>builder()
                        .result(response)
                        .build()
        );
    }

    /**
     * Top-up funds into current authenticated user's wallet.
     */
    @PostMapping("/top-up")
    public ResponseEntity<ApiResponse<WalletResponse>> topUp(@Valid @RequestBody TopUpRequest request) {
        UUID currentUserId = SecurityUtil.getCurrentUserId();
        WalletResponse response = walletService.topUp(currentUserId, request);
        return ResponseEntity.ok(
                ApiResponse.<WalletResponse>builder()
                        .message("Nạp tiền vào ví thành công")
                        .result(response)
                        .build()
        );
    }

    /**
     * Withdraw funds from current authenticated user's wallet.
     */
    @PostMapping("/withdraw")
    public ResponseEntity<ApiResponse<WalletResponse>> withdraw(@Valid @RequestBody WithdrawRequest request) {
        UUID currentUserId = SecurityUtil.getCurrentUserId();
        WalletResponse response = walletService.withdraw(currentUserId, request);
        return ResponseEntity.ok(
                ApiResponse.<WalletResponse>builder()
                        .message("Rút tiền khỏi ví thành công")
                        .result(response)
                        .build()
        );
    }

    /**
     * Inter-service Endpoint: Deposit funds into target wallet (Saga Pattern).
     */
    @PostMapping("/internal/deposit")
    public ResponseEntity<ApiResponse<WalletResponse>> depositInternal(@Valid @RequestBody BalanceOperationRequest request) {
        WalletResponse response = walletService.depositInternal(request);
        return ResponseEntity.ok(
                ApiResponse.<WalletResponse>builder()
                        .message("Nạp tiền nội bộ thành công")
                        .result(response)
                        .build()
        );
    }

    /**
     * Inter-service Endpoint: Deduct funds from source wallet (Saga Pattern).
     */
    @PostMapping("/internal/deduct")
    public ResponseEntity<ApiResponse<WalletResponse>> deductInternal(@Valid @RequestBody BalanceOperationRequest request) {
        WalletResponse response = walletService.deductInternal(request);
        return ResponseEntity.ok(
                ApiResponse.<WalletResponse>builder()
                        .message("Trừ tiền nội bộ thành công")
                        .result(response)
                        .build()
        );
    }
}

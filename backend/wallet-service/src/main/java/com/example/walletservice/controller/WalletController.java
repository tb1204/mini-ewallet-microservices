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
     * Inter-service Endpoint: Retrieve wallet details by user UUID (Internal API).
     */
    @GetMapping("/internal/user/{userId}")
    public ResponseEntity<ApiResponse<WalletResponse>> getWalletByUserIdInternal(@PathVariable UUID userId) {
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

    /**
     * Admin/Staff Query: Retrieve paginated wallets with search and status filtering.
     */
    @GetMapping
    public ResponseEntity<ApiResponse<java.util.List<WalletResponse>>> getAllWallets(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) com.example.walletservice.constants.WalletStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "100") int size,
            @RequestParam(defaultValue = "createdAt,desc") String sort) {

        String[] sortParts = sort.split(",");
        String sortField = sortParts[0];
        org.springframework.data.domain.Sort.Direction direction = sortParts.length > 1 && sortParts[1].equalsIgnoreCase("asc")
                ? org.springframework.data.domain.Sort.Direction.ASC
                : org.springframework.data.domain.Sort.Direction.DESC;

        org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(page, size, org.springframework.data.domain.Sort.by(direction, sortField));
        org.springframework.data.domain.Page<WalletResponse> walletPage = walletService.getAllWallets(keyword, status, pageable);

        return ResponseEntity.ok(
                ApiResponse.<java.util.List<WalletResponse>>builder()
                        .message("Lấy danh sách ví điện tử thành công")
                        .result(walletPage.getContent())
                        .build()
        );
    }

    /**
     * Admin Action: Toggle or update wallet status.
     */
    @PutMapping("/{id}/status")
    public ResponseEntity<ApiResponse<WalletResponse>> updateWalletStatus(
            @PathVariable UUID id,
            @RequestParam(required = false) com.example.walletservice.constants.WalletStatus status) {
        WalletResponse response = (status != null) 
                ? walletService.updateWalletStatus(id, status)
                : walletService.toggleWalletStatus(id);

        return ResponseEntity.ok(
                ApiResponse.<WalletResponse>builder()
                        .message("Cập nhật trạng thái ví thành công")
                        .result(response)
                        .build()
        );
    }
}

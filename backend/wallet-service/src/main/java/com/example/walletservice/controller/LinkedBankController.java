package com.example.walletservice.controller;

import com.example.walletservice.dto.request.CreateLinkedBankRequest;
import com.example.walletservice.dto.response.ApiResponse;
import com.example.walletservice.dto.response.LinkedBankResponse;
import com.example.walletservice.service.LinkedBankService;
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
 * REST Controller exposing APIs for managing linked bank accounts.
 */
@RestController
@RequestMapping("/api/v1/wallets/linked-banks")
@RequiredArgsConstructor
@Slf4j
public class LinkedBankController {

    private final LinkedBankService linkedBankService;

    /**
     * Retrieve all active linked bank accounts for current authenticated user.
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<LinkedBankResponse>>> getLinkedBanks() {
        UUID currentUserId = SecurityUtil.getCurrentUserId();
        List<LinkedBankResponse> response = linkedBankService.getLinkedBanks(currentUserId);
        return ResponseEntity.ok(
                ApiResponse.<List<LinkedBankResponse>>builder()
                        .message("Lấy danh sách ngân hàng liên kết thành công")
                        .result(response)
                        .build()
        );
    }

    /**
     * Link a new bank account to wallet.
     */
    @PostMapping
    public ResponseEntity<ApiResponse<LinkedBankResponse>> linkBank(
            @Valid @RequestBody CreateLinkedBankRequest request
    ) {
        UUID currentUserId = SecurityUtil.getCurrentUserId();
        LinkedBankResponse response = linkedBankService.linkBank(currentUserId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(
                ApiResponse.<LinkedBankResponse>builder()
                        .message("Liên kết tài khoản ngân hàng thành công")
                        .result(response)
                        .build()
        );
    }

    /**
     * Set a linked bank account as default.
     */
    @PatchMapping("/{id}/default")
    public ResponseEntity<ApiResponse<LinkedBankResponse>> setDefaultBank(@PathVariable UUID id) {
        UUID currentUserId = SecurityUtil.getCurrentUserId();
        LinkedBankResponse response = linkedBankService.setDefaultBank(currentUserId, id);
        return ResponseEntity.ok(
                ApiResponse.<LinkedBankResponse>builder()
                        .message("Đặt ngân hàng mặc định thành công")
                        .result(response)
                        .build()
        );
    }

    /**
     * Unlink a bank account.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> unlinkBank(@PathVariable UUID id) {
        UUID currentUserId = SecurityUtil.getCurrentUserId();
        linkedBankService.unlinkBank(currentUserId, id);
        return ResponseEntity.ok(
                ApiResponse.<Void>builder()
                        .message("Hủy liên kết tài khoản ngân hàng thành công")
                        .build()
        );
    }
}


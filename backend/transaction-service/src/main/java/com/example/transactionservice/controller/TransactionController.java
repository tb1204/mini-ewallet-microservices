package com.example.transactionservice.controller;

import com.example.transactionservice.constants.AppConstants;
import com.example.transactionservice.dto.request.CreateTransferRequest;
import com.example.transactionservice.dto.response.ApiResponse;
import com.example.transactionservice.dto.response.TransactionResponse;
import com.example.transactionservice.service.TransactionService;
import com.example.transactionservice.util.SecurityUtil;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/transactions")
@RequiredArgsConstructor
@Slf4j
public class TransactionController {

    private final TransactionService transactionService;

    /**
     * Execute P2P Money Transfer from current authenticated user to recipient.
     */
    @PostMapping("/transfer")
    public ResponseEntity<ApiResponse<TransactionResponse>> transferMoney(
            @RequestHeader(AppConstants.HEADER_AUTHORIZATION) String authHeader,
            @Valid @RequestBody CreateTransferRequest request) {
        UUID currentUserId = SecurityUtil.getCurrentUserId();
        TransactionResponse response = transactionService.transferMoney(currentUserId, authHeader, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(
                ApiResponse.<TransactionResponse>builder()
                        .message("Chuyển tiền thành công")
                        .result(response)
                        .data(response)
                        .build()
        );
    }

    /**
     * Retrieve transaction history for current authenticated user's wallet.
     */
    @GetMapping("/history")
    public ResponseEntity<ApiResponse<List<TransactionResponse>>> getMyTransactionHistory() {
        UUID currentUserId = SecurityUtil.getCurrentUserId();
        List<TransactionResponse> response = transactionService.getMyTransactionHistory(currentUserId);
        return ResponseEntity.ok(
                ApiResponse.<List<TransactionResponse>>builder()
                        .message("Lấy lịch sử giao dịch thành công")
                        .result(response)
                        .data(response)
                        .build()
        );
    }

    /**
     * Retrieve transaction detail by transaction UUID.
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<TransactionResponse>> getTransactionById(@PathVariable UUID id) {
        TransactionResponse response = transactionService.getTransactionById(id);
        return ResponseEntity.ok(
                ApiResponse.<TransactionResponse>builder()
                        .message("Lấy thông tin giao dịch thành công")
                        .result(response)
                        .data(response)
                        .build()
        );
    }

    /**
     * Retrieve transaction detail by transaction Code.
     */
    @GetMapping("/code/{code}")
    public ResponseEntity<ApiResponse<TransactionResponse>> getTransactionByCode(@PathVariable String code) {
        TransactionResponse response = transactionService.getTransactionByCode(code);
        return ResponseEntity.ok(
                ApiResponse.<TransactionResponse>builder()
                        .message("Lấy thông tin giao dịch thành công")
                        .result(response)
                        .data(response)
                        .build()
        );
    }
}

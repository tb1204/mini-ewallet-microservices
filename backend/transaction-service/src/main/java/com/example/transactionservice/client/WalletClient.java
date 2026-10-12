package com.example.transactionservice.client;

import com.example.transactionservice.config.FeignClientConfig;
import com.example.transactionservice.dto.request.BalanceOperationRequest;
import com.example.transactionservice.dto.response.ApiResponse;
import com.example.transactionservice.dto.response.WalletResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

import java.util.UUID;

@FeignClient(name = "wallet-service", url = "${wallet.service.url:http://localhost:8082}", configuration = FeignClientConfig.class)
public interface WalletClient {

    @GetMapping("/api/v1/wallets/internal/user/{userId}")
    ApiResponse<WalletResponse> getWalletByUserId(@PathVariable("userId") UUID userId);

    @PostMapping("/api/v1/wallets/internal/deduct")
    ApiResponse<WalletResponse> deductInternal(@RequestBody BalanceOperationRequest request);

    @PostMapping("/api/v1/wallets/internal/deposit")
    ApiResponse<WalletResponse> depositInternal(@RequestBody BalanceOperationRequest request);
}

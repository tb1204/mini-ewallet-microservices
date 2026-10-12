package com.example.transactionservice.client;

import com.example.transactionservice.dto.request.VerifyPinRequest;
import com.example.transactionservice.dto.response.ApiResponse;
import com.example.transactionservice.dto.response.UserResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;

import java.util.UUID;

@FeignClient(name = "identity-service", url = "${identity.service.url:http://localhost:8081}")
public interface IdentityClient {

    @GetMapping("/api/v1/users/search/{identifier}")
    ApiResponse<UserResponse> findUserByIdentifier(@PathVariable("identifier") String identifier);

    @GetMapping("/api/v1/users/{userId}")
    ApiResponse<UserResponse> getUserById(@PathVariable("userId") UUID userId);

    @PostMapping("/api/v1/auth/verify-pin")
    ApiResponse<Boolean> verifyPin(@RequestHeader("Authorization") String token, @RequestBody VerifyPinRequest request);
}

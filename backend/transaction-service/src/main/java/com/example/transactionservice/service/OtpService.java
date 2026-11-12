package com.example.transactionservice.service;

import com.example.transactionservice.client.AuditClient;
import com.example.transactionservice.client.IdentityClient;
import com.example.transactionservice.config.RabbitMQConfig;
import com.example.transactionservice.constants.ErrorCode;
import com.example.transactionservice.dto.response.ApiResponse;
import com.example.transactionservice.dto.response.SendOtpResponse;
import com.example.transactionservice.dto.response.UserResponse;
import com.example.transactionservice.exception.AppException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
@Slf4j
public class OtpService {

    public static final int OTP_VALIDITY_SECONDS = 120; // 120 seconds countdown
    public static final BigDecimal DEFAULT_OTP_THRESHOLD = new BigDecimal("2000000"); // 2,000,000 VNĐ

    private final IdentityClient identityClient;
    private final AuditClient auditClient;
    private final RabbitTemplate rabbitTemplate;

    private record OtpRecord(String code, Instant expiresAt, BigDecimal amount) {}
    private final Map<UUID, OtpRecord> otpStore = new ConcurrentHashMap<>();
    private final SecureRandom secureRandom = new SecureRandom();

    /**
     * Get the dynamic OTP Threshold from audit-service system configurations.
     */
    public BigDecimal getOtpThreshold() {
        try {
            ApiResponse<Map<String, Object>> res = auditClient.getConfigByKey("OTP_THRESHOLD");
            if (res != null && res.getResult() != null && res.getResult().get("value") != null) {
                return new BigDecimal(res.getResult().get("value").toString());
            }
        } catch (Exception e) {
            log.warn("Could not query dynamic OTP_THRESHOLD from audit-service, using default {}: {}", 
                    DEFAULT_OTP_THRESHOLD, e.getMessage());
        }
        return DEFAULT_OTP_THRESHOLD;
    }

    /**
     * Generate 6-digit OTP, cache with 120s TTL, and dispatch email via RabbitMQ to notification-service.
     */
    public SendOtpResponse sendTransactionOtp(UUID userId, BigDecimal amount) {
        log.info("Requesting Transaction OTP for user: {}, amount: {}", userId, amount);

        // Fetch User details for email & name
        UserResponse user;
        try {
            ApiResponse<UserResponse> userRes = identityClient.getUserById(userId);
            if (userRes == null || userRes.getResult() == null) {
                throw new AppException(ErrorCode.UNAUTHORIZED);
            }
            user = userRes.getResult();
        } catch (AppException e) {
            throw e;
        } catch (Exception e) {
            log.error("Failed to query user info for OTP: {}", e.getMessage());
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        String email = user.getEmail();
        if (email == null || email.isBlank()) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        // Generate 6-digit numeric OTP code
        String otpCode = String.format("%06d", secureRandom.nextInt(1_000_000));
        Instant expiresAt = Instant.now().plusSeconds(OTP_VALIDITY_SECONDS);

        // Store OTP in cache
        otpStore.put(userId, new OtpRecord(otpCode, expiresAt, amount));

        // Dispatch message to RabbitMQ -> notification-service
        try {
            Map<String, Object> message = new HashMap<>();
            message.put("userId", userId.toString());
            message.put("email", email);
            message.put("fullName", user.getFullName());
            message.put("otpCode", otpCode);
            message.put("amount", amount);
            message.put("expiresInSeconds", OTP_VALIDITY_SECONDS);

            rabbitTemplate.convertAndSend(
                    RabbitMQConfig.EXCHANGE,
                    RabbitMQConfig.TX_OTP_EMAIL_ROUTING_KEY,
                    message
            );
            log.info("Dispatched TransactionOtpEvent to RabbitMQ for {}", email);
        } catch (Exception e) {
            log.error("Failed to publish OTP event to RabbitMQ: {}", e.getMessage());
        }

        // Print prominent developer log for easy test verification
        log.info("=================================================");
        log.info("   [TRANSACTION OTP CODE - 120s COUNTDOWN]");
        log.info("   User: {}", email);
        log.info("   Amount: %,d VNĐ", amount.longValue());
        log.info("   >>> OTP: {} <<<", otpCode);
        log.info("=================================================");

        return SendOtpResponse.builder()
                .message("Mã OTP xác thực đã được gửi về email của bạn (hiệu lực 120 giây)")
                .maskedEmail(maskEmail(email))
                .expiresInSeconds(OTP_VALIDITY_SECONDS)
                .otpRequired(true)
                .build();
    }

    /**
     * Verify submitted OTP against stored active OTP.
     */
    public boolean verifyOtp(UUID userId, String submittedOtp) {
        if (submittedOtp == null || submittedOtp.isBlank()) {
            return false;
        }

        OtpRecord record = otpStore.get(userId);
        if (record == null) {
            log.warn("No active OTP found in store for user: {}", userId);
            return false;
        }

        if (Instant.now().isAfter(record.expiresAt())) {
            log.warn("OTP for user {} has expired (>120s)", userId);
            otpStore.remove(userId);
            return false;
        }

        if (record.code().equals(submittedOtp.trim())) {
            log.info("OTP verified successfully for user: {}", userId);
            otpStore.remove(userId); // One-time use: invalidate immediately
            return true;
        }

        log.warn("Invalid OTP submitted for user: {}", userId);
        return false;
    }

    /**
     * Mask email for secure UI display (e.g., trancong***@gmail.com)
     */
    public String maskEmail(String email) {
        if (email == null || !email.contains("@")) return email;
        String[] parts = email.split("@");
        String name = parts[0];
        String domain = parts[1];
        if (name.length() <= 3) {
            return name.charAt(0) + "***@" + domain;
        }
        return name.substring(0, 3) + "***" + name.charAt(name.length() - 1) + "@" + domain;
    }
}


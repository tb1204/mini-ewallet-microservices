package com.example.identityservice.service;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * In-memory thread-safe OTP management service for sensitive operations (PIN reset).
 * OTPs expire after 5 minutes and can only be used once.
 */
@Service
@Slf4j
public class OtpService {

    private static final long OTP_VALID_DURATION_MS = 5 * 60 * 1000; // 5 minutes validity
    private final SecureRandom secureRandom = new SecureRandom();

    @Getter
    @Setter
    @AllArgsConstructor
    private static class OtpEntry {
        private final String code;
        private final long expiryTime;
        private boolean verified;
    }

    private final Map<UUID, OtpEntry> otpStore = new ConcurrentHashMap<>();

    /**
     * Generates a cryptographically secure 6-digit OTP for the given user.
     */
    public String generateOtp(UUID userId) {
        int number = secureRandom.nextInt(1_000_000);
        String otp = String.format("%06d", number);
        long expiry = System.currentTimeMillis() + OTP_VALID_DURATION_MS;

        otpStore.put(userId, new OtpEntry(otp, expiry, false));
        log.info("Generated new 6-digit OTP for userId: {} (Expires in 5 minutes)", userId);
        return otp;
    }

    /**
     * Validates an OTP code entered by the user. If valid, marks it as verified.
     */
    public boolean verifyOtp(UUID userId, String code) {
        OtpEntry entry = otpStore.get(userId);
        if (entry == null) {
            log.warn("No OTP entry found for userId: {}", userId);
            return false;
        }

        if (System.currentTimeMillis() > entry.getExpiryTime()) {
            log.warn("OTP for userId: {} has expired", userId);
            otpStore.remove(userId);
            return false;
        }

        if (entry.getCode().equals(code)) {
            entry.setVerified(true);
            log.info("OTP verified successfully for userId: {}", userId);
            return true;
        }

        log.warn("OTP mismatch for userId: {}", userId);
        return false;
    }

    /**
     * Checks if the user has successfully verified the given OTP and it hasn't expired.
     */
    public boolean isVerified(UUID userId, String code) {
        OtpEntry entry = otpStore.get(userId);
        if (entry == null) {
            return false;
        }
        return entry.isVerified() && entry.getCode().equals(code) && System.currentTimeMillis() <= entry.getExpiryTime();
    }

    /**
     * Invalidates and clears the OTP after successful PIN reset.
     */
    public void clearOtp(UUID userId) {
        otpStore.remove(userId);
        log.info("Cleared OTP entry for userId: {}", userId);
    }
}


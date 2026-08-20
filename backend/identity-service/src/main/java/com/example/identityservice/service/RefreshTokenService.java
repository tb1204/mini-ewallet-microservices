package com.example.identityservice.service;

import com.example.identityservice.constants.ErrorCode;
import com.example.identityservice.entity.RefreshToken;
import com.example.identityservice.entity.User;
import com.example.identityservice.exception.AppException;
import com.example.identityservice.repositories.RefreshTokenRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

/**
 * Service managing lifecycle of long-lived Refresh Tokens (creation, lookup, expiration verification, and revocation).
 */
@Service
@RequiredArgsConstructor
public class RefreshTokenService {

    // Refresh token lifetime in milliseconds (default 7 days = 604,800,000 ms)
    @Value("${jwt.refresh-token.expiration:604800000}")
    private long refreshTokenExpirationInMs;

    private final RefreshTokenRepository refreshTokenRepository;

    /**
     * Generate and persist a new 7-day Refresh Token for user:
     * - Revoke any existing active refresh token for this user
     * - Generate a unique random UUID string token
     * - Calculate expiration time and persist to Database
     */
    @Transactional
    public RefreshToken createRefreshToken(User user) {
        // Revoke existing refresh token to maintain a single active refresh token per user
        refreshTokenRepository.deleteByUser(user);

        RefreshToken refreshToken = RefreshToken.builder()
                .user(user)
                .token(UUID.randomUUID().toString())
                .expiresAt(Instant.now().plusMillis(refreshTokenExpirationInMs))
                .build();

        return refreshTokenRepository.save(refreshToken);
    }

    /**
     * Find RefreshToken by token string or throw REFRESH_TOKEN_NOT_FOUND exception.
     */
    public RefreshToken findByToken(String token) {
        return refreshTokenRepository.findByToken(token)
                .orElseThrow(() -> new AppException(ErrorCode.REFRESH_TOKEN_NOT_FOUND));
    }

    /**
     * Verify token expiration date:
     * - If expired, delete token from DB and throw REFRESH_TOKEN_EXPIRED exception
     */
    @Transactional
    public RefreshToken verifyExpiration(RefreshToken token) {
        if (token.getExpiresAt().isBefore(Instant.now())) {
            refreshTokenRepository.delete(token);
            throw new AppException(ErrorCode.REFRESH_TOKEN_EXPIRED);
        }
        return token;
    }

    /**
     * Revoke all refresh tokens owned by user (used during logout).
     */
    @Transactional
    public void deleteByUserId(User user) {
        refreshTokenRepository.deleteByUser(user);
    }
}


package com.example.identityservice.service;

import com.example.identityservice.constants.ErrorCode;
import com.example.identityservice.constants.KycStatus;
import com.example.identityservice.constants.Role;
import com.example.identityservice.dto.request.*;
import com.example.identityservice.dto.response.AuthResponse;
import com.example.identityservice.dto.response.UserResponse;
import com.example.identityservice.entity.RefreshToken;
import com.example.identityservice.entity.User;
import com.example.identityservice.exception.AppException;
import com.example.identityservice.repositories.UserRepository;
import com.example.identityservice.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/**
 * Core Authentication Service handling user registration, login, token refreshing, transaction PIN verification, and logout.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;
    private final RefreshTokenService refreshTokenService;

    /**
     * Register a new user profile:
     * - Validate unique fields (username, email, phone number)
     * - Hash password and optional transaction PIN using BCrypt
     * - Persist user entity to Database
     * - Generate initial Access Token (JWT) & Refresh Token pair
     */
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        log.info("Registering new user: {}", request.getUsername());

        // 1. Check for field uniqueness conflicts
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new AppException(ErrorCode.USER_EXISTED);
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new AppException(ErrorCode.EMAIL_EXISTED);
        }
        if (userRepository.existsByPhoneNumber(request.getPhoneNumber())) {
            throw new AppException(ErrorCode.PHONE_EXISTED);
        }

        // 2. Build User entity with BCrypt encrypted password & PIN
        User user = User.builder()
                .username(request.getUsername())
                .email(request.getEmail())
                .phoneNumber(request.getPhoneNumber())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .pinHash(request.getPin() != null ? passwordEncoder.encode(request.getPin()) : null)
                .fullName(request.getFullName())
                .role(Role.ROLE_USER)
                .avatarUrl(request.getAvatarUrl() != null ? request.getAvatarUrl() : "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80")
                .kycStatus(KycStatus.VERIFIED)
                .isActive(true)
                .build();

        User savedUser = userRepository.save(user);

        // 3. Issue short-lived JWT Access Token and persistent Refresh Token
        String accessToken = tokenProvider.generateAccessToken(savedUser.getId(), savedUser.getUsername(), savedUser.getRole().name());
        RefreshToken refreshToken = refreshTokenService.createRefreshToken(savedUser);

        // 4. Return complete authentication payload
        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken.getToken())
                .tokenType("Bearer")
                .expiresIn(tokenProvider.getExpirationInMs() / 1000)
                .user(mapToUserResponse(savedUser))
                .build();
    }

    /**
     * Authenticate user login credentials:
     * - Look up user by username or email
     * - Verify account active status
     * - Compare BCrypt password hash
     * - Issue new authentication token pair
     */
    @Transactional
    public AuthResponse login(LoginRequest request) {
        log.info("Authenticating user: {}", request.getUsernameOrEmail());

        // 1. Retrieve user by username or email
        User user = userRepository.findByUsernameOrEmail(request.getUsernameOrEmail(), request.getUsernameOrEmail())
                .orElseThrow(() -> new AppException(ErrorCode.INVALID_CREDENTIALS));

        // 2. Ensure account is not locked/inactive
        if (!Boolean.TRUE.equals(user.getIsActive())) {
            throw new AppException(ErrorCode.UNAUTHORIZED, "Tài khoản của bạn đã bị khóa");
        }

        // 3. Validate password match
        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new AppException(ErrorCode.INVALID_CREDENTIALS);
        }

        // 4. Issue new token pair
        String accessToken = tokenProvider.generateAccessToken(user.getId(), user.getUsername(), user.getRole().name());
        RefreshToken refreshToken = refreshTokenService.createRefreshToken(user);

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken.getToken())
                .tokenType("Bearer")
                .expiresIn(tokenProvider.getExpirationInMs() / 1000)
                .user(mapToUserResponse(user))
                .build();
    }

    /**
     * Issue a new Access Token & new Refresh Token (Refresh Token Rotation - Sliding Expiration):
     * - Verify current Refresh Token expiration
     * - Generate new Access Token
     * - Rotate & extend Refresh Token (revokes old token and issues a new 7-day token)
     */
    @Transactional
    public AuthResponse refreshToken(RefreshTokenRequest request) {
        // 1. Locate Refresh Token in DB and check expiration
        RefreshToken refreshToken = refreshTokenService.findByToken(request.getRefreshToken());
        refreshTokenService.verifyExpiration(refreshToken);

        User user = refreshToken.getUser();

        // 2. Generate new Access Token for associated user
        String newAccessToken = tokenProvider.generateAccessToken(user.getId(), user.getUsername(), user.getRole().name());

        // 3. Refresh Token Rotation: Rotate & issue a new 7-day Refresh Token (revoking the old one)
        RefreshToken newRefreshToken = refreshTokenService.createRefreshToken(user);

        return AuthResponse.builder()
                .accessToken(newAccessToken)
                .refreshToken(newRefreshToken.getToken())
                .tokenType("Bearer")
                .expiresIn(tokenProvider.getExpirationInMs() / 1000)
                .user(mapToUserResponse(user))
                .build();
    }

    /**
     * Verify user's 6-digit transaction PIN before executing sensitive financial operations.
     */
    public boolean verifyPin(UUID userId, VerifyPinRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        // Verify that transaction PIN has been set up
        if (user.getPinHash() == null) {
            throw new AppException(ErrorCode.INVALID_PIN, "Tài khoản chưa thiết lập mã PIN giao dịch");
        }

        // Verify PIN hash using BCrypt
        boolean isMatch = passwordEncoder.matches(request.getPin(), user.getPinHash());
        if (!isMatch) {
            throw new AppException(ErrorCode.INVALID_PIN);
        }
        return true;
    }

    /**
     * Set up or update user's 6-digit transaction PIN.
     */
    @Transactional
    public void changePin(UUID userId, ChangePinRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        // If user already has a PIN, verify the old PIN first
        if (user.getPinHash() != null) {
            if (request.getOldPin() == null || request.getOldPin().isBlank()) {
                throw new AppException(ErrorCode.INVALID_PIN, "Vui lòng nhập mã PIN hiện tại");
            }
            if (!passwordEncoder.matches(request.getOldPin(), user.getPinHash())) {
                throw new AppException(ErrorCode.INVALID_PIN, "Mã PIN hiện tại không chính xác");
            }
        }

        user.setPinHash(passwordEncoder.encode(request.getNewPin()));
        userRepository.save(user);
    }

    /**
     * Revoke user's refresh tokens upon logout.
     */
    @Transactional
    public void logout(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
        refreshTokenService.deleteByUserId(user);
    }

    /**
     * Map User entity to sanitized UserResponse DTO payload (excluding sensitive hashes).
     */
    public UserResponse mapToUserResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .phoneNumber(user.getPhoneNumber())
                .fullName(user.getFullName())
                .role(user.getRole())
                .avatarUrl(user.getAvatarUrl())
                .kycStatus(user.getKycStatus())
                .isActive(user.getIsActive())
                .hasPin(user.getPinHash() != null)
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();
    }
}


package com.example.identityservice.service;

import com.example.identityservice.constants.ErrorCode;
import com.example.identityservice.constants.Role;
import com.example.identityservice.dto.request.AdminUpdateUserRequest;
import com.example.identityservice.dto.request.ChangePasswordRequest;
import com.example.identityservice.dto.request.UpdateProfileRequest;
import com.example.identityservice.dto.response.UserResponse;
import com.example.identityservice.entity.User;
import com.example.identityservice.exception.AppException;
import com.example.identityservice.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/**
 * User Service managing user identity retrieval, profile metadata updates, and password changes.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthService authService;

    /**
     * Retrieve user profile details by UUID:
     * - Look up user in Database
     * - Map to UserResponse DTO
     */
    public UserResponse getUserById(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
        return authService.mapToUserResponse(user);
    }

    /**
     * Retrieve user profile details by identifier (phone, email, username, or UUID).
     */
    public UserResponse getUserByIdentifier(String identifier) {
        User user = userRepository.findByPhoneNumber(identifier)
                .or(() -> userRepository.findByEmail(identifier))
                .or(() -> userRepository.findByUsername(identifier))
                .or(() -> {
                    try {
                        return userRepository.findById(UUID.fromString(identifier));
                    } catch (Exception e) {
                        return java.util.Optional.empty();
                    }
                })
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
        return authService.mapToUserResponse(user);
    }

    /**
     * Update user profile metadata (full name, avatar URL):
     */
    @Transactional
    public UserResponse updateProfile(UUID userId, UpdateProfileRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        // Update full name if provided
        if (request.getFullName() != null && !request.getFullName().isBlank()) {
            user.setFullName(request.getFullName());
        }
        // Update avatar URL if provided
        if (request.getAvatarUrl() != null && !request.getAvatarUrl().isBlank()) {
            user.setAvatarUrl(request.getAvatarUrl());
        }

        User updatedUser = userRepository.save(user);
        return authService.mapToUserResponse(updatedUser);
    }

    /**
     * Change user password:
     * - Verify old password against BCrypt hash
     * - Encode new password and persist to Database
     */
    @Transactional
    public void changePassword(UUID userId, ChangePasswordRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        // 1. Verify old password match
        if (!passwordEncoder.matches(request.getOldPassword(), user.getPasswordHash())) {
            throw new AppException(ErrorCode.INVALID_CREDENTIALS, "Mật khẩu cũ không chính xác");
        }

        // 2. Encode new password with BCrypt and save
        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }

    /**
     * Admin/Staff Query: Retrieve paginated users with optional keyword, role, and active status filters.
     */
    public Page<UserResponse> getAllUsers(String keyword, Role role, Boolean isActive, Pageable pageable) {
        Page<User> usersPage = userRepository.searchUsers(keyword, role, isActive, pageable);
        return usersPage.map(authService::mapToUserResponse);
    }

    /**
     * Admin Action: Toggle user account active status between ACTIVE and BLOCKED.
     */
    @Transactional
    public UserResponse toggleUserStatus(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        boolean newActive = user.getIsActive() == null || !user.getIsActive();
        user.setIsActive(newActive);
        User saved = userRepository.save(user);
        return authService.mapToUserResponse(saved);
    }

    /**
     * Admin Action: Update user authorization role.
     */
    @Transactional
    public UserResponse updateUserRole(UUID userId, Role newRole) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        user.setRole(newRole);
        User saved = userRepository.save(user);
        return authService.mapToUserResponse(saved);
    }

    /**
     * Admin Action: Full update of user information.
     */
    @Transactional
    public UserResponse adminUpdateUser(UUID userId, AdminUpdateUserRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        if (request.getFullName() != null && !request.getFullName().isBlank()) {
            user.setFullName(request.getFullName());
        }
        if (request.getEmail() != null && !request.getEmail().isBlank()) {
            user.setEmail(request.getEmail());
        }
        if (request.getPhoneNumber() != null && !request.getPhoneNumber().isBlank()) {
            user.setPhoneNumber(request.getPhoneNumber());
        }
        if (request.getRole() != null) {
            user.setRole(request.getRole());
        }
        if (request.getIsActive() != null) {
            user.setIsActive(request.getIsActive());
        }

        User saved = userRepository.save(user);
        return authService.mapToUserResponse(saved);
    }
}


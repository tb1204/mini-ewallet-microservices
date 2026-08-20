package com.example.identityservice.controller;

import com.example.identityservice.dto.request.ChangePasswordRequest;
import com.example.identityservice.dto.request.UpdateProfileRequest;
import com.example.identityservice.dto.response.ApiResponse;
import com.example.identityservice.dto.response.UserResponse;
import com.example.identityservice.service.UserService;
import com.example.identityservice.util.SecurityUtil;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * REST Controller exposing user management endpoints (/profile, /{id}, /change-password).
 */
@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    /** Authenticated GET /api/v1/users/profile endpoint retrieving current user profile. */
    @GetMapping("/profile")
    public ResponseEntity<ApiResponse<UserResponse>> getCurrentUser() {
        UUID currentUserId = SecurityUtil.getCurrentUserId();
        UserResponse response = userService.getUserById(currentUserId);
        return ResponseEntity.ok(ApiResponse.success("Lấy thông tin cá nhân thành công", response));
    }

    /** GET /api/v1/users/{id} endpoint retrieving specific user details by UUID. */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<UserResponse>> getUserById(@PathVariable UUID id) {
        UserResponse response = userService.getUserById(id);
        return ResponseEntity.ok(ApiResponse.success("Lấy thông tin người dùng thành công", response));
    }

    /** Authenticated PUT /api/v1/users/profile endpoint updating profile metadata. */
    @PutMapping("/profile")
    public ResponseEntity<ApiResponse<UserResponse>> updateProfile(@Valid @RequestBody UpdateProfileRequest request) {
        UUID currentUserId = SecurityUtil.getCurrentUserId();
        UserResponse response = userService.updateProfile(currentUserId, request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật thông tin cá nhân thành công", response));
    }

    /** Authenticated PUT /api/v1/users/change-password endpoint updating user password. */
    @PutMapping("/change-password")
    public ResponseEntity<ApiResponse<String>> changePassword(@Valid @RequestBody ChangePasswordRequest request) {
        UUID currentUserId = SecurityUtil.getCurrentUserId();
        userService.changePassword(currentUserId, request);
        return ResponseEntity.ok(ApiResponse.success("Đổi mật khẩu thành công", "Mật khẩu đã được cập nhật"));
    }
}


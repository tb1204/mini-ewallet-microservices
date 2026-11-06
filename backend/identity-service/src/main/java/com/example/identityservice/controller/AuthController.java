package com.example.identityservice.controller;

import com.example.identityservice.dto.request.*;
import com.example.identityservice.dto.response.ApiResponse;
import com.example.identityservice.dto.response.AuthResponse;
import com.example.identityservice.service.AuthService;
import com.example.identityservice.util.SecurityUtil;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * REST Controller exposing public & authenticated endpoints for authentication (/register, /login, /refresh-token, /verify-pin, /logout).
 */
@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    /** Public POST /api/v1/auth/register endpoint. */
    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(@Valid @RequestBody RegisterRequest request) {
        AuthResponse response = authService.register(request);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success("Đăng ký tài khoản thành công", response));
    }

    /** Public POST /api/v1/auth/login endpoint. */
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.success("Đăng nhập thành công", response));
    }

    /** Public POST /api/v1/auth/refresh-token endpoint. */
    @PostMapping("/refresh-token")
    public ResponseEntity<ApiResponse<AuthResponse>> refreshToken(@Valid @RequestBody RefreshTokenRequest request) {
        AuthResponse response = authService.refreshToken(request);
        return ResponseEntity.ok(ApiResponse.success("Làm mới Token thành công", response));
    }

    /** Authenticated POST /api/v1/auth/verify-pin endpoint validating 6-digit PIN. */
    @PostMapping("/verify-pin")
    public ResponseEntity<ApiResponse<Boolean>> verifyPin(@Valid @RequestBody VerifyPinRequest request) {
        UUID currentUserId = SecurityUtil.getCurrentUserId();
        boolean isValid = authService.verifyPin(currentUserId, request);
        return ResponseEntity.ok(ApiResponse.success("Mã PIN hợp lệ", isValid));
    }

    /** Authenticated POST /api/v1/auth/change-pin endpoint setting up or changing 6-digit PIN. */
    @PostMapping("/change-pin")
    public ResponseEntity<ApiResponse<String>> changePin(@Valid @RequestBody ChangePinRequest request) {
        UUID currentUserId = SecurityUtil.getCurrentUserId();
        authService.changePin(currentUserId, request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật mã PIN thành công", "Mã PIN 6 số đã được lưu an toàn"));
    }

    /** Authenticated POST /api/v1/auth/forgot-pin/send-otp endpoint generating and sending OTP to user email. */
    @PostMapping("/forgot-pin/send-otp")
    public ResponseEntity<ApiResponse<String>> sendPinResetOtp() {
        UUID currentUserId = SecurityUtil.getCurrentUserId();
        String message = authService.sendPinResetOtp(currentUserId);
        return ResponseEntity.ok(ApiResponse.success("Gửi mã OTP thành công", message));
    }

    /** Authenticated POST /api/v1/auth/forgot-pin/verify-otp endpoint validating 6-digit email OTP. */
    @PostMapping("/forgot-pin/verify-otp")
    public ResponseEntity<ApiResponse<Boolean>> verifyPinResetOtp(@Valid @RequestBody VerifyOtpRequest request) {
        UUID currentUserId = SecurityUtil.getCurrentUserId();
        boolean isValid = authService.verifyPinResetOtp(currentUserId, request.getOtp());
        return ResponseEntity.ok(ApiResponse.success("Xác thực OTP thành công", isValid));
    }

    /** Authenticated POST /api/v1/auth/forgot-pin/reset endpoint setting new PIN after OTP verification. */
    @PostMapping("/forgot-pin/reset")
    public ResponseEntity<ApiResponse<String>> resetPinWithOtp(@Valid @RequestBody ResetPinWithOtpRequest request) {
        UUID currentUserId = SecurityUtil.getCurrentUserId();
        authService.resetPinWithOtp(currentUserId, request.getOtp(), request.getNewPin());
        return ResponseEntity.ok(ApiResponse.success("Đặt lại mã PIN thành công", "Mã PIN mới 6 số đã được kích hoạt"));
    }

    /** Authenticated POST /api/v1/auth/logout endpoint revoking active refresh tokens. */
    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<String>> logout() {
        UUID currentUserId = SecurityUtil.getCurrentUserId();
        authService.logout(currentUserId);
        return ResponseEntity.ok(ApiResponse.success("Đăng xuất thành công", "Refresh token đã bị hủy"));
    }
}


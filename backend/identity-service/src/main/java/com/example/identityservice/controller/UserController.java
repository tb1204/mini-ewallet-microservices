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

    /** GET /api/v1/users/search/{identifier} endpoint looking up user by phone/email/username/UUID. */
    @GetMapping("/search/{identifier}")
    public ResponseEntity<ApiResponse<UserResponse>> getUserByIdentifier(@PathVariable String identifier) {
        UserResponse response = userService.getUserByIdentifier(identifier);
        return ResponseEntity.ok(ApiResponse.success("Tìm kiếm người dùng thành công", response));
    }

    /** Authenticated PUT /api/v1/users/profile endpoint updating profile metadata. */
    @PutMapping("/profile")
    public ResponseEntity<ApiResponse<UserResponse>> updateProfile(@Valid @RequestBody UpdateProfileRequest request) {
        UUID currentUserId = SecurityUtil.getCurrentUserId();
        UserResponse response = userService.updateProfile(currentUserId, request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật thông tin cá nhân thành công", response));
    }

    /**
     * Authenticated POST /api/v1/users/avatar endpoint uploading avatar file to Cloudinary.
     */
    @PostMapping(value = "/avatar", consumes = org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<UserResponse>> uploadAvatar(
            @RequestParam("file") org.springframework.web.multipart.MultipartFile file) {
        UUID currentUserId = SecurityUtil.getCurrentUserId();
        UserResponse response = userService.uploadAvatar(currentUserId, file);
        return ResponseEntity.ok(ApiResponse.success("Tải ảnh đại diện lên Cloudinary thành công", response));
    }

    /**
     * Authenticated DELETE /api/v1/users/avatar endpoint removing user avatar.
     */
    @DeleteMapping("/avatar")
    public ResponseEntity<ApiResponse<UserResponse>> removeAvatar() {
        UUID currentUserId = SecurityUtil.getCurrentUserId();
        UserResponse response = userService.removeAvatar(currentUserId);
        return ResponseEntity.ok(ApiResponse.success("Xóa ảnh đại diện thành công", response));
    }

    /** Authenticated PUT /api/v1/users/change-password endpoint updating user password. */
    @PutMapping("/change-password")
    public ResponseEntity<ApiResponse<String>> changePassword(@Valid @RequestBody ChangePasswordRequest request) {
        UUID currentUserId = SecurityUtil.getCurrentUserId();
        userService.changePassword(currentUserId, request);
        return ResponseEntity.ok(ApiResponse.success("Đổi mật khẩu thành công", "Mật khẩu đã được cập nhật"));
    }

    /**
     * Admin/Staff GET /api/v1/users endpoint querying users with optional filters and pagination.
     */
    @GetMapping
    public ResponseEntity<ApiResponse<java.util.List<UserResponse>>> getAllUsers(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) com.example.identityservice.constants.Role role,
            @RequestParam(required = false) Integer isActive,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "100") int size,
            @RequestParam(defaultValue = "createdAt,desc") String sort) {

        String[] sortParts = sort.split(",");
        String sortField = sortParts[0];
        org.springframework.data.domain.Sort.Direction direction = sortParts.length > 1 && sortParts[1].equalsIgnoreCase("asc")
                ? org.springframework.data.domain.Sort.Direction.ASC
                : org.springframework.data.domain.Sort.Direction.DESC;

        org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(page, size, org.springframework.data.domain.Sort.by(direction, sortField));
        org.springframework.data.domain.Page<UserResponse> userPage = userService.getAllUsers(keyword, role, isActive, pageable);

        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách người dùng thành công", userPage.getContent()));
    }

    /**
     * Admin PUT /api/v1/users/{id}/status endpoint toggling user active status.
     */
    @PutMapping("/{id}/status")
    public ResponseEntity<ApiResponse<UserResponse>> toggleUserStatus(@PathVariable UUID id) {
        UserResponse response = userService.toggleUserStatus(id);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật trạng thái người dùng thành công", response));
    }

    /**
     * Admin PUT /api/v1/users/{id}/role endpoint updating user authorization role.
     */
    @PutMapping("/{id}/role")
    public ResponseEntity<ApiResponse<UserResponse>> updateUserRole(
            @PathVariable UUID id,
            @RequestParam com.example.identityservice.constants.Role role) {
        UserResponse response = userService.updateUserRole(id, role);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật vai trò người dùng thành công", response));
    }

    /**
     * Admin PUT /api/v1/users/{id} endpoint: Disallowed per fintech security compliance.
     * Prevents internal fraud and maintains data integrity.
     */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> adminUpdateUser(@PathVariable UUID id) {
        throw new com.example.identityservice.exception.AppException(
                com.example.identityservice.constants.ErrorCode.UNAUTHORIZED,
                "Admin không có quyền chỉnh sửa thông tin cá nhân của người dùng nhằm đảm bảo an toàn tài khoản và phòng chống gian lận tài chính."
        );
    }
}


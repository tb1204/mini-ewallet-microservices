package com.example.identityservice.constants;

import lombok.Getter;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;

/**
 * Standardized error codes enum mapping custom internal code, user-friendly message, and HTTP status code.
 */
@Getter
public enum ErrorCode {
    UNCATEGORIZED_EXCEPTION(9999, "Lỗi hệ thống không xác định", HttpStatus.INTERNAL_SERVER_ERROR),
    INVALID_KEY(1001, "Mã thông điệp không hợp lệ", HttpStatus.BAD_REQUEST),
    USER_EXISTED(1002, "Tên đăng nhập đã tồn tại trong hệ thống", HttpStatus.BAD_REQUEST),
    EMAIL_EXISTED(1003, "Email đã tồn tại trong hệ thống", HttpStatus.BAD_REQUEST),
    PHONE_EXISTED(1004, "Số điện thoại đã được đăng ký", HttpStatus.BAD_REQUEST),
    USER_NOT_EXISTED(1005, "Người dùng không tồn tại", HttpStatus.NOT_FOUND),
    UNAUTHENTICATED(1006, "Chưa xác thực hoặc Token không hợp lệ", HttpStatus.UNAUTHORIZED),
    UNAUTHORIZED(1007, "Bạn không có quyền truy cập chức năng này", HttpStatus.FORBIDDEN),
    INVALID_CREDENTIALS(1008, "Tên đăng nhập hoặc mật khẩu không chính xác", HttpStatus.UNAUTHORIZED),
    INVALID_PIN(1009, "Mã PIN giao dịch không chính xác", HttpStatus.BAD_REQUEST),
    REFRESH_TOKEN_EXPIRED(1010, "Refresh token đã hết hạn, vui lòng đăng nhập lại", HttpStatus.UNAUTHORIZED),
    REFRESH_TOKEN_NOT_FOUND(1011, "Refresh token không tồn tại", HttpStatus.NOT_FOUND),
    INVALID_INPUT(1012, "Dữ liệu đầu vào không hợp lệ", HttpStatus.BAD_REQUEST);

    private final int code;
    private final String message;
    private final HttpStatusCode statusCode;

    ErrorCode(int code, String message, HttpStatusCode statusCode) {
        this.code = code;
        this.message = message;
        this.statusCode = statusCode;
    }
}


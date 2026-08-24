package com.example.walletservice.constants;

import lombok.Getter;
import org.springframework.http.HttpStatus;

/**
 * Standardized application error codes, messages, and HTTP statuses for wallet-service.
 */
@Getter
public enum ErrorCode {
    // General System Errors
    UNCATEGORIZED_EXCEPTION(9999, "Lỗi hệ thống không xác định", HttpStatus.INTERNAL_SERVER_ERROR),
    INVALID_KEY(1001, "Khoá lỗi không hợp lệ", HttpStatus.BAD_REQUEST),
    UNAUTHORIZED(1002, "Không có quyền truy cập", HttpStatus.FORBIDDEN),
    UNAUTHENTICATED(1003, "Chưa xác thực người dùng", HttpStatus.UNAUTHORIZED),
    INVALID_REQUEST(1004, "Dữ liệu yêu cầu không hợp lệ", HttpStatus.BAD_REQUEST),

    // Wallet Domain Errors
    WALLET_NOT_FOUND(2001, "Không tìm thấy ví của người dùng", HttpStatus.NOT_FOUND),
    WALLET_ALREADY_EXISTS(2002, "Ví người dùng đã tồn tại", HttpStatus.BAD_REQUEST),
    INSUFFICIENT_BALANCE(2003, "Số dư tài khoản không đủ để thực hiện giao dịch", HttpStatus.BAD_REQUEST),
    WALLET_LOCKED(2004, "Ví điện tử đang bị khóa hoặc đóng băng", HttpStatus.BAD_REQUEST),
    INVALID_AMOUNT(2005, "Số tiền giao dịch phải lớn hơn 0", HttpStatus.BAD_REQUEST),
    SAVINGS_NOT_FOUND(2006, "Không tìm thấy sổ tiết kiệm", HttpStatus.NOT_FOUND),
    SAVINGS_ALREADY_WITHDRAWN(2007, "Sổ tiết kiệm đã được tất toán/rút trước đó", HttpStatus.BAD_REQUEST);

    private final int code;
    private final String message;
    private final HttpStatus statusCode;

    ErrorCode(int code, String message, HttpStatus statusCode) {
        this.code = code;
        this.message = message;
        this.statusCode = statusCode;
    }
}

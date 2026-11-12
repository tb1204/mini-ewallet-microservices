package com.example.auditservice.constants;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public enum ErrorCode {
    SUCCESS(1000, "Thành công", HttpStatus.OK),
    UNCATEGORIZED_EXCEPTION(9999, "Lỗi hệ thống không xác định", HttpStatus.INTERNAL_SERVER_ERROR),
    UNAUTHORIZED(1001, "Chưa xác thực hoặc token không hợp lệ", HttpStatus.UNAUTHORIZED),
    FORBIDDEN(1002, "Không có quyền thực hiện thao tác này", HttpStatus.FORBIDDEN),
    INVALID_INTERNAL_SECRET(1003, "Thiếu hoặc sai X-Internal-Secret", HttpStatus.FORBIDDEN),
    CONFIG_NOT_FOUND(1004, "Không tìm thấy cấu hình tham số", HttpStatus.NOT_FOUND),
    AUDIT_LOG_NOT_FOUND(1005, "Không tìm thấy bản ghi nhật ký kiểm toán", HttpStatus.NOT_FOUND),
    INVALID_KEY(1006, "Khóa cấu hình không hợp lệ", HttpStatus.BAD_REQUEST),
    INVALID_REQUEST(1007, "Dữ liệu yêu cầu không hợp lệ", HttpStatus.BAD_REQUEST);

    private final int code;
    private final String message;
    private final HttpStatus httpStatus;

    ErrorCode(int code, String message, HttpStatus httpStatus) {
        this.code = code;
        this.message = message;
        this.httpStatus = httpStatus;
    }
}

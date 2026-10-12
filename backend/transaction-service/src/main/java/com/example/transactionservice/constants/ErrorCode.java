package com.example.transactionservice.constants;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public enum ErrorCode {
    TRANSACTION_NOT_FOUND(1001, "Giao dịch không tồn tại", HttpStatus.NOT_FOUND),
    INSUFFICIENT_BALANCE(1002, "Số dư ví không đủ để thực hiện giao dịch", HttpStatus.BAD_REQUEST),
    INVALID_PIN(1003, "Mã PIN không chính xác", HttpStatus.BAD_REQUEST),
    SENDER_WALLET_NOT_FOUND(1004, "Không tìm thấy ví người gửi", HttpStatus.NOT_FOUND),
    RECEIVER_NOT_FOUND(1005, "Người nhận không tồn tại trong hệ thống", HttpStatus.NOT_FOUND),
    RECEIVER_WALLET_NOT_FOUND(1006, "Không tìm thấy ví người nhận", HttpStatus.NOT_FOUND),
    CANNOT_TRANSFER_TO_SELF(1007, "Không thể tự chuyển tiền cho chính mình", HttpStatus.BAD_REQUEST),
    DUPLICATE_REQUEST(1008, "Yêu cầu đang được xử lý hoặc đã hoàn tất (Idempotency Key trùng lặp)", HttpStatus.CONFLICT),
    TRANSACTION_FAILED(1009, "Thực hiện giao dịch thất bại", HttpStatus.INTERNAL_SERVER_ERROR),
    UNAUTHORIZED(1010, "Yêu cầu truy cập không hợp lệ", HttpStatus.UNAUTHORIZED);

    private final int code;
    private final String message;
    private final HttpStatus httpStatus;

    ErrorCode(int code, String message, HttpStatus httpStatus) {
        this.code = code;
        this.message = message;
        this.httpStatus = httpStatus;
    }
}

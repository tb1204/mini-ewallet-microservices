package com.example.identityservice.exception;

import com.example.identityservice.constants.ErrorCode;
import lombok.Getter;

/**
 * Custom runtime exception carrying a specific ErrorCode for centralized handling.
 */
@Getter
public class AppException extends RuntimeException {

    private final ErrorCode errorCode;

    public AppException(ErrorCode errorCode) {
        super(errorCode.getMessage());
        this.errorCode = errorCode;
    }

    public AppException(ErrorCode errorCode, String customMessage) {
        super(customMessage);
        this.errorCode = errorCode;
    }
}


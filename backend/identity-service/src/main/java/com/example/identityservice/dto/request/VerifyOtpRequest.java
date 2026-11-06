package com.example.identityservice.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request payload for verifying a 6-digit OTP code sent via email.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VerifyOtpRequest {

    @NotBlank(message = "Mã OTP không được để trống")
    @Pattern(regexp = "^\\d{6}$", message = "Mã OTP phải gồm 6 chữ số")
    private String otp;
}


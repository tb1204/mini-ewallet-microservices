package com.example.identityservice.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request payload for resetting 6-digit transaction PIN after email OTP verification.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ResetPinWithOtpRequest {

    @NotBlank(message = "Mã OTP không được để trống")
    @Pattern(regexp = "^\\d{6}$", message = "Mã OTP phải gồm 6 chữ số")
    private String otp;

    @NotBlank(message = "Mã PIN mới không được để trống")
    @Pattern(regexp = "^\\d{6}$", message = "Mã PIN mới phải gồm đúng 6 chữ số")
    private String newPin;
}


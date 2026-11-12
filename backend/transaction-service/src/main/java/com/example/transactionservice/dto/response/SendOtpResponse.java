package com.example.transactionservice.dto.response;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SendOtpResponse {
    private String message;
    private String maskedEmail;
    private int expiresInSeconds;
    private boolean otpRequired;
}


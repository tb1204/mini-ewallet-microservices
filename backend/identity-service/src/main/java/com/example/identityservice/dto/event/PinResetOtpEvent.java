package com.example.identityservice.dto.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PinResetOtpEvent implements Serializable {
    private static final long serialVersionUID = 1L;

    private UUID userId;
    private String email;
    private String fullName;
    private String otpCode;
}


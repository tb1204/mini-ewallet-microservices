package com.example.identityservice.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.*;

/**
 * Request payload for setting up or updating user's 6-digit transaction PIN.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChangePinRequest {

    private String oldPin;

    @NotBlank(message = "Mã PIN mới không được để trống")
    @Pattern(regexp = "^[0-9]{6}$", message = "Mã PIN mới phải bao gồm đúng 6 chữ số")
    private String newPin;
}

package com.example.identityservice.dto.response;

import com.example.identityservice.constants.KycStatus;
import com.example.identityservice.constants.Role;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserResponse {

    private UUID id;
    private String username;
    private String email;
    private String phoneNumber;
    private String fullName;
    private Role role;
    private String avatarUrl;
    private KycStatus kycStatus;
    private Boolean isActive;
    private Boolean hasPin;
    private Instant createdAt;
    private Instant updatedAt;
}

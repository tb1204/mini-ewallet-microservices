package com.example.identityservice.dto.request;

import com.example.identityservice.constants.Role;
import lombok.*;

/**
 * Request payload for administrator updating user profile and authorization metadata.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminUpdateUserRequest {

    private String fullName;
    private String email;
    private String phoneNumber;
    private Role role;
    private Boolean isActive;
}

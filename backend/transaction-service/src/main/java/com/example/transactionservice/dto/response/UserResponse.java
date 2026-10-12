package com.example.transactionservice.dto.response;

import lombok.*;

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
    private String role;
    private String avatarUrl;
}

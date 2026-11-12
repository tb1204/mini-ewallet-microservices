package com.example.auditservice.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateConfigRequest {

    @NotBlank(message = "Giá trị cấu hình không được để trống")
    private String value;

    private String description;
}

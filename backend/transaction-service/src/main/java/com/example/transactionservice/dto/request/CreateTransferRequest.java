package com.example.transactionservice.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateTransferRequest {

    @NotBlank(message = "Số điện thoại hoặc Email người nhận không được để trống")
    private String recipient;

    @NotNull(message = "Số tiền chuyển không được để trống")
    @DecimalMin(value = "1000.00", message = "Số tiền chuyển tối thiểu là 1,000 VNĐ")
    private BigDecimal amount;

    private String description;

    @NotBlank(message = "Mã PIN không được để trống")
    @Pattern(regexp = "^\\d{6}$", message = "Mã PIN phải bao gồm đúng 6 chữ số")
    private String pin;

    private String idempotencyKey;
}

package com.example.transactionservice.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SendOtpRequest {
    @NotNull(message = "Số tiền chuyển không được để trống")
    @DecimalMin(value = "1000.00", message = "Số tiền tối thiểu là 1,000 VNĐ")
    private BigDecimal amount;

    private String recipient;
}


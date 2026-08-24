package com.example.walletservice.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Request payload for creating/depositing into a new savings account.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DepositSavingsRequest {

    private String title;

    @NotNull(message = "Kỳ hạn không được để trống")
    @Min(value = 0, message = "Kỳ hạn không hợp lệ")
    private Integer termMonths;

    @NotNull(message = "Lãi suất không được để trống")
    @DecimalMin(value = "0.00", message = "Lãi suất phải lớn hơn hoặc bằng 0")
    private BigDecimal interestRate;

    @NotNull(message = "Số tiền gửi tiết kiệm không được để trống")
    @DecimalMin(value = "1000.00", message = "Số tiền gửi tối thiểu là 1,000 VNĐ")
    private BigDecimal amount;
}

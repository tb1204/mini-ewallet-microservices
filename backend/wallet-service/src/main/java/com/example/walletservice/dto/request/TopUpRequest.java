package com.example.walletservice.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Request payload for topping up (depositing) funds into a wallet.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TopUpRequest {

    @NotNull(message = "Số tiền nạp không được để trống")
    @DecimalMin(value = "1000.00", message = "Số tiền nạp tối thiểu là 1,000 VNĐ")
    private BigDecimal amount;
}

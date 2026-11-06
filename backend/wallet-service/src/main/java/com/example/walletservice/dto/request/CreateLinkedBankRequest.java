package com.example.walletservice.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Payload for linking a new bank account to wallet.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateLinkedBankRequest {

    @NotBlank(message = "Mã ngân hàng không được để trống")
    private String bankCode;

    @NotBlank(message = "Tên ngân hàng không được để trống")
    private String bankName;

    @NotBlank(message = "Số tài khoản không được để trống")
    private String accountNumber;

    @NotBlank(message = "Tên chủ tài khoản không được để trống")
    private String accountHolderName;

    private Boolean isDefault;
}


package com.example.notificationservice.service;

import com.example.notificationservice.config.RabbitMQConfig;
import com.example.notificationservice.dto.PinResetOtpEvent;
import com.example.notificationservice.dto.TransactionNotificationEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationConsumer {

    private final EmailService emailService;
    private final NotificationService notificationService;

    /**
     * RabbitMQ Listener: Handles PIN Reset OTP email dispatch.
     */
    @RabbitListener(queues = RabbitMQConfig.OTP_EMAIL_QUEUE)
    public void handlePinResetOtpEvent(PinResetOtpEvent event) {
        log.info("Received PinResetOtpEvent from RabbitMQ: email={}, userId={}", event.getEmail(), event.getUserId());
        try {
            emailService.sendPinResetOtpEmail(event.getEmail(), event.getFullName(), event.getOtpCode());
        } catch (Exception e) {
            log.error("Failed to process PinResetOtpEvent: {}", e.getMessage(), e);
        }
    }

    /**
     * RabbitMQ Listener: Handles High-Value Transaction OTP email dispatch.
     */
    @RabbitListener(queues = RabbitMQConfig.TX_OTP_EMAIL_QUEUE)
    public void handleTransactionOtpEvent(java.util.Map<String, Object> payload) {
        log.info("Received TransactionOtpEvent from RabbitMQ: email={}, amount={}",
                payload.get("email"), payload.get("amount"));
        try {
            String email = (String) payload.get("email");
            String fullName = (String) payload.get("fullName");
            String otpCode = (String) payload.get("otpCode");
            java.math.BigDecimal amount = payload.get("amount") != null 
                    ? new java.math.BigDecimal(payload.get("amount").toString()) 
                    : java.math.BigDecimal.ZERO;
            int expiresIn = payload.get("expiresInSeconds") != null 
                    ? Integer.parseInt(payload.get("expiresInSeconds").toString()) 
                    : 120;

            emailService.sendTransactionOtpEmail(email, fullName, otpCode, amount, expiresIn);
        } catch (Exception e) {
            log.error("Failed to process TransactionOtpEvent: {}", e.getMessage(), e);
        }
    }

    /**
     * RabbitMQ Listener: Handles Transaction notifications (Topup, Transfer, Withdraw).
     */
    @RabbitListener(queues = RabbitMQConfig.TRANSACTION_QUEUE)
    public void handleTransactionNotificationEvent(TransactionNotificationEvent event) {
        log.info("Received TransactionNotificationEvent from RabbitMQ: txId={}, userId={}, type={}",
                event.getTransactionId(), event.getUserId(), event.getType());
        try {
            notificationService.createAndPushNotification(
                    event.getUserId(),
                    event.getTitle(),
                    event.getDetail(),
                    event.getType()
            );
        } catch (Exception e) {
            log.error("Failed to process TransactionNotificationEvent: {}", e.getMessage(), e);
        }
    }
}


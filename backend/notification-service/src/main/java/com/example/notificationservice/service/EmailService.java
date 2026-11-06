package com.example.notificationservice.service;

import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:}")
    private String fromEmail;

    /**
     * Send 6-digit transaction PIN reset OTP email with an elegant HTML template.
     */
    public void sendPinResetOtpEmail(String toEmail, String fullName, String otpCode) {
        log.info("Sending PIN reset OTP email to: {}", toEmail);

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            String sender = (fromEmail != null && !fromEmail.isBlank()) ? fromEmail : "noreply.miniwallet@gmail.com";
            helper.setFrom(sender, "MiniWallet Security");
            helper.setTo(toEmail);
            helper.setSubject("[MiniWallet] Mã OTP xác thực đặt lại mã PIN");

            String recipientName = (fullName != null && !fullName.isBlank()) ? fullName : "Quý khách";

            String htmlContent = """
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <style>
                        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 24px; color: #1e293b; }
                        .card { max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 20px; padding: 36px; border: 1px solid #e2e8f0; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05); }
                        .brand { display: flex; align-items: center; gap: 10px; margin-bottom: 24px; }
                        .brand-icon { width: 36px; height: 36px; background: #059669; border-radius: 10px; display: inline-flex; align-items: center; justify-content: center; color: #fff; font-size: 20px; font-weight: bold; }
                        .brand-name { font-size: 20px; font-weight: 800; color: #0f172a; letter-spacing: -0.5px; }
                        .badge { display: inline-block; background: #ecfdf5; color: #059669; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 9999px; margin-bottom: 16px; border: 1px solid #a7f3d0; text-transform: uppercase; letter-spacing: 0.5px; }
                        .title { font-size: 20px; font-weight: 800; color: #0f172a; margin: 0 0 12px; }
                        .desc { font-size: 14px; color: #475569; line-height: 1.6; margin: 0 0 24px; }
                        .otp-box { background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%); border: 2px dashed #10b981; border-radius: 16px; padding: 24px; text-align: center; margin: 28px 0; }
                        .otp-label { font-size: 12px; font-weight: 700; color: #047857; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
                        .otp-code { font-size: 38px; font-weight: 800; letter-spacing: 10px; color: #065f46; margin: 0; font-family: monospace; }
                        .expire-info { font-size: 13px; color: #64748b; text-align: center; margin-top: 10px; }
                        .security-notice { background: #fef2f2; border: 1px solid #fee2e2; border-radius: 12px; padding: 14px 16px; margin-top: 24px; font-size: 13px; color: #991b1b; line-height: 1.5; }
                        .footer { font-size: 12px; color: #94a3b8; text-align: center; margin-top: 32px; border-top: 1px solid #f1f5f9; padding-top: 20px; line-height: 1.5; }
                    </style>
                </head>
                <body>
                    <div class="card">
                        <div class="brand">
                            <span class="brand-icon">💳</span>
                            <span class="brand-name">MiniWallet</span>
                        </div>
                        <span class="badge">Bảo Mật Tài Khoản</span>
                        <h1 class="title">Xác thực quên mã PIN giao dịch</h1>
                        <p class="desc">
                            Xin chào <strong>%s</strong>,<br>
                            Chúng tôi nhận được yêu cầu xác thực đặt lại mã PIN 6 số cho ví điện tử của bạn.
                        </p>
                        <div class="otp-box">
                            <div class="otp-label">MÃ XÁC THỰC OTP (6 CHỮ SỐ)</div>
                            <div class="otp-code">%s</div>
                            <div class="expire-info">⏱️ Mã có hiệu lực trong vòng <strong>5 phút</strong></div>
                        </div>
                        <div class="security-notice">
                            ⚠️ <strong>Khuyến cáo an toàn:</strong> Không chia sẻ mã OTP này cho bất kỳ ai (kể cả nhân viên MiniWallet). Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email và đổi mật khẩu ví ngay.
                        </div>
                        <div class="footer">
                            Email tự động gửi từ hệ thống bảo mật MiniWallet Microservices.<br>
                            Mọi thắc mắc vui lòng liên hệ bộ phận hỗ trợ khách hàng.
                        </div>
                    </div>
                </body>
                </html>
                """.formatted(recipientName, otpCode);

            helper.setText(htmlContent, true);
            mailSender.send(message);
            log.info("Email OTP successfully delivered to: {}", toEmail);
        } catch (Exception e) {
            log.error("Failed to send OTP email to {}: {}", toEmail, e.getMessage());
            log.info("=================================================");
            log.info("   [NOTIFICATION SERVICE OTP CODE]");
            log.info("   User: {}", toEmail);
            log.info("   >>> OTP: {} <<<", otpCode);
            log.info("=================================================");
        }
    }
}


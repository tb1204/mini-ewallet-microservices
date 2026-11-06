package com.example.notificationservice.controller;

import com.example.notificationservice.dto.ApiResponse;
import com.example.notificationservice.dto.NotificationResponse;
import com.example.notificationservice.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<NotificationResponse>>> getUserNotifications(
            @RequestParam UUID userId) {
        List<NotificationResponse> list = notificationService.getUserNotifications(userId);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách thông báo thành công", list));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<ApiResponse<Long>> getUnreadCount(@RequestParam UUID userId) {
        long count = notificationService.getUnreadCount(userId);
        return ResponseEntity.ok(ApiResponse.success("Lấy số lượng thông báo chưa đọc thành công", count));
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<ApiResponse<String>> markAsRead(@PathVariable UUID id) {
        notificationService.markAsRead(id);
        return ResponseEntity.ok(ApiResponse.success("Đánh dấu đã đọc thành công", "Notification marked as read"));
    }

    @PutMapping("/read-all")
    public ResponseEntity<ApiResponse<String>> markAllAsRead(@RequestParam UUID userId) {
        notificationService.markAllAsRead(userId);
        return ResponseEntity.ok(ApiResponse.success("Đánh dấu tất cả đã đọc thành công", "All notifications marked as read"));
    }
}


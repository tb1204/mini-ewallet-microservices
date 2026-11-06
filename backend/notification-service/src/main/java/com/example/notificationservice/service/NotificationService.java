package com.example.notificationservice.service;

import com.example.notificationservice.dto.NotificationResponse;
import com.example.notificationservice.entity.Notification;
import com.example.notificationservice.repositories.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final SimpMessagingTemplate messagingTemplate;

    /**
     * Create notification, persist to DB, and broadcast realtime to user via WebSocket STOMP.
     */
    @Transactional
    public NotificationResponse createAndPushNotification(UUID userId, String title, String detail, String type) {
        Notification notification = Notification.builder()
                .userId(userId)
                .title(title)
                .detail(detail)
                .type(type != null ? type : "SYSTEM")
                .isRead(false)
                .build();

        Notification saved = notificationRepository.save(notification);
        NotificationResponse response = mapToResponse(saved);

        // Push real-time to user's dedicated WebSocket topic
        try {
            String destination = "/topic/notifications/" + userId;
            messagingTemplate.convertAndSend(destination, response);
            log.info("Dispatched WebSocket push notification to {}: {}", destination, title);
        } catch (Exception e) {
            log.warn("Failed to dispatch WebSocket push: {}", e.getMessage());
        }

        return response;
    }

    /**
     * Retrieve all notifications for a given user.
     */
    @Transactional(readOnly = true)
    public List<NotificationResponse> getUserNotifications(UUID userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Count unread notifications for a given user.
     */
    @Transactional(readOnly = true)
    public long getUnreadCount(UUID userId) {
        return notificationRepository.countByUserIdAndIsReadFalse(userId);
    }

    /**
     * Mark a specific notification as read.
     */
    @Transactional
    public void markAsRead(UUID id) {
        notificationRepository.findById(id).ifPresent(n -> {
            n.setIsRead(true);
            notificationRepository.save(n);
        });
    }

    /**
     * Mark all notifications as read for a given user.
     */
    @Transactional
    public void markAllAsRead(UUID userId) {
        notificationRepository.markAllAsReadByUserId(userId);
    }

    private NotificationResponse mapToResponse(Notification n) {
        return NotificationResponse.builder()
                .id(n.getId())
                .userId(n.getUserId())
                .title(n.getTitle())
                .detail(n.getDetail())
                .type(n.getType())
                .read(n.getIsRead())
                .createdAt(n.getCreatedAt())
                .build();
    }
}


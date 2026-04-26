package com.smartcampus.service;

import com.smartcampus.enums.Role;
import com.smartcampus.exception.ResourceNotFoundException;
import com.smartcampus.model.Notification;
import com.smartcampus.model.User;
import com.smartcampus.repository.NotificationRepository;
import com.smartcampus.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    public NotificationService(NotificationRepository notificationRepository, UserRepository userRepository) {
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
    }

    public Notification createNotification(String userId, String title, String message, String type) {
        Notification notification = Notification.builder()
                .userId(userId)
                .title(title)
                .message(message)
                .type(type)
                .isRead(false)
                .createdAt(Instant.now().toString())
                .build();

        return notificationRepository.save(notification);
    }

    public List<Notification> getNotificationsForUser(String userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public void notifyAllAdmins(String title, String message, String type) {
        List<User> admins = userRepository.findByRole(Role.ADMIN);
        if (admins == null || admins.isEmpty()) {
            return;
        }

        for (User admin : admins) {
            createNotification(admin.getId(), title, message, type);
        }
    }

    public Notification markAsRead(String notificationId, String userId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found with id: " + notificationId));

        if (!notification.getUserId().equals(userId)) {
            throw new com.smartcampus.exception.ForbiddenOperationException("You can only mark your own notifications as read.");
        }

        notification.setRead(true);
        return notificationRepository.save(notification);
    }

    public List<Notification> markAllAsRead(String userId) {
        List<Notification> notifications = notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
        List<Notification> unread = new ArrayList<>();

        for (Notification notification : notifications) {
            if (!notification.isRead()) {
                notification.setRead(true);
                unread.add(notification);
            }
        }

        if (!unread.isEmpty()) {
            notificationRepository.saveAll(unread);
        }

        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public void clearAllForUser(String userId) {
        notificationRepository.deleteByUserId(userId);
    }
}

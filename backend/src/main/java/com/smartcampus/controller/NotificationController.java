package com.smartcampus.controller;

import com.smartcampus.model.Notification;
import com.smartcampus.model.User;
import com.smartcampus.service.CurrentUserService;
import com.smartcampus.service.NotificationService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService notificationService;
    private final CurrentUserService currentUserService;

    public NotificationController(NotificationService notificationService, CurrentUserService currentUserService) {
        this.notificationService = notificationService;
        this.currentUserService = currentUserService;
    }

    @GetMapping
    public List<Notification> getNotifications(@AuthenticationPrincipal OAuth2User principal) {
        User user = currentUserService.requireUser(principal);
        return notificationService.getNotificationsForUser(user.getId());
    }

    @PatchMapping("/{id}/read")
    public Notification markAsRead(@PathVariable String id, @AuthenticationPrincipal OAuth2User principal) {
        User user = currentUserService.requireUser(principal);
        return notificationService.markAsRead(id, user.getId());
    }
}

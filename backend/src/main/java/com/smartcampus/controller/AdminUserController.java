package com.smartcampus.controller;

import com.smartcampus.dto.RoleUpdateRequest;
import com.smartcampus.enums.Role;
import com.smartcampus.exception.ResourceNotFoundException;
import com.smartcampus.model.User;
import com.smartcampus.repository.UserRepository;
import com.smartcampus.service.CurrentUserService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Comparator;
import java.util.List;

@RestController
@RequestMapping("/api/admin/users")
public class AdminUserController {

    private final UserRepository userRepository;
    private final CurrentUserService currentUserService;

    public AdminUserController(UserRepository userRepository, CurrentUserService currentUserService) {
        this.userRepository = userRepository;
        this.currentUserService = currentUserService;
    }

    @GetMapping
    public List<User> getAllUsers(@AuthenticationPrincipal OAuth2User principal) {
        User actor = currentUserService.requireUser(principal);
        currentUserService.requireAdmin(actor);

        return userRepository.findAll().stream()
                .sorted(Comparator.comparing(user -> user.getEmail() == null ? "" : user.getEmail()))
                .toList();
    }

    @PatchMapping("/{id}/role")
    public User updateRole(@PathVariable String id,
                           @RequestBody RoleUpdateRequest request,
                           @AuthenticationPrincipal OAuth2User principal) {
        User actor = currentUserService.requireUser(principal);
        currentUserService.requireAdmin(actor);

        if (request == null || request.role() == null || request.role().isBlank()) {
            throw new IllegalArgumentException("role is required.");
        }

        Role targetRole;
        try {
            targetRole = Role.valueOf(request.role().trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException("Invalid role value.");
        }

        User targetUser = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + id));

        targetUser.setRole(targetRole);
        return userRepository.save(targetUser);
    }
}

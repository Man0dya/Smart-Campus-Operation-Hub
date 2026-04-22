package com.smartcampus.controller;

import com.smartcampus.dto.AdminUserCreateRequest;
import com.smartcampus.dto.AdminUserUpdateRequest;
import com.smartcampus.dto.RoleUpdateRequest;
import com.smartcampus.enums.Role;
import com.smartcampus.exception.ConflictException;
import com.smartcampus.exception.ResourceNotFoundException;
import com.smartcampus.model.User;
import com.smartcampus.repository.UserRepository;
import com.smartcampus.service.CurrentUserService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.Comparator;
import java.util.List;

@RestController
@RequestMapping("/api/admin/users")
public class AdminUserController {

    private final UserRepository userRepository;
    private final CurrentUserService currentUserService;
    private final PasswordEncoder passwordEncoder;

    public AdminUserController(UserRepository userRepository,
                               CurrentUserService currentUserService,
                               PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.currentUserService = currentUserService;
        this.passwordEncoder = passwordEncoder;
    }

    @GetMapping
    public List<User> getAllUsers(@AuthenticationPrincipal OAuth2User principal) {
        User actor = currentUserService.requireUser(principal);
        currentUserService.requireAdmin(actor);

        return userRepository.findAll().stream()
                .sorted(Comparator.comparing(user -> user.getEmail() == null ? "" : user.getEmail()))
                .toList();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public User createUser(@Valid @RequestBody AdminUserCreateRequest request,
                           @AuthenticationPrincipal OAuth2User principal) {
        User actor = currentUserService.requireUser(principal);
        currentUserService.requireAdmin(actor);

        if (request == null) {
            throw new IllegalArgumentException("Request body is required.");
        }

        String name = normalize(request.name());
        String email = normalize(request.email()).toLowerCase();
        String password = request.password();

        if (name.isBlank() || email.isBlank() || password == null || password.isBlank()) {
            throw new IllegalArgumentException("name, email, and password are required.");
        }

        if (password.length() < 6) {
            throw new IllegalArgumentException("Password must be at least 6 characters.");
        }

        if (userRepository.findByEmail(email).isPresent()) {
            throw new ConflictException("An account with this email already exists.");
        }

        Role role = parseRole(request.role());

        User user = User.builder()
                .name(name)
                .email(email)
                .passwordHash(passwordEncoder.encode(password))
                .role(role)
                .build();

        if (role == Role.TECHNICIAN) {
            user.setAvailable(true);
        }

        return userRepository.save(user);
    }

    @PutMapping("/{id}")
    public User updateUser(@PathVariable String id,
                           @Valid @RequestBody AdminUserUpdateRequest request,
                           @AuthenticationPrincipal OAuth2User principal) {
        User actor = currentUserService.requireUser(principal);
        currentUserService.requireAdmin(actor);

        if (request == null) {
            throw new IllegalArgumentException("Request body is required.");
        }

        User targetUser = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + id));

        String name = normalize(request.name());
        String email = normalize(request.email()).toLowerCase();

        if (name.isBlank() || email.isBlank()) {
            throw new IllegalArgumentException("name and email are required.");
        }

        userRepository.findByEmail(email).ifPresent(existing -> {
            if (!existing.getId().equals(targetUser.getId())) {
                throw new ConflictException("An account with this email already exists.");
            }
        });

        targetUser.setName(name);
        targetUser.setEmail(email);
        Role updatedRole = parseRole(request.role());
        targetUser.setRole(updatedRole);
        if (updatedRole == Role.TECHNICIAN) {
            targetUser.setAvailable(true);
        }

        String password = request.password();
        if (password != null && !password.isBlank()) {
            if (password.length() < 6) {
                throw new IllegalArgumentException("Password must be at least 6 characters.");
            }
            targetUser.setPasswordHash(passwordEncoder.encode(password));
        }

        return userRepository.save(targetUser);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteUser(@PathVariable String id,
                           @AuthenticationPrincipal OAuth2User principal) {
        User actor = currentUserService.requireUser(principal);
        currentUserService.requireAdmin(actor);

        User targetUser = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + id));

        if (actor.getId().equals(targetUser.getId())) {
            throw new IllegalArgumentException("You cannot delete your own account.");
        }

        userRepository.deleteById(id);
    }

    @PatchMapping("/{id}/role")
    public User updateRole(@PathVariable String id,
                           @Valid @RequestBody RoleUpdateRequest request,
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
        if (targetRole == Role.TECHNICIAN) {
            targetUser.setAvailable(true);
        }
        return userRepository.save(targetUser);
    }

    private Role parseRole(String roleValue) {
        if (roleValue == null || roleValue.isBlank()) {
            return Role.USER;
        }

        try {
            return Role.valueOf(roleValue.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException("Invalid role value.");
        }
    }

    private String normalize(String value) {
        if (value == null) {
            return "";
        }
        return value.trim();
    }
}

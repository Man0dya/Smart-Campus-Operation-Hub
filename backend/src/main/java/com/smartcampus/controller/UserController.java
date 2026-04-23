package com.smartcampus.controller;

import com.smartcampus.dto.AvailabilityUpdateRequest;
import com.smartcampus.model.User;
import com.smartcampus.repository.UserRepository;
import com.smartcampus.service.CurrentUserService;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserRepository userRepository;
    private final CurrentUserService currentUserService;

    public UserController(UserRepository userRepository,
                          CurrentUserService currentUserService) {
        this.userRepository = userRepository;
        this.currentUserService = currentUserService;
    }

    @PatchMapping("/me/availability")
    public User updateAvailability(@Valid @RequestBody AvailabilityUpdateRequest request,
                                   @AuthenticationPrincipal OAuth2User principal) {
        User user = currentUserService.requireUser(principal);
        currentUserService.requireTechnician(user);

        String status = request.status().trim().toUpperCase();
        user.setAvailabilityStatus(status);
        user.setAvailabilityNote(request.note() == null ? null : request.note().trim());
        user.setAvailable(status.equals("AVAILABLE"));

        return userRepository.save(user);
    }
}

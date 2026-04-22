package com.smartcampus.service;

import com.smartcampus.enums.Role;
import com.smartcampus.exception.ForbiddenOperationException;
import com.smartcampus.exception.ResourceNotFoundException;
import com.smartcampus.exception.UnauthorizedException;
import com.smartcampus.model.User;
import com.smartcampus.repository.UserRepository;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

@Service
public class CurrentUserService {

    private final UserRepository userRepository;

    public CurrentUserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public User requireUser(OAuth2User principal) {
        if (principal == null) {
            throw new UnauthorizedException("Authentication is required.");
        }

        String email = principal.getAttribute("email");
        if (email == null || email.isBlank()) {
            throw new UnauthorizedException("Authenticated user email is missing.");
        }

        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found for email: " + email));
    }

    public void requireAdmin(User user) {
        if (user.getRole() != Role.ADMIN) {
            throw new ForbiddenOperationException("Admin access is required.");
        }
    }

    public void requireAdminOrTechnician(User user) {
        if (user.getRole() != Role.ADMIN && user.getRole() != Role.TECHNICIAN) {
            throw new ForbiddenOperationException("Admin or technician access is required.");
        }
    }

    public void requireTechnician(User user) {
        if (user.getRole() != Role.TECHNICIAN) {
            throw new ForbiddenOperationException("Technician access is required.");
        }
    }

    public boolean isAdmin(User user) {
        return user.getRole() == Role.ADMIN;
    }
}

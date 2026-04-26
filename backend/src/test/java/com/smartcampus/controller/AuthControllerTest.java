package com.smartcampus.controller;

import com.smartcampus.dto.RegisterRequest;
import com.smartcampus.enums.Role;
import com.smartcampus.model.User;
import com.smartcampus.repository.UserRepository;
import com.smartcampus.service.CurrentUserService;
import com.smartcampus.service.NotificationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthControllerTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private CurrentUserService currentUserService;

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private NotificationService notificationService;

    @InjectMocks
    private AuthController authController;

    private RegisterRequest request;

    @BeforeEach
    void setUp() {
        request = new RegisterRequest("Jane Doe", "jane@example.com", "secret12");
    }

    @Test
    void register_shouldCreateUserAndNotifyRecipients() {
        when(userRepository.findByEmail("jane@example.com")).thenReturn(Optional.empty());
        when(passwordEncoder.encode("secret12")).thenReturn("encoded-password");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User user = invocation.getArgument(0);
            user.setId("user-1");
            user.setRole(Role.USER);
            return user;
        });

        ResponseEntity<User> response = authController.register(request);

        assertEquals(HttpStatus.CREATED, response.getStatusCode());
        assertEquals("user-1", response.getBody().getId());
        assertEquals("jane@example.com", response.getBody().getEmail());
        verify(notificationService).createNotification(
                "user-1",
                "Welcome to SmartCampus",
                "Your account is ready. You can now create bookings and receive updates.",
                "USER"
        );
        verify(notificationService).notifyAllAdmins(
                "New user registered",
                "A new user account was created for jane@example.com.",
                "USER"
        );
    }
}

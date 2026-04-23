package com.smartcampus.controller;

import com.smartcampus.dto.AvailabilityUpdateRequest;
import com.smartcampus.dto.SkillsUpdateRequest;
import com.smartcampus.enums.Role;
import com.smartcampus.model.Skill;
import com.smartcampus.model.User;
import com.smartcampus.repository.UserRepository;
import com.smartcampus.service.CurrentUserService;
import com.smartcampus.exception.ResourceNotFoundException;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
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

    @PatchMapping("/me/skills")
    public User updateSkills(@Valid @RequestBody SkillsUpdateRequest request,
                             @AuthenticationPrincipal OAuth2User principal) {
        User user = currentUserService.requireUser(principal);
        currentUserService.requireTechnician(user);

        user.setSkills(request.skills());
        user.setCertifications(request.certifications());

        return userRepository.save(user);
    }

    @PatchMapping("/{userId}/skills/verify")
    public User verifyTechnicianSkill(@PathVariable String userId,
                                      @RequestParam String skillName,
                                      @RequestParam boolean verified,
                                      @AuthenticationPrincipal OAuth2User principal) {
        User admin = currentUserService.requireUser(principal);
        currentUserService.requireAdmin(admin);

        User technician = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (technician.getRole() != Role.TECHNICIAN) {
            throw new IllegalArgumentException("User must be a technician");
        }

        technician.getSkills().stream()
                .filter(skill -> skill.getName().equals(skillName))
                .findFirst()
                .ifPresent(skill -> {
                    skill.setVerified(verified);
                    skill.setVerifiedBy(admin.getId());
                    skill.setVerifiedAt(java.time.Instant.now().toString());
                });

        return userRepository.save(technician);
    }
}

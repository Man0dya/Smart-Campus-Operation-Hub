package com.smartcampus.controller;

import com.smartcampus.dto.CreateResourceRequest;
import com.smartcampus.dto.UpdateResourceRequest;
import com.smartcampus.enums.ResourceStatus;
import com.smartcampus.enums.ResourceType;
import com.smartcampus.model.User;
import com.smartcampus.model.Resource;
import com.smartcampus.service.CurrentUserService;
import com.smartcampus.service.ResourceService;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/resources")
public class ResourceController {

    private final ResourceService resourceService;
    private final CurrentUserService currentUserService;

    public ResourceController(ResourceService resourceService, CurrentUserService currentUserService) {
        this.resourceService = resourceService;
        this.currentUserService = currentUserService;
    }

    @GetMapping
    public List<Resource> getAllResources(@RequestParam(required = false) ResourceType type,
                                          @RequestParam(required = false) Integer minCapacity,
                                          @RequestParam(required = false) Integer maxCapacity,
                                          @RequestParam(required = false) String location,
                                          @RequestParam(required = false) ResourceStatus status) {
        return resourceService.getAllResources(type, minCapacity, maxCapacity, location, status);
    }

    @GetMapping("/{id}")
    public Resource getResourceById(@PathVariable String id) {
        return resourceService.getResourceById(id);
    }

    @PostMapping
    public ResponseEntity<Resource> createResource(@Valid @RequestBody CreateResourceRequest request,
                                                   @AuthenticationPrincipal OAuth2User principal) {
        User currentUser = currentUserService.requireUser(principal);
        currentUserService.requireAdmin(currentUser);
        return ResponseEntity.status(HttpStatus.CREATED).body(resourceService.createResource(request));
    }

    @PutMapping("/{id}")
    public Resource updateResource(@PathVariable String id,
                                   @Valid @RequestBody UpdateResourceRequest request,
                                   @AuthenticationPrincipal OAuth2User principal) {
        User currentUser = currentUserService.requireUser(principal);
        currentUserService.requireAdmin(currentUser);
        return resourceService.updateResource(id, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteResource(@PathVariable String id,
                                               @AuthenticationPrincipal OAuth2User principal) {
        User currentUser = currentUserService.requireUser(principal);
        currentUserService.requireAdmin(currentUser);
        resourceService.deleteResource(id);
        return ResponseEntity.noContent().build();
    }
}
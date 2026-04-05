package com.smartcampus.controller;

import com.smartcampus.enums.ResourceStatus;
import com.smartcampus.enums.ResourceType;
import com.smartcampus.model.User;
import com.smartcampus.model.Resource;
import com.smartcampus.service.CurrentUserService;
import com.smartcampus.service.ResourceService;
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

    @PostMapping
    public ResponseEntity<Resource> createResource(@RequestBody Resource resource,
                                                   @AuthenticationPrincipal OAuth2User principal) {
        User currentUser = currentUserService.requireUser(principal);
        currentUserService.requireAdmin(currentUser);
        return ResponseEntity.status(HttpStatus.CREATED).body(resourceService.createResource(resource));
    }

    @PutMapping("/{id}")
    public Resource updateResource(@PathVariable String id,
                                   @RequestBody Resource resource,
                                   @AuthenticationPrincipal OAuth2User principal) {
        User currentUser = currentUserService.requireUser(principal);
        currentUserService.requireAdmin(currentUser);
        return resourceService.updateResource(id, resource);
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
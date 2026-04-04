package com.smartcampus.controller;

import com.smartcampus.model.Resource;
import com.smartcampus.service.ResourceService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/resources")
public class ResourceController {

    private final ResourceService resourceService;

    public ResourceController(ResourceService resourceService) {
        this.resourceService = resourceService;
    }

    @GetMapping
    public List<Resource> getAllResources() {
        return resourceService.getAllResources();
    }

    @PostMapping
    public Resource createResource(@RequestBody Resource resource) {
        return resourceService.createResource(resource);
    }
}
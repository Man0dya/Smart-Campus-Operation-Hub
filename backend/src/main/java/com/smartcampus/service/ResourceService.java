package com.smartcampus.service;

import com.smartcampus.model.Resource;
import com.smartcampus.repository.ResourceRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ResourceService {

    private final ResourceRepository resourceRepository;

    public ResourceService(ResourceRepository resourceRepository) {
        this.resourceRepository = resourceRepository;
    }

    public List<Resource> getAllResources() {
        return resourceRepository.findAll();
    }

    public Resource createResource(Resource resource) {
        return resourceRepository.save(resource);
    }
}
package com.smartcampus.service;

import com.smartcampus.enums.ResourceStatus;
import com.smartcampus.enums.ResourceType;
import com.smartcampus.exception.ResourceNotFoundException;
import com.smartcampus.model.Resource;
import com.smartcampus.repository.ResourceRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Locale;

@Service
public class ResourceService {

    private final ResourceRepository resourceRepository;

    public ResourceService(ResourceRepository resourceRepository) {
        this.resourceRepository = resourceRepository;
    }

    public List<Resource> getAllResources(ResourceType type,
                                          Integer minCapacity,
                                          Integer maxCapacity,
                                          String location,
                                          ResourceStatus status) {
        return resourceRepository.findAll().stream()
                .filter(resource -> type == null || resource.getType() == type)
                .filter(resource -> minCapacity == null || (resource.getCapacity() != null && resource.getCapacity() >= minCapacity))
                .filter(resource -> maxCapacity == null || (resource.getCapacity() != null && resource.getCapacity() <= maxCapacity))
                .filter(resource -> location == null || (resource.getLocation() != null
                        && resource.getLocation().toLowerCase(Locale.ROOT).contains(location.toLowerCase(Locale.ROOT))))
                .filter(resource -> status == null || resource.getStatus() == status)
                .toList();
    }

    public Resource createResource(Resource resource) {
        return resourceRepository.save(resource);
    }

    public Resource updateResource(String id, Resource resource) {
        Resource existing = resourceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Resource not found with id: " + id));

        existing.setName(resource.getName());
        existing.setType(resource.getType());
        existing.setCapacity(resource.getCapacity());
        existing.setLocation(resource.getLocation());
        existing.setAvailabilityStart(resource.getAvailabilityStart());
        existing.setAvailabilityEnd(resource.getAvailabilityEnd());
        existing.setStatus(resource.getStatus());
        existing.setDescription(resource.getDescription());

        return resourceRepository.save(existing);
    }

    public void deleteResource(String id) {
        if (!resourceRepository.existsById(id)) {
            throw new ResourceNotFoundException("Resource not found with id: " + id);
        }
        resourceRepository.deleteById(id);
    }
}
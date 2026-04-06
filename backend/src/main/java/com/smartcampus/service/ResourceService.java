package com.smartcampus.service;

import com.smartcampus.dto.CreateResourceRequest;
import com.smartcampus.dto.UpdateResourceRequest;
import com.smartcampus.enums.ResourceStatus;
import com.smartcampus.enums.ResourceType;
import com.smartcampus.exception.ResourceNotFoundException;
import com.smartcampus.model.Resource;
import com.smartcampus.repository.ResourceRepository;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.regex.Pattern;

@Service
public class ResourceService {

    private final ResourceRepository resourceRepository;
    private final MongoTemplate mongoTemplate;

    public ResourceService(ResourceRepository resourceRepository, MongoTemplate mongoTemplate) {
        this.resourceRepository = resourceRepository;
        this.mongoTemplate = mongoTemplate;
    }

    public List<Resource> getAllResources(ResourceType type,
                                          Integer minCapacity,
                                          Integer maxCapacity,
                                          String location,
                                          ResourceStatus status) {
        Query query = new Query();

        if (type != null) {
            query.addCriteria(Criteria.where("type").is(type));
        }

        if (status != null) {
            query.addCriteria(Criteria.where("status").is(status));
        }

        if (minCapacity != null || maxCapacity != null) {
            Criteria capacityCriteria = Criteria.where("capacity");
            if (minCapacity != null) {
                capacityCriteria = capacityCriteria.gte(minCapacity);
            }
            if (maxCapacity != null) {
                capacityCriteria = capacityCriteria.lte(maxCapacity);
            }
            query.addCriteria(capacityCriteria);
        }

        if (location != null && !location.isBlank()) {
            Pattern pattern = Pattern.compile(".*" + Pattern.quote(location.trim()) + ".*", Pattern.CASE_INSENSITIVE);
            query.addCriteria(Criteria.where("location").regex(pattern));
        }

        return mongoTemplate.find(query, Resource.class);
    }

    public Resource getResourceById(String id) {
        return resourceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Resource not found with id: " + id));
    }

    public Resource createResource(CreateResourceRequest request) {
        Resource resource = Resource.builder()
                .name(request.name())
                .type(request.type())
                .capacity(request.capacity())
                .location(normalizeNullable(request.location()))
                .availabilityStart(normalizeNullable(request.availabilityStart()))
                .availabilityEnd(normalizeNullable(request.availabilityEnd()))
                .status(request.status() == null ? ResourceStatus.ACTIVE : request.status())
                .description(normalizeNullable(request.description()))
                .build();

        return resourceRepository.save(resource);
    }

    public Resource updateResource(String id, UpdateResourceRequest request) {
        Resource existing = getResourceById(id);

        existing.setName(request.name());
        existing.setType(request.type());
        existing.setCapacity(request.capacity());
        existing.setLocation(normalizeNullable(request.location()));
        existing.setAvailabilityStart(normalizeNullable(request.availabilityStart()));
        existing.setAvailabilityEnd(normalizeNullable(request.availabilityEnd()));
        existing.setStatus(request.status());
        existing.setDescription(normalizeNullable(request.description()));

        return resourceRepository.save(existing);
    }

    public void deleteResource(String id) {
        if (!resourceRepository.existsById(id)) {
            throw new ResourceNotFoundException("Resource not found with id: " + id);
        }
        resourceRepository.deleteById(id);
    }

    private String normalizeNullable(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isBlank() ? null : trimmed;
    }
}
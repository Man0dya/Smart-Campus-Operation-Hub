package com.smartcampus.dto;

import com.smartcampus.enums.ResourceStatus;
import com.smartcampus.enums.ResourceType;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record CreateResourceRequest(
        @NotBlank(message = "Resource name is required.")
        @Size(max = 120, message = "Resource name must be 120 characters or less.")
        String name,

        @NotNull(message = "Resource type is required.")
        ResourceType type,

        @Min(value = 0, message = "Capacity must be 0 or greater.")
        Integer capacity,

        @Size(max = 120, message = "Location must be 120 characters or less.")
        String location,

        @Pattern(regexp = "^$|^([01]\\d|2[0-3]):[0-5]\\d$", message = "availabilityStart must be in HH:mm format.")
        String availabilityStart,

        @Pattern(regexp = "^$|^([01]\\d|2[0-3]):[0-5]\\d$", message = "availabilityEnd must be in HH:mm format.")
        String availabilityEnd,

        ResourceStatus status,

        @Size(max = 500, message = "Description must be 500 characters or less.")
        String description
) {
}

package com.smartcampus.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum SkillCategory {
    ELECTRICAL("Electrical"),
    PLUMBING("Plumbing"),
    HVAC("HVAC"),
    CARPENTRY("Carpentry"),
    PAINTING("Painting"),
    CLEANING("Cleaning"),
    IT_SUPPORT("IT Support"),
    NETWORKING("Networking"),
    SECURITY("Security"),
    MAINTENANCE("General Maintenance"),
    LANDSCAPING("Landscaping"),
    OTHER("Other");

    private final String displayName;

    SkillCategory(String displayName) {
        this.displayName = displayName;
    }

    @JsonValue
    public String getDisplayName() {
        return displayName;
    }

    @JsonCreator
    public static SkillCategory fromString(String value) {
        for (SkillCategory category : SkillCategory.values()) {
            if (category.name().equalsIgnoreCase(value) || category.displayName.equalsIgnoreCase(value)) {
                return category;
            }
        }
        throw new IllegalArgumentException("Unknown skill category: " + value);
    }
}
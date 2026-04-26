package com.smartcampus.model;

import com.smartcampus.enums.SkillCategory;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Skill {
    @NotBlank(message = "Skill name is required")
    @Size(max = 80, message = "Skill name must be 80 characters or less")
    private String name;

    @NotNull(message = "Skill level is required")
    private SkillLevel level;

    @NotNull(message = "Skill category is required")
    private SkillCategory category;
    private boolean verified;
    private String verifiedBy;
    private String verifiedAt;

    public enum SkillLevel {
        BEGINNER,
        INTERMEDIATE,
        ADVANCED,
        EXPERT;

        @com.fasterxml.jackson.annotation.JsonCreator
        public static SkillLevel fromString(String value) {
            for (SkillLevel level : SkillLevel.values()) {
                if (level.name().equalsIgnoreCase(value)) {
                    return level;
                }
            }
            throw new IllegalArgumentException("Unknown skill level: " + value);
        }
    }
}
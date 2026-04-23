package com.smartcampus.model;

import com.smartcampus.enums.SkillCategory;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Skill {
    private String name;
    private SkillLevel level;
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
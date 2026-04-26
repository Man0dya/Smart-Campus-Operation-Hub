package com.smartcampus.dto;

import com.smartcampus.model.Skill;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public record SkillsUpdateRequest(
        @NotNull @Valid List<Skill> skills,
        @NotNull List<String> certifications
) {
}
package com.smartcampus.model;

import com.smartcampus.enums.Role;
import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.ArrayList;
import java.util.List;

@Document(collection = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    private String id;

    private String googleId;
    private String name;
    private String email;
    @JsonIgnore
    private String passwordHash;
    private String profilePicture;
    private Role role;
    @Builder.Default
    private String availabilityStatus = "AVAILABLE";
    private String availabilityNote;
    @Builder.Default
    private boolean available = true;
    @Builder.Default
    private List<Skill> skills = new ArrayList<>();
    @Builder.Default
    private List<String> certifications = new ArrayList<>();
}
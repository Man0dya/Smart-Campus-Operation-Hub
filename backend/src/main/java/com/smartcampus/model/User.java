package com.smartcampus.model;

import com.smartcampus.enums.Role;
import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

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
    private String profilePicture;
    private Role role;
}
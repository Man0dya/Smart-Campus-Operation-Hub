package com.smartcampus.model;

import com.smartcampus.enums.ResourceStatus;
import com.smartcampus.enums.ResourceType;
import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "resources")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Resource {

    @Id
    private String id;

    private String name;
    private ResourceType type;
    private Integer capacity;
    private String location;
    private String availabilityStart;
    private String availabilityEnd;
    private ResourceStatus status;
    private String description;
}
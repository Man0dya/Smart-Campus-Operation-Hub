package com.smartcampus.model;

import com.smartcampus.enums.PriorityLevel;
import com.smartcampus.enums.TicketStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.List;

@Document(collection = "tickets")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Ticket {

    @Id
    private String id;

    private String resourceId;
    private String reportedBy;
    private String assignedTo;
    private String category;
    private String description;
    private PriorityLevel priority;
    private String contactDetails;
    private TicketStatus status;
    private String resolutionNotes;
    private String technicianResponse;
    private List<Attachment> attachments;
    private String createdAt;
    private String updatedAt;
    private String statusChangedAt;
    private String statusChangedBy;
}

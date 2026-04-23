package com.smartcampus.controller;

import com.smartcampus.dto.TechnicianResponseRequest;
import com.smartcampus.dto.TicketCreateRequest;
import com.smartcampus.dto.TicketStatusUpdateRequest;
import com.smartcampus.enums.Role;
import com.smartcampus.model.Attachment;
import com.smartcampus.model.Ticket;
import com.smartcampus.model.User;
import com.smartcampus.service.CurrentUserService;
import com.smartcampus.service.TicketAttachmentStorageService;
import com.smartcampus.service.TicketService;
import jakarta.validation.Valid;
import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;
import org.springframework.http.MediaTypeFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;

import java.util.List;

@RestController
@RequestMapping("/api/tickets")
public class TicketController {

    private final TicketService ticketService;
    private final CurrentUserService currentUserService;
    private final TicketAttachmentStorageService ticketAttachmentStorageService;

    public TicketController(TicketService ticketService,
                            CurrentUserService currentUserService,
                            TicketAttachmentStorageService ticketAttachmentStorageService) {
        this.ticketService = ticketService;
        this.currentUserService = currentUserService;
        this.ticketAttachmentStorageService = ticketAttachmentStorageService;
    }

    @PostMapping
    public ResponseEntity<Ticket> createTicket(@Valid @RequestBody TicketCreateRequest request,
                                               @AuthenticationPrincipal OAuth2User principal) {
        User user = currentUserService.requireUser(principal);
        return ResponseEntity.status(HttpStatus.CREATED).body(ticketService.createTicket(request, user.getId()));
    }

    @GetMapping("/my")
    public List<Ticket> getMyTickets(@AuthenticationPrincipal OAuth2User principal) {
        User user = currentUserService.requireUser(principal);
        return ticketService.getMyTickets(user.getId());
    }

    /**
     * Get tickets assigned to the current logged-in technician.
     */
    @GetMapping("/assigned")
    public List<Ticket> getAssignedTickets(@AuthenticationPrincipal OAuth2User principal) {
        User user = currentUserService.requireUser(principal);
        currentUserService.requireTechnician(user);
        return ticketService.getAssignedTickets(user.getId());
    }

    /**
     * Get list of available technicians for ticket assignment (admin only).
     */
    @GetMapping("/available-technicians")
    public List<User> getAvailableTechnicians(@RequestParam(required = false) String category,
                                              @AuthenticationPrincipal OAuth2User principal) {
        User user = currentUserService.requireUser(principal);
        currentUserService.requireAdmin(user);
        return ticketService.getAvailableTechniciansForCategory(category);
    }

    @GetMapping
    public List<Ticket> getAllTickets(@AuthenticationPrincipal OAuth2User principal) {
        User user = currentUserService.requireUser(principal);
        currentUserService.requireAdmin(user);
        return ticketService.getAllTickets();
    }

    @GetMapping("/{id}")
    public Ticket getTicketById(@PathVariable String id,
                                @AuthenticationPrincipal OAuth2User principal) {
        User user = currentUserService.requireUser(principal);
        Ticket ticket = ticketService.getTicketById(id);
        boolean actorIsAdminOrTech = user.getRole() == Role.ADMIN || user.getRole() == Role.TECHNICIAN;
        ticketService.ensureTicketAccess(ticket, user, actorIsAdminOrTech);
        return ticket;
    }

    @PatchMapping("/{id}/status")
    public Ticket updateTicketStatus(@PathVariable String id,
                                     @Valid @RequestBody TicketStatusUpdateRequest request,
                                     @AuthenticationPrincipal OAuth2User principal) {
        User user = currentUserService.requireUser(principal);
        boolean actorIsAdminOrTech = user.getRole() == Role.ADMIN || user.getRole() == Role.TECHNICIAN;

        return ticketService.updateTicketStatus(
                id,
                request.status(),
                request.assignedTo(),
                request.resolutionNotes(),
                user,
                actorIsAdminOrTech
        );
    }

    @PatchMapping("/{id}/response")
    public Ticket addTechnicianResponse(@PathVariable String id,
                                        @Valid @RequestBody TechnicianResponseRequest request,
                                        @AuthenticationPrincipal OAuth2User principal) {
        User user = currentUserService.requireUser(principal);
        boolean actorIsAdminOrTech = user.getRole() == Role.ADMIN || user.getRole() == Role.TECHNICIAN;
        return ticketService.addTechnicianResponse(id, request.response(), user, actorIsAdminOrTech);
    }

    @PatchMapping("/{id}/cancel")
    public Ticket cancelTicket(@PathVariable String id,
                               @AuthenticationPrincipal OAuth2User principal) {
        User user = currentUserService.requireUser(principal);
        return ticketService.cancelTicket(id, user);
    }

    @PostMapping(path = "/{id}/attachments", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Ticket uploadAttachments(@PathVariable String id,
                                    @RequestParam("files") MultipartFile[] files,
                                    @AuthenticationPrincipal OAuth2User principal) {
        User user = currentUserService.requireUser(principal);
        Ticket ticket = ticketService.getTicketById(id);
        boolean actorIsAdminOrTech = user.getRole() == Role.ADMIN || user.getRole() == Role.TECHNICIAN;
        ticketService.ensureTicketAccess(ticket, user, actorIsAdminOrTech);

        if (files == null || files.length == 0) {
            throw new IllegalArgumentException("At least one attachment is required.");
        }

        List<Attachment> attachments = ticketAttachmentStorageService.storeTicketImages(files);

        return ticketService.addAttachments(id, attachments);
    }

    /**
     * Legacy fallback for tickets created before Cloudinary storage.
     */
    @GetMapping("/attachments/{fileName:.+}")
    public ResponseEntity<Resource> getAttachment(@PathVariable String fileName) {
        Resource file = ticketAttachmentStorageService.loadAsResource(fileName);
        MediaType mediaType = MediaTypeFactory.getMediaType(file).orElse(MediaType.APPLICATION_OCTET_STREAM);
        return ResponseEntity.ok()
                .contentType(mediaType)
                .body(file);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTicket(@PathVariable String id,
                                             @AuthenticationPrincipal OAuth2User principal) {
        User user = currentUserService.requireUser(principal);
        currentUserService.requireAdmin(user);
        ticketService.deleteTicket(id, user);
        return ResponseEntity.noContent().build();
    }
}

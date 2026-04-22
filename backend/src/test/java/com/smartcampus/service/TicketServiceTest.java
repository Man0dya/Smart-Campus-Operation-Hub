package com.smartcampus.service;

import com.smartcampus.dto.TicketCreateRequest;
import com.smartcampus.enums.PriorityLevel;
import com.smartcampus.enums.Role;
import com.smartcampus.enums.TicketStatus;
import com.smartcampus.exception.ConflictException;
import com.smartcampus.exception.ForbiddenOperationException;
import com.smartcampus.model.Ticket;
import com.smartcampus.model.User;
import com.smartcampus.repository.TicketRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TicketServiceTest {

    @Mock
    private TicketRepository ticketRepository;

    @Mock
    private NotificationService notificationService;

        @Mock
        private TicketAttachmentStorageService ticketAttachmentStorageService;

    @InjectMocks
    private TicketService ticketService;

    @Test
    void createTicket_shouldInitializeOpenWorkflowState() {
        TicketCreateRequest request = new TicketCreateRequest(
                "res-1",
                "Electrical",
                "Projector not working",
                PriorityLevel.HIGH,
                "user@example.com"
        );

        when(ticketRepository.save(any(Ticket.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Ticket saved = ticketService.createTicket(request, "user-1");

        assertEquals(TicketStatus.OPEN, saved.getStatus());
        assertEquals("user-1", saved.getStatusChangedBy());
    }

    @Test
    void updateTicketStatus_shouldRejectInvalidTransition() {
        User actor = User.builder().id("admin-1").role(Role.ADMIN).build();
        Ticket ticket = Ticket.builder()
                .id("t1")
                .reportedBy("user-1")
                .status(TicketStatus.OPEN)
                .build();

        when(ticketRepository.findById("t1")).thenReturn(Optional.of(ticket));

        assertThrows(ConflictException.class, () ->
                ticketService.updateTicketStatus("t1", TicketStatus.CLOSED, null, null, actor, true));
    }

    @Test
    void updateTicketStatus_shouldRequireReasonForReject() {
        User actor = User.builder().id("admin-1").role(Role.ADMIN).build();
        Ticket ticket = Ticket.builder()
                .id("t1")
                .reportedBy("user-1")
                .status(TicketStatus.OPEN)
                .build();

        when(ticketRepository.findById("t1")).thenReturn(Optional.of(ticket));

        assertThrows(IllegalArgumentException.class, () ->
                ticketService.updateTicketStatus("t1", TicketStatus.REJECTED, null, "", actor, true));
    }

    @Test
    void deleteTicket_shouldRejectNonAdmin() {
        User actor = User.builder().id("user-1").role(Role.USER).build();

        assertThrows(ForbiddenOperationException.class, () ->
                ticketService.deleteTicket("t1", actor));
    }

    @Test
    void deleteTicket_shouldDeleteWhenActorIsAdmin() {
        User actor = User.builder().id("admin-1").role(Role.ADMIN).build();
        Ticket ticket = Ticket.builder()
                .id("t1")
                .reportedBy("user-1")
                .status(TicketStatus.OPEN)
                .build();

        when(ticketRepository.findById("t1")).thenReturn(Optional.of(ticket));

        ticketService.deleteTicket("t1", actor);

        verify(ticketAttachmentStorageService).deleteAttachments(ticket.getAttachments());
        verify(ticketRepository).deleteById("t1");
    }
}
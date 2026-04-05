package com.smartcampus.service;

import com.smartcampus.exception.ForbiddenOperationException;
import com.smartcampus.exception.ResourceNotFoundException;
import com.smartcampus.model.Comment;
import com.smartcampus.model.Ticket;
import com.smartcampus.repository.CommentRepository;
import com.smartcampus.repository.TicketRepository;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;

@Service
public class CommentService {

    private final CommentRepository commentRepository;
    private final TicketRepository ticketRepository;
    private final NotificationService notificationService;

    public CommentService(CommentRepository commentRepository,
                          TicketRepository ticketRepository,
                          NotificationService notificationService) {
        this.commentRepository = commentRepository;
        this.ticketRepository = ticketRepository;
        this.notificationService = notificationService;
    }

    public List<Comment> getCommentsByTicket(String ticketId) {
        return commentRepository.findByTicketIdOrderByCreatedAtAsc(ticketId);
    }

    public Comment createComment(String ticketId, String userId, String message) {
        if (message == null || message.isBlank()) {
            throw new IllegalArgumentException("Comment message is required.");
        }

        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found with id: " + ticketId));

        Comment comment = Comment.builder()
                .ticketId(ticketId)
                .userId(userId)
                .message(message)
                .createdAt(Instant.now().toString())
                .build();

        Comment saved = commentRepository.save(comment);

        if (ticket.getReportedBy() != null && !ticket.getReportedBy().equals(userId)) {
            notificationService.createNotification(
                    ticket.getReportedBy(),
                    "New Comment on Ticket",
                    "A new comment was added to your ticket " + ticket.getId() + ".",
                    "COMMENT"
            );
        }

        if (ticket.getAssignedTo() != null && !ticket.getAssignedTo().equals(userId)) {
            notificationService.createNotification(
                    ticket.getAssignedTo(),
                    "New Ticket Comment",
                    "A new comment was added to assigned ticket " + ticket.getId() + ".",
                    "COMMENT"
            );
        }

        return saved;
    }

    public Comment updateOwnComment(String commentId, String userId, String message) {
        if (message == null || message.isBlank()) {
            throw new IllegalArgumentException("Comment message is required.");
        }

        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new ResourceNotFoundException("Comment not found with id: " + commentId));

        if (!comment.getUserId().equals(userId)) {
            throw new ForbiddenOperationException("You can only update your own comments.");
        }

        comment.setMessage(message);
        return commentRepository.save(comment);
    }

    public void deleteOwnComment(String commentId, String userId) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new ResourceNotFoundException("Comment not found with id: " + commentId));

        if (!comment.getUserId().equals(userId)) {
            throw new ForbiddenOperationException("You can only delete your own comments.");
        }

        commentRepository.delete(comment);
    }
}

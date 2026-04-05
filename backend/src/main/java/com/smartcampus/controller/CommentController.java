package com.smartcampus.controller;

import com.smartcampus.model.Comment;
import com.smartcampus.model.User;
import com.smartcampus.service.CommentService;
import com.smartcampus.service.CurrentUserService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/comments")
public class CommentController {

    private final CommentService commentService;
    private final CurrentUserService currentUserService;

    public CommentController(CommentService commentService, CurrentUserService currentUserService) {
        this.commentService = commentService;
        this.currentUserService = currentUserService;
    }

    @GetMapping("/ticket/{ticketId}")
    public List<Comment> getCommentsByTicket(@PathVariable String ticketId,
                                             @AuthenticationPrincipal OAuth2User principal) {
        currentUserService.requireUser(principal);
        return commentService.getCommentsByTicket(ticketId);
    }

    @PostMapping
    public ResponseEntity<Comment> createComment(@RequestBody Map<String, String> request,
                                                 @AuthenticationPrincipal OAuth2User principal) {
        User user = currentUserService.requireUser(principal);
        String ticketId = request.get("ticketId");
        String message = request.get("message");
        Comment saved = commentService.createComment(ticketId, user.getId(), message);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PatchMapping("/{id}")
    public Comment updateOwnComment(@PathVariable String id,
                                    @RequestBody Map<String, String> request,
                                    @AuthenticationPrincipal OAuth2User principal) {
        User user = currentUserService.requireUser(principal);
        return commentService.updateOwnComment(id, user.getId(), request.get("message"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteOwnComment(@PathVariable String id,
                                                  @AuthenticationPrincipal OAuth2User principal) {
        User user = currentUserService.requireUser(principal);
        commentService.deleteOwnComment(id, user.getId());
        return ResponseEntity.noContent().build();
    }
}

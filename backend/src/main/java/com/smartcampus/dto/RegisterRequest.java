package com.smartcampus.dto;

public record RegisterRequest(
        String name,
        String email,
        String password
) {
}

package com.smartcampus.dto;

public record LoginRequest(
        String email,
        String password
) {
}

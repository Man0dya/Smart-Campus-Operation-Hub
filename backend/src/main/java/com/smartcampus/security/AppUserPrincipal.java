package com.smartcampus.security;

import com.smartcampus.enums.Role;
import com.smartcampus.model.User;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.oauth2.core.user.OAuth2User;

import java.io.Serializable;
import java.util.HashMap;
import java.util.Collection;
import java.util.List;
import java.util.Map;

public class AppUserPrincipal implements OAuth2User, UserDetails, Serializable {

    private final String id;
    private final String email;
    private final String displayName;
    private final String passwordHash;
    private final Role role;
    private final Map<String, Object> attributes;

    private AppUserPrincipal(String id,
                             String email,
                             String displayName,
                             String passwordHash,
                             Role role,
                             Map<String, Object> attributes) {
        this.id = id;
        this.email = email;
        this.displayName = displayName;
        this.passwordHash = passwordHash;
        this.role = role;
        this.attributes = attributes;
    }

    public static AppUserPrincipal fromUser(User user, Map<String, Object> attributes) {
        Role resolvedRole = user.getRole() == null ? Role.USER : user.getRole();

        Map<String, Object> mergedAttributes;
        if (attributes == null) {
            mergedAttributes = new HashMap<>();
            mergedAttributes.put("email", user.getEmail() == null ? "" : user.getEmail());
            mergedAttributes.put("name", user.getName() == null ? (user.getEmail() == null ? "" : user.getEmail()) : user.getName());
            mergedAttributes.put("sub", user.getGoogleId() == null ? (user.getId() == null ? "" : user.getId()) : user.getGoogleId());
        } else {
            mergedAttributes = attributes;
        }

        return new AppUserPrincipal(
                user.getId(),
                user.getEmail(),
                user.getName(),
                user.getPasswordHash(),
                resolvedRole,
                mergedAttributes
        );
    }

    public String getId() {
        return id;
    }

    public Role getRole() {
        return role;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_" + role.name()));
    }

    @Override
    public String getPassword() {
        return passwordHash;
    }

    @Override
    public String getUsername() {
        return email;
    }

    @Override
    public String getName() {
        if (displayName == null || displayName.isBlank()) {
            return email;
        }
        return displayName;
    }

    @Override
    public Map<String, Object> getAttributes() {
        return attributes;
    }
}

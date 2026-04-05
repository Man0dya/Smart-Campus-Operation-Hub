package com.smartcampus.security;

import com.smartcampus.enums.Role;
import com.smartcampus.model.User;
import com.smartcampus.repository.UserRepository;
import org.springframework.security.oauth2.client.userinfo.*;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.Optional;

@Service
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    private final UserRepository userRepository;

    public CustomOAuth2UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) {
        OAuth2User oAuth2User = super.loadUser(userRequest);

        Map<String, Object> attributes = oAuth2User.getAttributes();

        String googleId = (String) attributes.get("sub");
        String name = (String) attributes.get("name");
        String email = (String) attributes.get("email");
        String picture = (String) attributes.get("picture");

        Optional<User> existingUser = userRepository.findByEmail(email);

        User user;
        if (existingUser.isEmpty()) {
            user = User.builder()
                    .googleId(googleId)
                    .name(name)
                    .email(email)
                    .profilePicture(picture)
                    .role(Role.USER)
                    .build();
            user = userRepository.save(user);
        } else {
            user = existingUser.get();
            user.setGoogleId(googleId);
            user.setName(name);
            user.setProfilePicture(picture);
            if (user.getRole() == null) {
                user.setRole(Role.USER);
            }
            user = userRepository.save(user);
        }

        return AppUserPrincipal.fromUser(user, attributes);
    }
}
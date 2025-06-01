# User Flow Diagrams

This document contains Mermaid diagrams showing the various user flows through the ELI5 Learning Application.

## 1. Primary User Journey

```mermaid
flowchart TD
    A[User arrives at app] --> B{Authenticated?}
    B -->|No| C[Guest mode or Sign up]
    B -->|Yes| D[Welcome dashboard]
    C --> E[Chat interface]
    D --> E
    E --> F[User pastes text/question]
    F --> G[AI generates explanation]
    G --> H[Display at default level]
    H --> I{User satisfied?}
    I -->|Yes| J[Continue learning]
    I -->|No| K[Adjust level or expand text]
    K --> G
    J --> L[Save to history]
    L --> M[End session or new topic]
```

## 2. Level Adjustment Flow

```mermaid
flowchart TD
    A[User sees AI response] --> B[Click on chat bubble]
    B --> C[Level dropdown appears]
    C --> D[Select new level]
    D --> E{Level higher or lower?}
    E -->|Higher| F[Generate more complex explanation]
    E -->|Lower| G[Generate simpler explanation]
    E -->|Same| H[No change needed]
    F --> I[Display new explanation]
    G --> I
    H --> J[Close dropdown]
    I --> K[Update user preference]
    K --> L[Ready for next interaction]
    J --> L
```

## 3. Text Expansion Flow

```mermaid
flowchart TD
    A[User reading AI response] --> B[Highlight specific text]
    B --> C[Expansion menu appears]
    C --> D[Select explanation level]
    D --> E[AI processes highlighted concept]
    E --> F[Generate focused explanation]
    F --> G[Display in context panel]
    G --> H{User wants more detail?}
    H -->|Yes| I[Select higher level]
    H -->|No| J[Close expansion]
    I --> E
    J --> K[Return to main conversation]
```

## 4. Authentication Flow

```mermaid
flowchart TD
    A[User access app] --> B{Has account?}
    B -->|Yes| C[Click Sign In]
    B -->|No| D[Click Sign Up]
    C --> E[Clerk auth modal]
    D --> E
    E --> F[Enter credentials]
    F --> G{Valid credentials?}
    G -->|No| H[Show error message]
    G -->|Yes| I[Redirect to dashboard]
    H --> F
    I --> J[Load user preferences]
    J --> K[Load chat history]
    K --> L[Ready to learn]
```

## 5. Guest Mode Flow

```mermaid
flowchart TD
    A[User chooses guest mode] --> B[Enter chat interface]
    B --> C[Limited functionality notice]
    C --> D[User can ask questions]
    D --> E[AI provides explanations]
    E --> F[No history saved]
    F --> G{Convert to account?}
    G -->|Yes| H[Prompt registration]
    G -->|No| I[Continue as guest]
    H --> J[Create account]
    J --> K[Migrate session data]
    K --> L[Full functionality]
    I --> M[Session ends on close]
```

## 6. Learning Progression Flow

```mermaid
flowchart TD
    A[User completes interaction] --> B[System analyzes level used]
    B --> C{Consistent higher level usage?}
    C -->|Yes| D[Suggest level advancement]
    C -->|No| E[Maintain current level]
    D --> F[Show progression notification]
    F --> G{User accepts?}
    G -->|Yes| H[Update default level]
    G -->|No| I[Keep current level]
    H --> J[Celebrate achievement]
    I --> K[Note preference]
    E --> K
    J --> L[Continue learning]
    K --> L
```

## 7. Error Handling Flow

```mermaid
flowchart TD
    A[User submits request] --> B[Process with AI]
    B --> C{AI responds successfully?}
    C -->|Yes| D[Display explanation]
    C -->|No| E[Check error type]
    E --> F{Rate limit exceeded?}
    F -->|Yes| G[Show retry timer]
    F -->|No| H{Network error?}
    H -->|Yes| I[Show offline message]
    H -->|No| J[Show generic error]
    G --> K[Auto-retry when possible]
    I --> L[Retry when online]
    J --> M[Manual retry option]
    K --> B
    L --> B
    M --> B
    D --> N[Ready for next interaction]
```

## 8. Mobile User Flow

```mermaid
flowchart TD
    A[Mobile user opens app] --> B[Responsive interface loads]
    B --> C[Touch-optimized chat]
    C --> D[User taps to input text]
    D --> E[Virtual keyboard appears]
    E --> F[User types or pastes content]
    F --> G[Submit via touch]
    G --> H[AI processes request]
    H --> I[Response in mobile-friendly format]
    I --> J[Tap bubble for level change]
    J --> K[Mobile dropdown menu]
    K --> L[Touch to select level]
    L --> M[Swipe to dismiss]
    M --> N[Continue mobile experience]
```

## 9. Content Moderation Flow

```mermaid
flowchart TD
    A[User submits content] --> B[Content moderation check]
    B --> C{Content appropriate?}
    C -->|Yes| D[Process with AI]
    C -->|No| E[Block request]
    E --> F[Show content policy message]
    F --> G[Suggest alternative phrasing]
    G --> H[User can retry]
    H --> B
    D --> I[Generate explanation]
    I --> J[Secondary content check]
    J --> K{Response appropriate?}
    K -->|Yes| L[Display to user]
    K -->|No| M[Generate alternative response]
    M --> J
    L --> N[Log interaction]
```

## 10. Data Privacy Flow

```mermaid
flowchart TD
    A[User interaction] --> B[Collect minimal data]
    B --> C[Encrypt in transit]
    C --> D[Store in Convex DB]
    D --> E[User requests data]
    E --> F[Authenticate request]
    F --> G{Valid user?}
    G -->|Yes| H[Provide data export]
    G -->|No| I[Deny access]
    H --> J{User wants deletion?}
    J -->|Yes| K[Delete user data]
    J -->|No| L[Maintain data]
    K --> M[Confirm deletion]
    I --> N[Log access attempt]
    L --> O[Continue service]
    M --> O
    N --> O
``` 
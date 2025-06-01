# Sequence Diagrams

This document contains sequence diagrams showing the interactions between different components of the ELI5 Learning Application.

## 1. Basic Explanation Request

```mermaid
sequenceDiagram
    participant U as User
    participant UI as React UI
    participant A as Auth (Clerk)
    participant C as Convex DB
    participant AI as Claude API
    
    U->>UI: Paste text/ask question
    UI->>A: Verify user session
    A-->>UI: Session valid
    UI->>C: Save user message
    C-->>UI: Message saved
    UI->>AI: Generate explanation request
    Note over AI: Process with level-specific prompt
    AI-->>UI: Return explanation
    UI->>C: Save AI response
    C-->>UI: Response saved
    UI->>U: Display explanation
```

## 2. Level Adjustment Sequence

```mermaid
sequenceDiagram
    participant U as User
    participant UI as React UI
    participant C as Convex DB
    participant AI as Claude API
    
    U->>UI: Click chat bubble
    UI->>UI: Show level dropdown
    U->>UI: Select new level
    UI->>C: Check user preferences
    C-->>UI: Current preferences
    UI->>AI: Re-generate with new level
    Note over AI: Adjust complexity based on level
    AI-->>UI: New explanation
    UI->>C: Update user level preference
    C-->>UI: Preference updated
    UI->>C: Save new response
    C-->>UI: Response saved
    UI->>U: Display updated explanation
```

## 3. Text Expansion Sequence

```mermaid
sequenceDiagram
    participant U as User
    participant UI as React UI
    participant HL as Highlight Service
    participant C as Convex DB
    participant AI as Claude API
    
    U->>UI: Highlight text in explanation
    UI->>HL: Extract highlighted text
    HL-->>UI: Selected text + context
    UI->>UI: Show expansion dropdown
    U->>UI: Select explanation level
    UI->>AI: Generate focused explanation
    Note over AI: Context: highlighted term<br/>Level: selected level<br/>Parent: original explanation
    AI-->>UI: Focused explanation
    UI->>C: Save expansion interaction
    C-->>UI: Interaction logged
    UI->>U: Display expansion in context panel
```

## 4. User Authentication Flow

```mermaid
sequenceDiagram
    participant U as User
    participant UI as React UI
    participant A as Clerk Auth
    participant C as Convex DB
    
    U->>UI: Click Sign In/Up
    UI->>A: Open auth modal
    U->>A: Enter credentials
    A->>A: Validate credentials
    alt Successful Authentication
        A-->>UI: Auth token + user data
        UI->>C: Create/update user profile
        C-->>UI: Profile ready
        UI->>C: Load chat history
        C-->>UI: Chat history
        UI->>U: Redirect to dashboard
    else Authentication Failed
        A-->>UI: Error message
        UI->>U: Display error
    end
```

## 5. Learning Progression Tracking

```mermaid
sequenceDiagram
    participant U as User
    participant UI as React UI
    participant C as Convex DB
    participant LP as Learning Processor
    
    U->>UI: Complete interaction
    UI->>C: Save interaction with level used
    C-->>LP: Trigger analysis
    LP->>C: Query user's level history
    C-->>LP: Historical level usage
    LP->>LP: Analyze progression patterns
    
    alt Ready for Level Up
        LP->>C: Update progression status
        C-->>UI: Progression notification
        UI->>U: Show level advancement suggestion
        alt User Accepts
            U->>UI: Accept advancement
            UI->>C: Update default level
            C-->>UI: Level updated
            UI->>U: Show achievement
        else User Declines
            U->>UI: Decline advancement
            UI->>C: Log preference
            C-->>UI: Preference noted
        end
    else Continue Current Level
        LP->>C: Maintain current tracking
        C-->>UI: No change needed
    end
```

## 6. Error Handling and Retry Logic

```mermaid
sequenceDiagram
    participant U as User
    participant UI as React UI
    participant C as Convex DB
    participant AI as Claude API
    participant E as Error Handler
    
    U->>UI: Submit request
    UI->>AI: Send to Claude API
    
    alt API Success
        AI-->>UI: Response received
        UI->>U: Display result
    else Rate Limited
        AI-->>E: Rate limit error
        E->>UI: Show retry timer
        UI->>U: Display wait message
        E->>E: Wait for retry window
        E->>UI: Auto-retry ready
        UI->>AI: Retry request
        AI-->>UI: Response received
        UI->>U: Display result
    else Network Error
        AI-->>E: Network timeout
        E->>UI: Network error detected
        UI->>U: Show offline message
        U->>UI: Manual retry
        UI->>AI: Retry request
    else Unknown Error
        AI-->>E: Unexpected error
        E->>C: Log error details
        C-->>E: Error logged
        E->>UI: Generic error message
        UI->>U: Show error with retry option
    end
```

## 7. Real-time Chat Interface

```mermaid
sequenceDiagram
    participant U as User
    participant UI as React UI
    participant WS as WebSocket
    participant C as Convex DB
    participant AI as Claude API
    
    U->>UI: Send message
    UI->>UI: Show typing indicator
    UI->>C: Store message
    C->>WS: Real-time update
    WS-->>UI: Message confirmed
    UI->>AI: Process message
    
    par AI Processing
        AI->>AI: Generate response
        Note over AI: Can take 5-10 seconds
    and Real-time Updates
        UI->>WS: Subscribe to response updates
        WS-->>UI: Processing status updates
        UI->>U: Show "AI is thinking" animation
    end
    
    AI-->>UI: Response ready
    UI->>C: Store AI response
    C->>WS: Real-time update
    WS-->>UI: Response confirmed
    UI->>U: Display AI response
    UI->>UI: Hide typing indicator
```

## 8. Data Synchronization

```mermaid
sequenceDiagram
    participant UI as React UI
    participant C as Convex DB
    participant S as Sync Service
    participant L as Local Storage
    
    UI->>L: Check for offline data
    L-->>UI: Pending operations
    
    alt Has Network Connection
        UI->>C: Sync pending operations
        C-->>UI: Operations synced
        UI->>L: Clear pending operations
        L-->>UI: Cache cleared
        UI->>C: Subscribe to real-time updates
        C->>S: Real-time subscription active
        S-->>UI: Live data updates
    else Offline Mode
        UI->>L: Store operations locally
        L-->>UI: Cached for sync
        UI->>UI: Show offline indicator
        Note over UI: Limited functionality
    end
    
    Note over UI,C: When connection restored
    UI->>C: Resume sync
    C-->>UI: Data synchronized
    UI->>UI: Hide offline indicator
```

## 9. Content Moderation Pipeline

```mermaid
sequenceDiagram
    participant U as User
    participant UI as React UI
    participant M as Moderation Service
    participant C as Convex DB
    participant AI as Claude API
    
    U->>UI: Submit content
    UI->>M: Pre-process content check
    M->>M: Scan for inappropriate content
    
    alt Content Approved
        M-->>UI: Content cleared
        UI->>AI: Send to Claude
        AI->>AI: Generate response
        AI-->>M: Response for review
        M->>M: Post-process response check
        alt Response Safe
            M-->>UI: Response approved
            UI->>C: Store interaction
            C-->>UI: Stored successfully
            UI->>U: Display response
        else Response Flagged
            M-->>UI: Response rejected
            UI->>AI: Request alternative
            AI-->>M: New response
        end
    else Content Flagged
        M-->>UI: Content rejected
        UI->>U: Show content policy message
        U->>UI: Revise content
    end
```

## 10. Mobile App Sequence

```mermaid
sequenceDiagram
    participant U as Mobile User
    participant MA as Mobile App
    participant PWA as PWA Service
    participant C as Convex DB
    participant AI as Claude API
    
    U->>MA: Open app on mobile
    MA->>PWA: Check for updates
    PWA-->>MA: App up to date
    MA->>C: Load user session
    C-->>MA: Session data
    MA->>U: Display mobile interface
    
    U->>MA: Touch to input text
    MA->>MA: Show mobile keyboard
    U->>MA: Type/paste content
    MA->>MA: Optimize for mobile display
    MA->>AI: Send request
    AI-->>MA: Response received
    MA->>MA: Format for mobile
    MA->>U: Display in mobile-friendly layout
    
    U->>MA: Tap bubble for level change
    MA->>MA: Show mobile dropdown
    U->>MA: Select level
    MA->>AI: Request new level
    AI-->>MA: Updated response
    MA->>U: Display updated content
``` 
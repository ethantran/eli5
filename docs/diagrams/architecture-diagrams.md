# Architecture Diagrams

This document contains architectural diagrams showing the system design and component relationships of the ELI5 Learning Application.

## 1. High-Level System Architecture

```mermaid
graph TB
    subgraph "Client Layer"
        U[User Browser]
        M[Mobile Device]
        PWA[Progressive Web App]
    end
    
    subgraph "Frontend Layer"
        R[React App]
        TR[TanStack Router]
        UI[shadcn/ui Components]
        TW[Tailwind CSS]
    end
    
    subgraph "Authentication Layer"
        CL[Clerk Auth]
        JWT[JWT Tokens]
    end
    
    subgraph "Backend Layer"
        CV[Convex Backend]
        DB[(Convex Database)]
        RT[Real-time Subscriptions]
    end
    
    subgraph "AI Layer"
        AI[Claude API]
        PM[Prompt Management]
        RM[Response Moderation]
    end
    
    subgraph "External Services"
        CDN[Content Delivery Network]
        MON[Monitoring & Analytics]
    end
    
    U --> R
    M --> PWA
    PWA --> R
    R --> TR
    R --> UI
    UI --> TW
    R --> CL
    CL --> JWT
    R --> CV
    CV --> DB
    CV --> RT
    CV --> AI
    AI --> PM
    AI --> RM
    R --> CDN
    CV --> MON
```

## 2. Frontend Architecture

```mermaid
graph TB
    subgraph "React Application"
        subgraph "Routing Layer"
            APP[App.tsx]
            ROUTER[TanStack Router]
            ROUTES[Route Components]
        end
        
        subgraph "UI Components"
            CHAT[Chat Interface]
            AUTH[Auth Components]
            LEVEL[Level Selector]
            HIGHLIGHT[Text Highlighter]
            DROPDOWN[Dropdown Menus]
        end
        
        subgraph "State Management"
            CONV[Convex React Hooks]
            CLERK[Clerk React Hooks]
            LOCAL[Local State]
            CACHE[React Query Cache]
        end
        
        subgraph "Services"
            API[API Client]
            WS[WebSocket Client]
            STORAGE[Local Storage]
            UTIL[Utility Functions]
        end
        
        subgraph "Styling"
            TAILWIND[Tailwind CSS]
            SHADCN[shadcn/ui]
            CUSTOM[Custom Styles]
        end
    end
    
    APP --> ROUTER
    ROUTER --> ROUTES
    ROUTES --> CHAT
    ROUTES --> AUTH
    CHAT --> LEVEL
    CHAT --> HIGHLIGHT
    LEVEL --> DROPDOWN
    CHAT --> CONV
    AUTH --> CLERK
    CONV --> API
    CONV --> WS
    API --> STORAGE
    CHAT --> TAILWIND
    DROPDOWN --> SHADCN
    HIGHLIGHT --> CUSTOM
```

## 3. Backend Architecture (Convex)

```mermaid
graph TB
    subgraph "Convex Backend"
        subgraph "API Layer"
            Q[Queries]
            M[Mutations]
            A[Actions]
            HTTP[HTTP Actions]
        end
        
        subgraph "Database Layer"
            SCHEMA[Schema Definition]
            TABLES[Database Tables]
            INDEXES[Indexes]
            RELATIONS[Relations]
        end
        
        subgraph "Real-time Layer"
            SUB[Subscriptions]
            LIVE[Live Queries]
            PUSH[Push Updates]
        end
        
        subgraph "Business Logic"
            USER[User Management]
            CHAT[Chat Logic]
            LEVEL[Level Processing]
            PROGRESS[Progress Tracking]
        end
        
        subgraph "External Integrations"
            CLERK_INT[Clerk Integration]
            AI_INT[Claude Integration]
            WEBHOOK[Webhooks]
        end
        
        subgraph "Infrastructure"
            ENV[Environment Variables]
            LOG[Logging]
            ERROR[Error Handling]
            RATE[Rate Limiting]
        end
    end
    
    Q --> SCHEMA
    M --> TABLES
    A --> AI_INT
    HTTP --> WEBHOOK
    TABLES --> INDEXES
    INDEXES --> RELATIONS
    Q --> SUB
    SUB --> LIVE
    LIVE --> PUSH
    USER --> CLERK_INT
    CHAT --> LEVEL
    LEVEL --> PROGRESS
    USER --> ENV
    CHAT --> LOG
    AI_INT --> ERROR
    M --> RATE
```

## 4. Database Schema Architecture

```mermaid
erDiagram
    Users {
        string id PK
        string clerkId UK
        string email
        string name
        string defaultLevel
        timestamp createdAt
        timestamp updatedAt
        boolean isActive
    }
    
    Conversations {
        string id PK
        string userId FK
        string title
        timestamp createdAt
        timestamp updatedAt
        boolean isArchived
    }
    
    Messages {
        string id PK
        string conversationId FK
        string content
        string role
        string level
        timestamp createdAt
        boolean isExpansion
        string parentMessageId FK
    }
    
    UserPreferences {
        string id PK
        string userId FK
        string defaultLevel
        object levelHistory
        object learningProgress
        timestamp updatedAt
    }
    
    LevelInteractions {
        string id PK
        string userId FK
        string messageId FK
        string fromLevel
        string toLevel
        timestamp createdAt
        string triggerType
    }
    
    TextExpansions {
        string id PK
        string messageId FK
        string selectedText
        string explanationLevel
        string expansion
        timestamp createdAt
    }
    
    Users ||--o{ Conversations : has
    Users ||--|| UserPreferences : has
    Conversations ||--o{ Messages : contains
    Messages ||--o{ TextExpansions : expands
    Messages ||--o{ LevelInteractions : triggers
    Users ||--o{ LevelInteractions : performs
```

## 5. AI Integration Architecture

```mermaid
graph TB
    subgraph "AI Processing Pipeline"
        INPUT[User Input]
        PREPROCESS[Content Preprocessing]
        MODERATION[Content Moderation]
        PROMPT[Prompt Engineering]
        CLAUDE[Claude API]
        POSTPROCESS[Response Processing]
        VALIDATION[Response Validation]
        OUTPUT[Final Response]
    end
    
    subgraph "Prompt Management"
        TEMPLATES[Prompt Templates]
        LEVELS[Level Definitions]
        CONTEXT[Context Building]
        PERSONALIZATION[User Personalization]
    end
    
    subgraph "Response Processing"
        PARSING[Response Parsing]
        FORMATTING[Content Formatting]
        METADATA[Metadata Extraction]
        CACHING[Response Caching]
    end
    
    subgraph "Error Handling"
        RETRY[Retry Logic]
        FALLBACK[Fallback Responses]
        LOGGING[Error Logging]
        ALERTS[Alert System]
    end
    
    INPUT --> PREPROCESS
    PREPROCESS --> MODERATION
    MODERATION --> PROMPT
    PROMPT --> TEMPLATES
    TEMPLATES --> LEVELS
    LEVELS --> CONTEXT
    CONTEXT --> PERSONALIZATION
    PERSONALIZATION --> CLAUDE
    CLAUDE --> POSTPROCESS
    POSTPROCESS --> PARSING
    PARSING --> FORMATTING
    FORMATTING --> VALIDATION
    VALIDATION --> OUTPUT
    CLAUDE --> RETRY
    RETRY --> FALLBACK
    FALLBACK --> LOGGING
    LOGGING --> ALERTS
    FORMATTING --> CACHING
```

## 6. Authentication Flow Architecture

```mermaid
graph TB
    subgraph "Client Authentication"
        LOGIN[Login Component]
        SIGNUP[Signup Component]
        PROFILE[Profile Component]
        LOGOUT[Logout Handler]
    end
    
    subgraph "Clerk Authentication"
        CLERK_UI[Clerk UI Components]
        CLERK_API[Clerk API]
        JWT_MGMT[JWT Management]
        SESSION[Session Management]
    end
    
    subgraph "Backend Integration"
        AUTH_MIDDLEWARE[Auth Middleware]
        USER_RESOLVER[User Resolution]
        PERMISSION[Permission Checks]
        CONTEXT[User Context]
    end
    
    subgraph "Database Integration"
        USER_CREATION[User Creation]
        PROFILE_SYNC[Profile Sync]
        SESSION_STORE[Session Storage]
        CLEANUP[Session Cleanup]
    end
    
    LOGIN --> CLERK_UI
    SIGNUP --> CLERK_UI
    CLERK_UI --> CLERK_API
    CLERK_API --> JWT_MGMT
    JWT_MGMT --> SESSION
    SESSION --> AUTH_MIDDLEWARE
    AUTH_MIDDLEWARE --> USER_RESOLVER
    USER_RESOLVER --> PERMISSION
    PERMISSION --> CONTEXT
    CONTEXT --> USER_CREATION
    USER_CREATION --> PROFILE_SYNC
    PROFILE_SYNC --> SESSION_STORE
    LOGOUT --> CLEANUP
```

## 7. Real-time Data Flow

```mermaid
graph TB
    subgraph "Client Side"
        COMP[React Components]
        HOOKS[Convex Hooks]
        STATE[Local State]
        UI_UPDATE[UI Updates]
    end
    
    subgraph "Convex Real-time"
        SUBSCRIPTION[Subscriptions]
        LIVE_QUERY[Live Queries]
        CHANGE_DETECT[Change Detection]
        PUSH_ENGINE[Push Engine]
    end
    
    subgraph "Database Events"
        INSERT[Insert Events]
        UPDATE[Update Events]
        DELETE[Delete Events]
        BULK_OPS[Bulk Operations]
    end
    
    subgraph "WebSocket Layer"
        WS_CONNECTION[WebSocket Connection]
        MESSAGE_QUEUE[Message Queue]
        RECONNECTION[Auto Reconnection]
        HEARTBEAT[Heartbeat]
    end
    
    COMP --> HOOKS
    HOOKS --> SUBSCRIPTION
    SUBSCRIPTION --> LIVE_QUERY
    LIVE_QUERY --> CHANGE_DETECT
    CHANGE_DETECT --> INSERT
    CHANGE_DETECT --> UPDATE
    CHANGE_DETECT --> DELETE
    INSERT --> PUSH_ENGINE
    UPDATE --> PUSH_ENGINE
    DELETE --> PUSH_ENGINE
    PUSH_ENGINE --> WS_CONNECTION
    WS_CONNECTION --> MESSAGE_QUEUE
    MESSAGE_QUEUE --> HOOKS
    HOOKS --> STATE
    STATE --> UI_UPDATE
    WS_CONNECTION --> RECONNECTION
    RECONNECTION --> HEARTBEAT
```

## 8. Deployment Architecture

```mermaid
graph TB
    subgraph "Development Environment"
        LOCAL[Local Development]
        DEV_DB[Dev Database]
        HOT_RELOAD[Hot Reload]
        DEV_TOOLS[Dev Tools]
    end
    
    subgraph "CI/CD Pipeline"
        GIT[Git Repository]
        BUILD[Build Process]
        TEST[Test Suite]
        DEPLOY[Deployment]
    end
    
    subgraph "Production Environment"
        CDN[Content Delivery Network]
        FRONTEND[Frontend Hosting]
        BACKEND[Convex Production]
        MONITORING[Monitoring]
    end
    
    subgraph "External Services"
        CLERK_PROD[Clerk Production]
        CLAUDE_PROD[Claude API]
        ANALYTICS[Analytics]
        LOGGING[Log Aggregation]
    end
    
    LOCAL --> DEV_DB
    LOCAL --> HOT_RELOAD
    LOCAL --> DEV_TOOLS
    LOCAL --> GIT
    GIT --> BUILD
    BUILD --> TEST
    TEST --> DEPLOY
    DEPLOY --> CDN
    CDN --> FRONTEND
    DEPLOY --> BACKEND
    BACKEND --> CLERK_PROD
    BACKEND --> CLAUDE_PROD
    FRONTEND --> ANALYTICS
    BACKEND --> LOGGING
    BACKEND --> MONITORING
```

## 9. Security Architecture

```mermaid
graph TB
    subgraph "Frontend Security"
        CSP[Content Security Policy]
        XSS[XSS Protection]
        CORS[CORS Configuration]
        HTTPS[HTTPS Enforcement]
    end
    
    subgraph "Authentication Security"
        JWT_VERIFY[JWT Verification]
        SESSION_MGMT[Session Management]
        MFA[Multi-Factor Auth]
        RATE_LIMIT[Rate Limiting]
    end
    
    subgraph "API Security"
        INPUT_VALID[Input Validation]
        OUTPUT_SANITIZE[Output Sanitization]
        SQL_INJECT[SQL Injection Prevention]
        API_KEY[API Key Management]
    end
    
    subgraph "Data Security"
        ENCRYPTION[Data Encryption]
        PRIVACY[Privacy Controls]
        GDPR[GDPR Compliance]
        BACKUP[Secure Backups]
    end
    
    subgraph "Infrastructure Security"
        FIREWALL[Firewall Rules]
        MONITORING[Security Monitoring]
        LOGGING[Audit Logging]
        INCIDENT[Incident Response]
    end
    
    CSP --> XSS
    XSS --> CORS
    CORS --> HTTPS
    HTTPS --> JWT_VERIFY
    JWT_VERIFY --> SESSION_MGMT
    SESSION_MGMT --> MFA
    MFA --> RATE_LIMIT
    RATE_LIMIT --> INPUT_VALID
    INPUT_VALID --> OUTPUT_SANITIZE
    OUTPUT_SANITIZE --> SQL_INJECT
    SQL_INJECT --> API_KEY
    API_KEY --> ENCRYPTION
    ENCRYPTION --> PRIVACY
    PRIVACY --> GDPR
    GDPR --> BACKUP
    BACKUP --> FIREWALL
    FIREWALL --> MONITORING
    MONITORING --> LOGGING
    LOGGING --> INCIDENT
```

## 10. Performance Architecture

```mermaid
graph TB
    subgraph "Frontend Performance"
        LAZY[Lazy Loading]
        CODE_SPLIT[Code Splitting]
        BUNDLE[Bundle Optimization]
        CACHE[Browser Caching]
    end
    
    subgraph "Backend Performance"
        DB_INDEX[Database Indexing]
        QUERY_OPT[Query Optimization]
        CONNECTION[Connection Pooling]
        BACKGROUND[Background Jobs]
    end
    
    subgraph "Caching Strategy"
        CDN_CACHE[CDN Caching]
        API_CACHE[API Response Caching]
        BROWSER_CACHE[Browser Cache]
        MEMORY_CACHE[In-Memory Cache]
    end
    
    subgraph "Monitoring"
        METRICS[Performance Metrics]
        ALERTS[Performance Alerts]
        PROFILING[Performance Profiling]
        OPTIMIZATION[Continuous Optimization]
    end
    
    LAZY --> CODE_SPLIT
    CODE_SPLIT --> BUNDLE
    BUNDLE --> CACHE
    CACHE --> CDN_CACHE
    DB_INDEX --> QUERY_OPT
    QUERY_OPT --> CONNECTION
    CONNECTION --> BACKGROUND
    CDN_CACHE --> API_CACHE
    API_CACHE --> BROWSER_CACHE
    BROWSER_CACHE --> MEMORY_CACHE
    MEMORY_CACHE --> METRICS
    METRICS --> ALERTS
    ALERTS --> PROFILING
    PROFILING --> OPTIMIZATION
``` 
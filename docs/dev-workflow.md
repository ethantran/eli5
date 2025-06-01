# Development Workflow

This document outlines the development practices, tools, and procedures for the ELI5 Learning Application.

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 18 with TanStack Router
- **UI Library**: shadcn/ui components
- **Styling**: Tailwind CSS v4
- **State Management**: Convex React hooks + React Query
- **Build Tool**: Vinxi (Vite-based)
- **Authentication**: Clerk React SDK

### Backend
- **Database & API**: Convex
- **Authentication**: Clerk (backend integration)
- **AI Integration**: Anthropic Claude API
- **Real-time**: Convex subscriptions

### Development Tools
- **Package Manager**: npm
- **TypeScript**: v5.7+
- **Linting**: ESLint + Prettier
- **Testing**: (To be implemented)
- **Deployment**: Convex Cloud + Vercel/Netlify

---

## 🚀 Development Setup

### Prerequisites
```bash
# Node.js 18+ required
node --version

# npm 9+ recommended
npm --version
```

### Initial Setup
```bash
# Clone the repository
git clone <repository-url>
cd eli5

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your keys
```

### Environment Variables
Create `.env.local` with:
```env
# Convex
CONVEX_DEPLOYMENT=<your-convex-deployment>

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=<your-clerk-publishable-key>
CLERK_SECRET_KEY=<your-clerk-secret-key>

# Claude AI
ANTHROPIC_API_KEY=<your-anthropic-api-key>

# Development
NODE_ENV=development
```

### Running the Application
```bash
# Start both frontend and Convex backend
npm run dev

# Or run individually:
npm run dev:web    # Frontend only
npm run dev:db     # Convex backend only
```

---

## 📁 Project Structure

```
eli5/
├── app/                    # Frontend application
│   ├── routes/            # TanStack Router routes
│   ├── components/        # React components
│   ├── lib/              # Utility functions
│   ├── styles/           # Global styles
│   └── utils/            # Helper functions
├── convex/                # Backend (Convex)
│   ├── schema.ts         # Database schema
│   ├── auth.config.ts    # Authentication config
│   ├── *.ts              # API functions (queries, mutations, actions)
│   └── _generated/       # Auto-generated types
├── components/            # shadcn/ui components
├── docs/                 # Documentation
├── public/               # Static assets
└── package.json          # Dependencies & scripts
```

---

## 🎯 Coding Standards

### TypeScript Guidelines
- **Interfaces First**: Define TypeScript interfaces before implementation
- **Type Safety**: Use strict TypeScript configuration
- **Zod Validation**: Validate all runtime inputs (API responses, form data, etc.)

```typescript
// ✅ Good: Define interface first
interface ExplanationRequest {
  content: string;
  level: EducationLevel;
  userId?: string;
}

// ✅ Good: Validate runtime data
const requestSchema = z.object({
  content: z.string().min(1),
  level: z.enum(['preschool', 'elementary', 'middle', 'high', 'college', 'phd']),
  userId: z.string().optional()
});
```

### React Component Guidelines
- **Functional Components**: Use function components with hooks
- **Component Composition**: Prefer composition over inheritance
- **Pure Functions**: Components should be pure when possible
- **Props Interface**: Define props interface for each component

```typescript
// ✅ Good: Functional component with interface
interface ChatMessageProps {
  message: Message;
  onLevelChange: (level: EducationLevel) => void;
  onTextExpand: (text: string, level: EducationLevel) => void;
}

export function ChatMessage({ message, onLevelChange, onTextExpand }: ChatMessageProps) {
  // Component implementation
}
```

### Convex Backend Guidelines
- **Query/Mutation/Action Pattern**: Use appropriate Convex function types
- **Schema Definition**: Maintain strict database schema
- **Error Handling**: Implement proper error handling for all functions
- **Authentication**: Use Clerk integration for user context

```typescript
// ✅ Good: Convex query with proper typing
export const getExplanation = query({
  args: {
    messageId: v.id("messages"),
  },
  handler: async (ctx, { messageId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    
    return await ctx.db.get(messageId);
  },
});

// ✅ Good: Convex mutation with validation
export const createExplanation = mutation({
  args: {
    content: v.string(),
    level: v.union(
      v.literal("preschool"),
      v.literal("elementary"),
      // ... other levels
    ),
  },
  handler: async (ctx, args) => {
    // Implementation
  },
});
```

---

## 🔄 Git Workflow

### Branch Strategy
- **main**: Production-ready code
- **develop**: Integration branch
- **feature/***: Feature development
- **hotfix/***: Critical bug fixes

### Commit Convention
```bash
# Format: type(scope): description
feat(chat): add level selection dropdown
fix(auth): resolve login redirect issue
docs(api): update Convex function documentation
refactor(ui): improve chat message component structure
test(chat): add unit tests for level adjustment
```

### Pull Request Process
1. Create feature branch from `develop`
2. Implement feature following coding standards
3. Write/update tests if applicable
4. Update documentation
5. Create PR with descriptive title and body
6. Code review required before merge
7. Squash and merge to maintain clean history

---

## 🧪 Testing Strategy

### Unit Testing (Planned)
- **Components**: React Testing Library
- **Utilities**: Jest
- **Convex Functions**: Convex testing utilities

### Integration Testing (Planned)
- **API Endpoints**: Test Convex queries/mutations
- **Authentication Flow**: Test Clerk integration
- **AI Integration**: Mock Claude API responses

### E2E Testing (Planned)
- **User Flows**: Playwright or Cypress
- **Critical Paths**: Chat interface, level adjustment, text expansion

---

## 🏗️ Architecture Patterns

### Frontend Patterns
- **Container/Presentational**: Separate data logic from UI
- **Custom Hooks**: Encapsulate reusable logic
- **Component Composition**: Build complex UI from simple parts
- **Error Boundaries**: Handle React errors gracefully

### Backend Patterns
- **Repository Pattern**: Abstract data access in Convex functions
- **Service Layer**: Business logic separation
- **Command Pattern**: Encapsulate operations as objects
- **Factory Pattern**: Create complex objects

### State Management
- **Convex Hooks**: Primary state management
- **Local State**: Component-specific state with useState
- **URL State**: Router state for navigation
- **Form State**: Controlled components for forms

---

## 🔍 Code Quality

### Linting & Formatting
```bash
# Check code formatting
npm run lint

# Auto-fix formatting issues
npm run format
```

### Code Review Checklist
- [ ] TypeScript types are properly defined
- [ ] Error handling is implemented
- [ ] Component props are validated
- [ ] Convex functions have proper authentication
- [ ] UI is responsive and accessible
- [ ] Performance considerations addressed
- [ ] Documentation updated if needed

### Performance Guidelines
- **React**: Use React.memo for expensive components
- **Convex**: Optimize queries with proper indexing
- **Bundle**: Code splitting for large features
- **Images**: Optimize and use proper formats
- **API**: Implement caching where appropriate

---

## 🚀 Deployment Process

### Development Deployment
```bash
# Deploy to Convex development
npx convex deploy --dev

# Build frontend
npm run build

# Deploy frontend (manual process)
# Upload dist/ to hosting provider
```

### Production Deployment
```bash
# Deploy to Convex production
npx convex deploy --prod

# Build optimized frontend
npm run build

# Deploy to production hosting
# (Automated via CI/CD pipeline)
```

### Environment Management
- **Development**: Local development with hot reload
- **Staging**: Testing environment with production-like data
- **Production**: Live application with real users

---

## 📊 Monitoring & Analytics

### Error Tracking
- Implement error boundaries in React
- Log errors in Convex functions
- Monitor API response times

### Performance Monitoring
- Core Web Vitals tracking
- Database query performance
- AI API response times

### User Analytics
- User interaction tracking
- Learning progression metrics
- Feature usage analytics

---

## 🔧 Development Tools

### VS Code Extensions (Recommended)
- TypeScript & JavaScript
- TailwindCSS IntelliSense
- Prettier
- ESLint
- Auto Rename Tag
- Bracket Pair Colorizer

### Browser Extensions
- React Developer Tools
- Redux DevTools (if needed)
- Convex Dashboard

### CLI Tools
```bash
# Global installations
npm install -g @convex-dev/cli
npm install -g typescript
npm install -g prettier
```

---

## 🐛 Debugging

### Frontend Debugging
```typescript
// Use React DevTools
// Add console.logs for development
console.log('Component rendered:', { props, state });

// Use debugger statements
debugger;

// Error boundaries for production
class ErrorBoundary extends React.Component {
  // Implementation
}
```

### Backend Debugging
```typescript
// Convex console logging
console.log('Query executed:', { args, result });

// Error handling
try {
  const result = await someOperation();
  return result;
} catch (error) {
  console.error('Operation failed:', error);
  throw new Error('User-friendly error message');
}
```

---

## 📝 Documentation Standards

### Code Documentation
- JSDoc for complex functions
- Inline comments for business logic
- README files for major features
- API documentation for Convex functions

### Component Documentation
```typescript
/**
 * Chat message component with level adjustment and text expansion
 * @param message - The message object to display
 * @param onLevelChange - Callback when user changes explanation level
 * @param onTextExpand - Callback when user expands specific text
 */
export function ChatMessage({ message, onLevelChange, onTextExpand }: ChatMessageProps) {
  // Implementation
}
```

### API Documentation
```typescript
/**
 * Generate an explanation at a specific educational level
 * @param content - The content to explain
 * @param level - Educational level for the explanation
 * @param context - Optional context for better explanations
 * @returns Promise<Explanation> - The generated explanation
 */
export const generateExplanation = action({
  // Implementation
});
```

---

## 🔄 Continuous Integration

### Automated Checks
- TypeScript compilation
- Linting and formatting
- Unit tests (when implemented)
- Build verification

### Pre-commit Hooks
```bash
# Install husky for git hooks
npm install --save-dev husky

# Add pre-commit hook
npx husky add .husky/pre-commit "npm run lint && npm run build"
```

### CI/CD Pipeline (Future)
- Automated testing
- Security scanning
- Performance testing
- Automated deployment 
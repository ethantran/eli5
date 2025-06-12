# Migration Guide: From Imperative to State Machine Architecture

## 🎯 Goal
Transform components with complex async logic into simple, event-driven components backed by state machines.

## 📋 Pre-Migration Checklist

Before starting, identify components that need migration by looking for:
- [ ] `async/await` in component functions
- [ ] Multiple related `useState` hooks
- [ ] `try/catch` blocks in components
- [ ] Direct `useAction`/`useMutation` calls
- [ ] Complex error handling logic
- [ ] Loading state management

## 🔄 Migration Steps

### Step 1: Analyze Current Component
Document the current component's:
- **State variables** - What state is being managed?
- **Async operations** - What API calls are being made?
- **Error handling** - How are errors being handled?
- **State transitions** - What flows exist between states?

### Step 2: Design State Machine
Create a state machine that handles:
- **States** - `idle`, `loading`, `success`, `error`, etc.
- **Events** - User actions that trigger state changes
- **Context** - Data that persists across states
- **Actions** - Side effects and state updates

### Step 3: Create Service Layer
Extract all external dependencies:
- **API calls** - Move to service functions
- **Business logic** - Move to state machine
- **Error handling** - Centralize in state machine

### Step 4: Create Wrapper Hook
Bridge React hooks with state machine:
- **Initialize services** - Inject API functions
- **Return simple interface** - Provide event dispatchers

### Step 5: Simplify Component
Transform component to only:
- **Render UI** - Based on state machine context
- **Dispatch events** - Call state machine functions
- **Handle simple local state** - Modals, form inputs only

## 🔨 Migration Example

### Before: Complex Component
```tsx
// ❌ BEFORE: Complex async component
export function ChatInterface() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pendingMessageId, setPendingMessageId] = useState<string | null>(null);
  
  const generateExplanation = useAction(api.guest.generateExplanation);
  const regenerateAtLevel = useAction(api.guest.regenerateAtLevel);

  const handleSendMessage = async (content: string) => {
    if (isGenerating) return;
    
    setIsGenerating(true);
    setError(null);
    
    // Add user message
    const userMessage: Message = {
      id: crypto.randomUUID(),
      content,
      role: 'user',
      status: 'complete',
      createdAt: Date.now(),
    };
    setMessages(prev => [...prev, userMessage]);
    
    // Add pending AI message
    const pendingMessage: Message = {
      id: crypto.randomUUID(),
      content: '',
      role: 'assistant',
      status: 'pending',
      createdAt: Date.now(),
    };
    setMessages(prev => [...prev, pendingMessage]);
    setPendingMessageId(pendingMessage.id);
    
    try {
      const response = await generateExplanation({
        content,
        level: 'beginner',
        sessionId: 'guest-session',
      });
      
      // Update pending message with response
      setMessages(prev => prev.map(msg => 
        msg.id === pendingMessage.id 
          ? { ...msg, content: response.content, status: 'complete' }
          : msg
      ));
      
    } catch (error) {
      console.error('Failed to generate explanation:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
      
      // Update pending message with error
      setMessages(prev => prev.map(msg => 
        msg.id === pendingMessage.id 
          ? { ...msg, content: 'Error generating response', status: 'error' }
          : msg
      ));
    } finally {
      setIsGenerating(false);
      setPendingMessageId(null);
    }
  };

  const handleLevelChange = async (messageId: string, newLevel: string) => {
    if (isGenerating) return;
    
    setIsGenerating(true);
    setError(null);
    
    // Find original user message
    const messageIndex = messages.findIndex(m => m.id === messageId);
    const userMessage = messages
      .slice(0, messageIndex)
      .reverse()
      .find(m => m.role === 'user');
    
    if (!userMessage) {
      setError('Could not find original message');
      setIsGenerating(false);
      return;
    }
    
    // Update message to pending
    setMessages(prev => prev.map(msg => 
      msg.id === messageId 
        ? { ...msg, status: 'pending', level: newLevel }
        : msg
    ));
    
    try {
      const response = await regenerateAtLevel({
        originalContent: userMessage.content,
        newLevel,
        sessionId: 'guest-session',
      });
      
      // Update with new response
      setMessages(prev => prev.map(msg => 
        msg.id === messageId 
          ? { 
              ...msg, 
              content: response.content, 
              level: newLevel,
              status: 'complete' 
            }
          : msg
      ));
      
    } catch (error) {
      console.error('Failed to regenerate:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
      
      setMessages(prev => prev.map(msg => 
        msg.id === messageId 
          ? { ...msg, status: 'error' }
          : msg
      ));
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div>
      {error && <div className="error">{error}</div>}
      {messages.map(message => (
        <MessageBubble 
          key={message.id}
          message={message}
          onLevelChange={handleLevelChange}
        />
      ))}
      <ChatInput 
        onSend={handleSendMessage}
        disabled={isGenerating}
      />
    </div>
  );
}
```

### After: Simple Component
```tsx
// ✅ AFTER: Simple event-driven component
export function ChatInterface() {
  const {
    messages,
    isGenerating,
    error,
    sendMessage,
    regenerateMessage,
  } = useChatWithConvex();

  const handleSendMessage = (content: string) => {
    sendMessage(content);
  };

  const handleLevelChange = (messageId: string, newLevel: string) => {
    regenerateMessage(messageId, newLevel);
  };

  return (
    <div>
      {error && <div className="error">{error}</div>}
      {messages.map(message => (
        <MessageBubble 
          key={message.id}
          message={message}
          onLevelChange={handleLevelChange}
        />
      ))}
      <ChatInput 
        onSend={handleSendMessage}
        disabled={isGenerating}
      />
    </div>
  );
}
```

### Supporting Files Created

1. **State Machine** (`app/lib/hooks/use-chat.ts`)
2. **Service Layer** (`app/lib/services/chat-convex-service.ts`)
3. **Wrapper Hook** (`app/lib/hooks/use-chat-with-convex.ts`)

## 📝 Migration Template

Use this template for each component migration:

### 1. Service Interface
```tsx
// app/lib/services/[domain]-convex-service.ts
export interface [Domain]Service {
  [operation]: (params: [Params]) => Promise<[Result]>;
}

let service: [Domain]Service | null = null;

export function set[Domain]Service(newService: [Domain]Service) {
  service = newService;
}

export function get[Domain]Service(): [Domain]Service {
  if (!service) throw new Error('[Domain]Service not initialized');
  return service;
}

export async function [operation]([params]: [Params]) {
  return get[Domain]Service().[operation]([params]);
}
```

### 2. State Machine
```tsx
// app/lib/hooks/use-[domain].ts
interface [Domain]Context {
  data: [DataType] | null;
  error: string | null;
  isLoading: boolean;
}

type [Domain]Event =
  | { type: '[ACTION]'; [params]: [ParamType] }
  | { type: '[OTHER_ACTION]'; [params]: [ParamType] };

const [domain]Machine = createMachine({
  initial: 'idle',
  context: {
    data: null,
    error: null,
    isLoading: false,
  } as [Domain]Context,
  states: {
    idle: {
      on: {
        [ACTION]: 'processing'
      }
    },
    processing: {
      invoke: {
        src: '[operation]',
        input: ({ event }) => event.[params],
        onDone: 'success',
        onError: 'error'
      }
    },
    success: { /* ... */ },
    error: { /* ... */ }
  }
}, {
  actors: {
    [operation]: fromPromise(async ({ input }) => {
      return [operation](input);
    }),
  },
});
```

### 3. Wrapper Hook
```tsx
// app/lib/hooks/use-[domain]-with-convex.ts
export function use[Domain]WithConvex() {
  const [operation]Action = useAction(api.[domain].[operation]);

  useEffect(() => {
    const service: [Domain]Service = {
      [operation]: async (params) => [operation]Action(params),
    };
    set[Domain]Service(service);
  }, [[operation]Action]);

  return use[Domain]();
}
```

## ✅ Post-Migration Verification

After migration, verify:
- [ ] **Component has no async/await**
- [ ] **Component has no try/catch blocks**
- [ ] **Component has no useAction/useMutation**
- [ ] **Component only dispatches events**
- [ ] **All business logic in state machine**
- [ ] **Service layer abstracts API calls**
- [ ] **Error handling centralized**
- [ ] **Tests pass and coverage maintained**

## 🚀 Benefits Achieved

After migration, you'll have:
- **Simpler components** - Easy to understand and test
- **Predictable state** - Clear state transitions
- **Centralized error handling** - Consistent error management
- **Reusable business logic** - State machines can be shared
- **Better testability** - Each layer can be tested independently
- **Improved maintainability** - Clear separation of concerns

## 🎯 Next Steps

1. **Identify highest-impact components** first
2. **Start with simplest cases** to build confidence
3. **Create reusable patterns** for similar components
4. **Update tests** to match new architecture
5. **Document domain-specific patterns** as you create them 
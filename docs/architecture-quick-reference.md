# Architecture Quick Reference

## 🚨 Red Flags - Stop and Refactor

If you see ANY of these patterns in a React component, it needs to be refactored:

```tsx
// 🚨 RED FLAG: Async logic in component
const handleSubmit = async () => {
  setIsLoading(true);
  try {
    const result = await api.call();
    // ...
  } catch (error) {
    setError(error);
  }
};

// 🚨 RED FLAG: Direct API calls
const generateResponse = useAction(api.generate);
const mutate = useMutation(api.update);

// 🚨 RED FLAG: Multiple related state hooks
const [isLoading, setIsLoading] = useState(false);
const [isGenerating, setIsGenerating] = useState(false);
const [error, setError] = useState(null);
const [pendingId, setPendingId] = useState(null);

// 🚨 RED FLAG: Complex error handling
if (error) {
  console.error('Error:', error);
  setError(null);
  // complex recovery logic...
}
```

## ✅ Correct Patterns

### Component Structure
```tsx
// ✅ CORRECT: Simple, event-driven component
export function MyComponent() {
  const { 
    state, 
    isLoading, 
    error,
    sendMessage,
    regenerateResponse 
  } = useMyFeatureWithConvex();

  const handleSubmit = (data: FormData) => {
    sendMessage(data.content); // Simple event dispatch
  };

  const handleRegenerate = (id: string, level: Level) => {
    regenerateResponse(id, level); // Simple event dispatch
  };

  return (
    <div>
      {/* UI rendering */}
      {error && <ErrorDisplay error={error} />}
      {isLoading && <LoadingSpinner />}
      {/* ... */}
    </div>
  );
}
```

### State Machine Structure
```tsx
// ✅ CORRECT: State machine handles complexity
const myFeatureMachine = createMachine({
  initial: 'idle',
  context: {
    data: null,
    error: null,
    isLoading: false,
  },
  states: {
    idle: {
      on: {
        SEND_MESSAGE: 'processing'
      }
    },
    processing: {
      invoke: {
        src: 'processMessage',
        onDone: 'success',
        onError: 'error'
      }
    },
    success: {
      on: {
        SEND_MESSAGE: 'processing'
      }
    },
    error: {
      on: {
        RETRY: 'processing',
        SEND_MESSAGE: 'processing'
      }
    }
  }
});
```

### Service Layer Structure
```tsx
// ✅ CORRECT: Service abstraction
export interface MyFeatureService {
  processMessage: (params: MessageParams) => Promise<ProcessedMessage>;
  regenerateAt: (params: RegenerateParams) => Promise<ProcessedMessage>;
}

export function useMyFeatureWithConvex() {
  const processAction = useAction(api.myFeature.process);
  const regenerateAction = useAction(api.myFeature.regenerate);

  useEffect(() => {
    const service: MyFeatureService = {
      processMessage: async (params) => processAction(params),
      regenerateAt: async (params) => regenerateAction(params),
    };
    setMyFeatureService(service);
  }, [processAction, regenerateAction]);

  return useMyFeature();
}
```

## 📋 Code Review Checklist

### Before Committing
- [ ] **No async/await in any component function**
- [ ] **No try/catch blocks in components**
- [ ] **No useAction/useMutation directly in components**
- [ ] **No complex useState combinations**
- [ ] **All business logic in state machines**
- [ ] **Service layer for all external calls**

### File Organization
- [ ] **State machines in `app/lib/hooks/` or `app/lib/machines/`**
- [ ] **Services in `app/lib/services/`**
- [ ] **Wrapper hooks follow naming convention**

### State Machine Requirements
- [ ] **All async operations use `invoke` with actors**
- [ ] **Error handling centralized in state machine**
- [ ] **Clear state transitions defined**
- [ ] **Context properly typed**

## 🏗️ Architecture Layers

```
┌─────────────────────┐
│   React Component   │ ← Only UI + Event Dispatch
└─────────┬───────────┘
          │ events
┌─────────▼───────────┐
│   State Machine     │ ← Business Logic + State
└─────────┬───────────┘
          │ calls
┌─────────▼───────────┐
│   Service Layer     │ ← API Abstraction
└─────────┬───────────┘
          │ HTTP/Convex
┌─────────▼───────────┐
│   External APIs     │ ← Convex, REST, etc.
└─────────────────────┘
```

## 🔧 Quick Fixes

### Convert useState to State Machine
```tsx
// Before (❌)
const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState(null);
const [data, setData] = useState(null);

// After (✅)
const { isLoading, error, data, submitData } = useMyStateMachine();
```

### Move Async to State Machine
```tsx
// Before (❌)
const handleSubmit = async (formData) => {
  try {
    setIsLoading(true);
    const result = await api.submit(formData);
    setData(result);
  } catch (error) {
    setError(error.message);
  } finally {
    setIsLoading(false);
  }
};

// After (✅)
const handleSubmit = (formData) => {
  submitData(formData);
};
```

### Extract Service Layer
```tsx
// Before (❌)
const submitAction = useAction(api.submit);
const result = await submitAction(data);

// After (✅)
// In service layer
export async function submitData(params) {
  const service = getMyService();
  return service.submit(params);
}

// In wrapper hook
useEffect(() => {
  const service = {
    submit: async (params) => submitAction(params)
  };
  setMyService(service);
}, [submitAction]);
```

This architecture ensures your code is:
- **Predictable** - State transitions are explicit
- **Testable** - Each layer can be tested independently
- **Maintainable** - Clear separation of concerns
- **Scalable** - Business logic is reusable across components 
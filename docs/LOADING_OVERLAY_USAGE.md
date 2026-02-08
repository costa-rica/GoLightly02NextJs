# LoadingOverlay Usage Guide

The `LoadingOverlay` component provides a global loading indicator with an overlay that prevents user interaction during async operations.

## Architecture

- **Component**: `src/components/LoadingOverlay.tsx`
- **Redux State**: `src/store/features/uiSlice.ts`
- **Control**: Via Redux actions `showLoading` and `hideLoading`

## Usage

### Basic Usage

```typescript
import { useAppDispatch } from "@/store/hooks";
import { showLoading, hideLoading } from "@/store/features/uiSlice";

function MyComponent() {
  const dispatch = useAppDispatch();

  const handleSubmit = async () => {
    // Show loading overlay without message
    dispatch(showLoading());

    try {
      await someAsyncOperation();
    } finally {
      dispatch(hideLoading());
    }
  };
}
```

### With Custom Message

```typescript
const handleCreateMeditation = async () => {
  // Show loading overlay with custom message
  dispatch(showLoading("Creating your meditation..."));

  try {
    await createMeditation(data);
  } finally {
    dispatch(hideLoading());
  }
};
```

### Example Messages

- `"Creating your meditation..."`
- `"Processing audio files..."`
- `"Uploading sound file..."`
- `"Deleting meditation..."`
- `"Loading..."`

## Features

- **Full-screen overlay**: Prevents all user interactions
- **Backdrop blur**: Maintains context while focusing on loading state
- **Smooth spinner animation**: Uses Tailwind's animate-spin
- **Optional message**: Pass a string to show what's happening
- **Auto body scroll lock**: Prevents scrolling while loading
- **High z-index (9999)**: Appears above all other content
- **Accessible**: Includes ARIA attributes for screen readers

## Best Practices

1. **Always use try/finally**: Ensure `hideLoading()` is called even if operation fails
2. **Be specific**: Use descriptive messages so users know what's happening
3. **Keep messages short**: 2-5 words is ideal
4. **Use for long operations**: Operations that take >500ms
5. **Don't overuse**: Not needed for instant operations or where local loading states suffice

## Integration

The `LoadingOverlay` is automatically rendered in `AppShell.tsx` and listens to Redux state changes. No additional setup needed in child components - just dispatch the actions.

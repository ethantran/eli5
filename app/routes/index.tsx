import { useState } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { GuestLanding } from '~/components/guest-landing';

export const Route = createFileRoute('/')({
  component: Home,
})

type AppMode = 'landing' | 'signup';

function Home() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<AppMode>('landing');

  const handleStartGuest = () => {
    navigate({ to: '/guest/chat' });
  };

  const handleSignUp = () => {
    setMode('signup');
    // TODO: Implement actual signup flow with Clerk
    console.log('Sign up clicked - will implement with Clerk');
  };

  const handleBackToLanding = () => {
    setMode('landing');
  };

  if (mode === 'signup') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
          <h2 className="text-2xl font-bold mb-4">Sign Up</h2>
          <p className="text-gray-600 mb-4">
            Authentication will be implemented with Clerk in the next phase.
          </p>
          <button
            onClick={handleBackToLanding}
            className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
          >
            Back to Landing
          </button>
        </div>
      </div>
    );
  }

  return (
    <GuestLanding
      onStartGuest={handleStartGuest}
      onSignUp={handleSignUp}
    />
  );
}

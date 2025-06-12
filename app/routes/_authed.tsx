import { createFileRoute, redirect } from '@tanstack/react-router'
import { SignIn, useAuth } from '@clerk/clerk-react'

export const Route = createFileRoute('/_authed')({
  component: AuthGuard,
})

function AuthGuard({ children }: { children?: React.ReactNode }) {
  const { isSignedIn, isLoaded } = useAuth()

  if (!isLoaded) {
    return <div>Loading...</div>
  }

  if (!isSignedIn) {
    return (
      <div className="flex items-center justify-center p-12">
        <SignIn routing="hash" />
      </div>
    )
  }

  return <>{children}</>
}

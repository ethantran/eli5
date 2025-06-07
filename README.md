# TanStack Start + Clerk + Convex + Claude AI

## Setup Instructions

1. **Authentication Setup**: Follow https://docs.convex.dev/auth/clerk until you have
   CLERK_PUBLISHABLE_KEY, CLERK_SECRET_KEY, and CLERK_JWT_ISSUER_DOMAIN all in the .env file and the appropriate Clerk domain in convex/auth.config.ts.

2. **Claude AI Setup**: Get your Anthropic API key from https://console.anthropic.com and set it up:
   ```bash
   npx convex env set ANTHROPIC_API_KEY "your-actual-claude-api-key-here"
   ```

3. **Start Development**: Run `npx convex dev` to start the development server.

## Features

- **Real-time Chat**: Powered by Convex for instant messaging
- **Claude AI Integration**: Generate explanations at 6 different education levels
- **Guest Mode**: Try the app without signing up
- **Level Switching**: Dynamically adjust explanation complexity

---
inclusion: always
---

# Authentication Implementation Notes

## Decision: Neon Auth with Stack Auth

We are using **Neon Auth** (powered by Stack Auth) instead of NextAuth.js for the following reasons:

### Advantages
1. **Seamless Neon Integration** - User data automatically syncs to `neon_auth` schema
2. **Simpler Setup** - Single SDK installation vs complex NextAuth configuration
3. **Modern React Support** - Built for Next.js App Router and Server Components
4. **Built-in UI Components** - Pre-built SignIn, SignUp, UserButton components
5. **No Additional Cost** - Included with Neon database
6. **OAuth Providers** - Google, GitHub, and more pre-configured

### Setup Steps for Next.js

1. **Install Stack Auth SDK:**
```bash
npm install @stackframe/stack
```

2. **Initialize Stack Auth:**
```bash
npx @stackframe/init-stack . --no-browser
```

This automatically:
- Adds `@stackframe/stack` to package.json
- Creates `stack.ts` configuration file in project root
- Wraps root layout with `StackProvider` and `StackTheme`
- Creates `app/loading.tsx` for loading states
- Creates `app/handler/[...stack]/page.tsx` for auth routes (sign-in, sign-up, etc.)

3. **Environment Variables (Already Set in .env):**
- `NEXT_PUBLIC_STACK_PROJECT_ID` - Project identifier (exposed to browser)
- `NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY` - Client-side key (exposed to browser)
- `STACK_SECRET_SERVER_KEY` - Server-side secret (server-only, NOT exposed)

**Important:** In Next.js, only variables prefixed with `NEXT_PUBLIC_` are accessible in the browser. The `STACK_SECRET_SERVER_KEY` has no prefix, so it remains server-only for security.

### Usage Patterns in Next.js

**Client Components:**
```typescript
'use client'
import { useUser } from '@stackframe/stack'

export function MyComponent() {
  const user = useUser()
  return <div>{user ? user.displayName : 'Not logged in'}</div>
}
```

**Server Components:**
```typescript
import { stackServerApp } from '@/stack'

export default async function ServerComponent() {
  const user = await stackServerApp.getUser()
  return <div>{user ? user.displayName : 'Not logged in'}</div>
}
```

**Protected Routes (Client):**
```typescript
'use client'
import { useUser } from '@stackframe/stack'

export function ProtectedComponent() {
  // Automatically redirects to /handler/sign-in if not logged in
  const user = useUser({ or: 'redirect' })
  return <div>Welcome, {user.displayName}</div>
}
```

**Protected Routes (Server):**
```typescript
import { stackServerApp } from '@/stack'

export default async function ProtectedPage() {
  // Automatically redirects to /handler/sign-in if not logged in
  const user = await stackServerApp.getUser({ or: 'redirect' })
  return <div>Welcome, {user.displayName}</div>
}
```

### Pre-built Components

Stack Auth provides ready-to-use components:

- `<SignIn />` - Complete sign-in form with OAuth buttons
- `<SignUp />` - Complete sign-up form
- `<UserButton />` - User profile dropdown with sign-out
- `<OAuthButtonGroup />` - OAuth provider buttons (Google, GitHub, etc.)
- `<MagicLinkSignIn />` - Passwordless email sign-in
- `<CredentialSignIn />` - Email/password sign-in

**Example Usage:**
```typescript
import { SignIn } from '@stackframe/stack'

export default function SignInPage() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <SignIn />
    </div>
  )
}
```

### Database Schema

Stack Auth automatically creates and manages the `neon_auth` schema in your Neon database:

- `users` table - Synced with Stack Auth cloud
- No passwords or credentials stored locally (handled securely by Stack Auth)
- Automatic sync on user creation, update, and deletion

### Anonymous Voting Implementation

For users who haven't signed in yet:

**Phase 1: Session-Based Tracking**
```typescript
import { cookies } from 'next/headers'
import { v4 as uuidv4 } from 'uuid'

export async function getOrCreateSessionId() {
  const cookieStore = cookies()
  let sessionId = cookieStore.get('debate_session_id')?.value
  
  if (!sessionId) {
    sessionId = uuidv4()
    cookieStore.set('debate_session_id', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 365 // 1 year
    })
  }
  
  return sessionId
}
```

**Phase 2: Prompt for Authentication**
```typescript
'use client'
import { useUser } from '@stackframe/stack'
import { useState, useEffect } from 'react'

export function VoteButton({ debateId }: { debateId: string }) {
  const user = useUser()
  const [voteCount, setVoteCount] = useState(0)
  
  useEffect(() => {
    // Get vote count from localStorage for anonymous users
    if (!user) {
      const count = parseInt(localStorage.getItem('vote_count') || '0')
      setVoteCount(count)
    }
  }, [user])
  
  const handleVote = async (choice: 'a' | 'b' | 'tie') => {
    if (!user && voteCount >= 5) {
      // Prompt to sign in after 5 votes
      alert('Sign in to continue voting and earn DebatePoints!')
      window.location.href = '/handler/sign-in'
      return
    }
    
    // Submit vote...
    if (!user) {
      setVoteCount(voteCount + 1)
      localStorage.setItem('vote_count', String(voteCount + 1))
    }
  }
  
  return (
    <div>
      <button onClick={() => handleVote('a')}>Vote A</button>
      <button onClick={() => handleVote('b')}>Vote B</button>
      {!user && voteCount >= 3 && (
        <p className="text-sm text-muted-foreground mt-2">
          {5 - voteCount} votes remaining. Sign in to vote unlimited!
        </p>
      )}
    </div>
  )
}
```

### Middleware for Protected Routes

Create `middleware.ts` in the project root:

```typescript
import { stackServerApp } from '@/stack'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Protect specific routes
  if (request.nextUrl.pathname.startsWith('/profile') ||
      request.nextUrl.pathname.startsWith('/dashboard')) {
    
    const user = await stackServerApp.getUser()
    
    if (!user) {
      return NextResponse.redirect(
        new URL('/handler/sign-in', request.url)
      )
    }
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: ['/profile/:path*', '/dashboard/:path*']
}
```

### User Data Access

**Get User Info:**
```typescript
// Client Component
const user = useUser()
console.log(user?.id, user?.displayName, user?.primaryEmail)

// Server Component
const user = await stackServerApp.getUser()
console.log(user?.id, user?.displayName, user?.primaryEmail)
```

**Update User Info:**
```typescript
// Client Component
const user = useUser()
await user?.update({
  displayName: 'New Name',
  profileImageUrl: 'https://...'
})
```

**Sign Out:**
```typescript
// Client Component
const user = useUser()
await user?.signOut()

// Or use the UserButton component which has built-in sign-out
import { UserButton } from '@stackframe/stack'
<UserButton />
```

### Implementation Priority

**Phase 1 (MVP - Current Sprint):**
- ✅ Anonymous voting with session tracking
- ✅ Basic Stack Auth integration
- ✅ Simple sign-in/sign-up flow with pre-built components
- ✅ User profile display

**Phase 2 (Enhanced Features):**
- User statistics dashboard
- Superforecaster badges
- DebatePoints balance tracking
- Voting history

**Phase 3 (Advanced Features):**
- Detailed user profiles
- Social features (follow users, share debates)
- Personalized leaderboards
- Achievement system

### Migration from NextAuth (If Needed Later)

If we later need NextAuth features not available in Stack Auth:
1. Keep Stack Auth as primary authentication
2. Use NextAuth only for specific OAuth providers
3. Both can coexist with proper session management
4. Use Stack Auth user ID as the primary identifier

### Troubleshooting

**Issue: Environment variables not loading**
- Ensure variables start with `NEXT_PUBLIC_` for client-side access
- Restart dev server after changing `.env`
- Check that `.env` is in project root

**Issue: Auth routes not working**
- Verify `app/handler/[...stack]/page.tsx` exists
- Check that Stack Auth initialization ran successfully
- Ensure `NEXT_PUBLIC_STACK_PROJECT_ID` is set correctly

**Issue: User data not syncing to Neon**
- Check Neon database connection
- Verify `neon_auth` schema exists
- Check Stack Auth dashboard for sync status

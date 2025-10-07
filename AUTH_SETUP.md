# Supabase Authentication Setup

This application now uses Supabase for authentication. Follow these steps to set up authentication properly.

## Prerequisites

1. A Supabase project (already configured with the credentials in `.env`)
2. Supabase URL and Anon Key (already set)

## Features Implemented

✅ **Email/Password Authentication** - Users can sign up and log in with email and password
✅ **Session Management** - Persistent sessions across page refreshes
✅ **Protected Routes** - Dashboard routes are protected and require authentication
✅ **Auto-redirect** - Unauthenticated users are redirected to login
✅ **Loading States** - Proper loading states during authentication
✅ **Error Handling** - User-friendly error messages

## Environment Variables

The following environment variables are configured in `.env`:

```env
VITE_SUPABASE_URL=https://yunovpdivpagtxnjnhyg.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Supabase Setup (if needed)

If you need to configure authentication in your Supabase project:

1. Go to your Supabase Dashboard
2. Navigate to **Authentication** > **Providers**
3. Enable **Email** provider
4. Configure email templates (optional)
5. Set up redirect URLs:
   - Site URL: `http://localhost:5173` (development)
   - Redirect URLs: `http://localhost:5173/**`

## User Registration

### Option 1: Sign Up Page
Users can create accounts using the signup page at `/signup`

### Option 2: Supabase Dashboard
Admins can create users directly in the Supabase dashboard:
1. Go to **Authentication** > **Users**
2. Click **Add user**
3. Enter email and password
4. Optionally add metadata (name, role)

### Option 3: SQL
You can also create users via SQL in Supabase SQL Editor:

```sql
-- Insert a test user
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_user_meta_data,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@ethos.edu',
  crypt('password123', gen_salt('bf')),
  now(),
  '{"name": "Admin User", "role": "Administrator"}'::jsonb,
  now(),
  now()
);
```

## Testing Authentication

### Test User Credentials
After creating a user, you can log in with:
- **Email**: admin@ethos.edu (or whatever you created)
- **Password**: password123 (or whatever you set)

### Test Flow
1. Navigate to `/login`
2. Enter credentials
3. Click "Sign In"
4. You should be redirected to `/dashboard`
5. Try refreshing - you should stay logged in
6. Click logout - you should be redirected to `/login`

## Security Features

- **Password Hashing**: Passwords are securely hashed by Supabase
- **JWT Tokens**: Secure JWT tokens for session management
- **Auto Token Refresh**: Tokens are automatically refreshed
- **Protected Routes**: Unauthorized users cannot access protected pages
- **Session Persistence**: Sessions persist across browser refreshes

## Troubleshooting

### "Invalid login credentials"
- Make sure the user exists in Supabase
- Check that email confirmation is not required (or confirm the email)
- Verify the password is correct

### "Session not found"
- Clear browser storage
- Check that Supabase URL and keys are correct
- Verify the Supabase project is active

### Redirecting to login immediately
- Check browser console for errors
- Verify environment variables are loaded
- Make sure the auth session is persisting

## API Integration

The Supabase client is configured in `src/lib/supabase.ts` and can be used throughout the app:

```typescript
import { supabase } from '@/lib/supabase';

// Get current session
const { data: { session } } = await supabase.auth.getSession();

// Get current user
const { data: { user } } = await supabase.auth.getUser();

// Query data with RLS
const { data } = await supabase
  .from('profiles')
  .select('*')
  .eq('entity_id', user?.id);
```

## Next Steps

1. **Row Level Security (RLS)**: Set up RLS policies in Supabase to secure data access
2. **Email Verification**: Enable email verification for new signups
3. **Password Reset**: Implement password reset functionality
4. **OAuth Providers**: Add Google/GitHub login if needed
5. **User Profiles**: Link auth.users to your profiles table
6. **Role-Based Access**: Implement role-based permissions

## Documentation

- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [Supabase JS Client](https://supabase.com/docs/reference/javascript/auth-signin)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)

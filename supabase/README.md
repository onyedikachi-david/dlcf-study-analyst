# Supabase Setup Guide for DLCF Study Analyst

This guide will walk you through setting up Supabase for the DLCF Study Analyst app.

## Prerequisites

- A Supabase account (sign up at https://supabase.com)
- Node.js and npm installed
- The DLCF Study Analyst app cloned locally

## Step 1: Create a Supabase Project

1. Go to https://app.supabase.com
2. Click "New Project"
3. Fill in the project details:
   - **Name**: `dlcf-study-analyst` (or any name you prefer)
   - **Database Password**: Create a strong password (save this!)
   - **Region**: Choose the region closest to your users
4. Click "Create new project"
5. Wait for the project to finish setting up (usually 1-2 minutes)

## Step 2: Get Your API Keys

1. In your Supabase project dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (looks like: `https://xxxxxxxxxxxxx.supabase.co`)
   - **anon/public key** (a long string starting with `eyJ...`)

## Step 3: Configure Environment Variables

1. In the root of your project, create a `.env` file (or copy from `.env.example`):

```bash
cp .env.example .env
```

2. Edit the `.env` file and add your Supabase credentials:

```
EXPO_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

3. **Important**: Make sure `.env` is in your `.gitignore` file to avoid committing secrets!

## Step 4: Run the Database Schema

1. In your Supabase dashboard, go to **SQL Editor**
2. Click "New Query"
3. Copy the entire contents of `supabase/schema.sql` from this project
4. Paste it into the SQL Editor
5. Click "Run" to execute the schema

This will create:
- ✅ All necessary tables (profiles, study_sessions, timer_sessions, leaderboard_entries, archives)
- ✅ Row Level Security (RLS) policies
- ✅ Indexes for performance
- ✅ Triggers for automatic profile creation
- ✅ Realtime subscriptions for leaderboard

## Step 5: Set Up Storage for Avatars

1. In your Supabase dashboard, go to **Storage**
2. Click "Create a new bucket"
3. Configure the bucket:
   - **Name**: `avatars`
   - **Public bucket**: ✅ Checked (so avatars are publicly accessible)
4. Click "Create bucket"

### Set Storage Policies

After creating the bucket, set up the storage policies:

1. Click on the `avatars` bucket
2. Go to **Policies**
3. Add the following policies:

**Policy 1: Public Read Access**
- **Policy name**: Avatar images are publicly accessible
- **Allowed operation**: SELECT
- **Target roles**: public
- **USING expression**: `bucket_id = 'avatars'`

**Policy 2: Authenticated Upload**
- **Policy name**: Anyone can upload an avatar
- **Allowed operation**: INSERT
- **Target roles**: authenticated
- **WITH CHECK expression**: `bucket_id = 'avatars'`

**Policy 3: Users Can Update Their Own Avatars**
- **Policy name**: Users can update their own avatar
- **Allowed operation**: UPDATE
- **Target roles**: authenticated
- **USING expression**: `bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]`

**Policy 4: Users Can Delete Their Own Avatars**
- **Policy name**: Users can delete their own avatar
- **Allowed operation**: DELETE
- **Target roles**: authenticated
- **USING expression**: `bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]`

## Step 6: Configure Authentication

1. In your Supabase dashboard, go to **Authentication** → **Providers**
2. Make sure **Email** provider is enabled (it should be by default)
3. Configure email settings:
   - Go to **Authentication** → **Email Templates**
   - Customize the email templates if desired (optional)

### Optional: Configure Email Confirmation

By default, Supabase requires email confirmation. To disable this for development:

1. Go to **Authentication** → **Settings**
2. Under "Email Auth", toggle **"Enable email confirmations"** to OFF (for development only!)
3. For production, keep this ON for security

## Step 7: Enable Realtime

1. Go to **Database** → **Replication**
2. Find the `leaderboard_entries` table
3. Toggle the switch to enable realtime for this table
4. Click "Save"

This allows real-time leaderboard updates across all connected clients!

## Step 8: Test the Connection

1. Start your Expo app:

```bash
npm start
```

2. Try to sign up with a test account
3. Check your Supabase dashboard:
   - Go to **Authentication** → **Users** to see the new user
   - Go to **Table Editor** → **profiles** to see the auto-created profile

## Database Schema Overview

### Tables

#### `profiles`
Stores user profile information (name, faculty, department, level, avatar).
- **RLS**: Users can view all profiles, but only update their own

#### `study_sessions`
Stores individual study sessions for each day of the week.
- **RLS**: Users can only view and manage their own sessions

#### `timer_sessions`
Stores Pomodoro timer sessions.
- **RLS**: Users can only view and manage their own timer sessions

#### `leaderboard_entries`
Stores weekly leaderboard entries with reactions and badges.
- **RLS**: Everyone can view, users can pin their own entry, anyone can add reactions
- **Realtime**: Enabled for live updates

#### `archives`
Stores historical weekly study data.
- **RLS**: Users can only view their own archives

## Sync Services

The app includes automatic sync services that:

1. **Profile Sync** (`profileSync.ts`)
   - Syncs profile data between local Zustand store and Supabase
   - Handles avatar uploads to Supabase Storage
   - Real-time updates when profile changes

2. **Leaderboard Sync** (`leaderboardSync.ts`)
   - Fetches and updates leaderboard in real-time
   - Handles pinning entries and reactions
   - Subscribes to Postgres changes via Realtime

3. **Study Sessions Sync** (`studySessionsSync.ts`)
   - Syncs weekly study sessions to Supabase
   - Calculates totals and statistics
   - Fetches historical data

## Usage in the App

### Initialize Sync Services

When a user signs in, initialize all sync services:

```typescript
import { initializeAllSyncServices } from '@/src/services';

// After successful login
const { user } = useAuth();
if (user) {
  await initializeAllSyncServices(user.id);
}
```

### Cleanup on Logout

When a user logs out, cleanup subscriptions:

```typescript
import { cleanupAllSyncServices } from '@/src/services';

// Before logout
await cleanupAllSyncServices();
await signOut();
```

### Sync Profile

```typescript
import { ProfileSyncService } from '@/src/services';

// Update profile
await ProfileSyncService.updateProfile(userId, {
  name: 'John Doe',
  faculty: 'Engineering',
});

// Upload avatar
const { url } = await ProfileSyncService.uploadAvatar(
  userId,
  imageUri,
  'image/jpeg'
);
```

### Pin to Leaderboard

```typescript
import { LeaderboardSyncService } from '@/src/services';

await LeaderboardSyncService.pinToLeaderboard(userId, {
  name: profile.name,
  faculty: profile.faculty,
  department: profile.department,
  level: profile.level,
  totalMinutes: 1500,
  badges: ['consistent', 'overachiever'],
});
```

### Sync Study Sessions

```typescript
import { StudySessionsSyncService } from '@/src/services';

// Sync a single day
await StudySessionsSyncService.syncDaySessions(userId, dayEntry);

// Sync entire week
await StudySessionsSyncService.syncWeekSessions(userId);
```

## Troubleshooting

### Issue: "Invalid API key"
- Check that your environment variables are correctly set in `.env`
- Make sure you're using the `anon/public` key, not the service role key
- Restart your Expo development server after changing `.env`

### Issue: "Row Level Security policy violation"
- Check that RLS policies are correctly set up in Supabase
- Verify that the user is authenticated before making requests
- Check the Supabase logs in the dashboard under **Logs** → **Postgres Logs**

### Issue: "Realtime not working"
- Ensure realtime is enabled for `leaderboard_entries` table
- Check that RLS policies allow SELECT on the table
- Verify the realtime subscription is active in browser/app console

### Issue: "Storage upload failed"
- Ensure the `avatars` bucket exists and is public
- Check storage policies are correctly configured
- Verify file size is within limits (default: 50MB)

## Security Best Practices

1. **Never commit `.env` file** - Add it to `.gitignore`
2. **Use RLS policies** - Already configured in the schema
3. **Validate data** - Add validation in your app before syncing
4. **Keep service role key secret** - Only use in backend/server code
5. **Enable email confirmation** - For production deployments
6. **Use HTTPS** - Supabase uses HTTPS by default
7. **Rate limiting** - Consider implementing rate limiting for API calls

## Next Steps

1. ✅ Set up Supabase project
2. ✅ Configure environment variables
3. ✅ Run database schema
4. ✅ Set up storage bucket
5. ✅ Test authentication
6. 🔄 Integrate sync services in your app screens
7. 🔄 Add offline support (AsyncStorage as cache)
8. 🔄 Implement data archiving on week rollover
9. 🔄 Add push notifications (optional)
10. 🔄 Deploy to production

## Support

- **Supabase Docs**: https://supabase.com/docs
- **Supabase Discord**: https://discord.supabase.com
- **Project Issues**: Open an issue in your project repository

## License

This setup guide is part of the DLCF Study Analyst project.
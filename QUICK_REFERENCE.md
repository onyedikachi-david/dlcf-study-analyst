# Quick Reference - Auth & Database

## 🚀 Quick Start (5 Minutes)

```bash
# 1. Set up environment
cp .env.example .env
# Edit .env with your Supabase URL and key

# 2. Start app
npm start
```

## 🔑 Authentication

### Get Current User
```typescript
import { useAuth } from '@/src/contexts/AuthContext';

const { user, session, loading } = useAuth();
```

### Sign Out
```typescript
const { signOut } = useAuth();
await signOut();
```

### Check if Authenticated
```typescript
const { user } = useAuth();
if (!user) {
  // Not authenticated
}
```

## 🔄 Sync Services Hook

### Import
```typescript
import { useSyncServices } from '@/src/hooks/useSyncServices';
```

### Profile Operations
```typescript
const { updateProfile, uploadAvatar } = useSyncServices();

// Update profile
await updateProfile({ name: 'John', faculty: 'Engineering' });

// Upload avatar
const { url } = await uploadAvatar(imageUri, 'image/jpeg');
```

### Study Sessions
```typescript
const { syncDaySession, syncWeekSessions, getWeekTotal } = useSyncServices();

// Sync single day
await syncDaySession(dayEntry);

// Sync entire week
await syncWeekSessions();

// Get week total
const { total } = await getWeekTotal();
```

### Leaderboard
```typescript
const { pinToLeaderboard, addReaction } = useSyncServices();

// Pin to leaderboard
await pinToLeaderboard({
  name: 'John Doe',
  faculty: 'Engineering',
  department: 'Computer Science',
  level: '300',
  totalMinutes: 1500,
  badges: ['consistent'],
});

// Add reaction
await addReaction('John Doe', 'fire');
```

## 📊 Direct Service Usage

### Profile Service
```typescript
import { ProfileSyncService } from '@/src/services';
import { useAuth } from '@/src/contexts/AuthContext';

const { user } = useAuth();

// Fetch profile
await ProfileSyncService.fetchProfile(user.id);

// Sync profile
await ProfileSyncService.syncProfile(user.id);

// Upload avatar
const { url } = await ProfileSyncService.uploadAvatar(
  user.id, 
  imageUri, 
  'image/jpeg'
);
```

### Study Sessions Service
```typescript
import { StudySessionsSyncService } from '@/src/services';

// Fetch week sessions
await StudySessionsSyncService.fetchWeekSessions(user.id);

// Sync day sessions
await StudySessionsSyncService.syncDaySessions(user.id, dayEntry);

// Get week total
const { total } = await StudySessionsSyncService.getWeekTotalMinutes(user.id);

// Get most studied topic
const { topic } = await StudySessionsSyncService.getMostStudiedTopic(user.id);
```

### Leaderboard Service
```typescript
import { LeaderboardSyncService } from '@/src/services';

// Fetch leaderboard
await LeaderboardSyncService.fetchLeaderboard();

// Pin to leaderboard
await LeaderboardSyncService.pinToLeaderboard(user.id, {
  name: 'John',
  faculty: 'Engineering',
  department: 'CS',
  level: '300',
  totalMinutes: 1500,
  badges: [],
});

// Add reaction
await LeaderboardSyncService.addReactionByName('John Doe', 'fire');

// Get user rank
const { rank } = await LeaderboardSyncService.getUserRank(user.id);
```

## 💾 Database Direct Access

### Query Data
```typescript
import { supabase } from '@/src/lib/supabase';

const { data, error } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', userId)
  .single();
```

### Insert Data
```typescript
const { error } = await supabase
  .from('study_sessions')
  .insert({
    user_id: userId,
    week_start_date: '2024-03-25',
    day_name: 'Monday',
    session_number: 1,
    start_time: '09:00',
    stop_time: '11:00',
    duration_minutes: 120,
  });
```

### Update Data
```typescript
const { error } = await supabase
  .from('profiles')
  .update({ name: 'John Doe' })
  .eq('id', userId);
```

### Upsert Data
```typescript
const { error } = await supabase
  .from('leaderboard_entries')
  .upsert({
    user_id: userId,
    week_start_date: weekStart,
    total_minutes: 1500,
  }, { onConflict: 'user_id,week_start_date' });
```

## 📱 Common Patterns

### Offline-First Update
```typescript
// 1. Update local store (instant)
setProfile({ name: newName });

// 2. Sync to cloud (background)
const { error } = await updateProfile({ name: newName });

if (error) {
  console.log('Will sync when online');
}
```

### Loading State
```typescript
const [loading, setLoading] = useState(false);

const handleSync = async () => {
  setLoading(true);
  await syncWeekSessions();
  setLoading(false);
};
```

### Error Handling
```typescript
const { error } = await updateProfile({ name });

if (error) {
  Alert.alert('Sync Failed', error.message);
} else {
  Alert.alert('Success', 'Profile updated!');
}
```

### Real-time Updates
```typescript
// Leaderboard automatically updates in real-time!
const { entries } = useLeaderboardStore();

// No polling needed - updates happen automatically
// when anyone pins or reacts
```

## 🗂️ Database Tables

| Table | Purpose | Key Fields |
|-------|---------|-----------|
| profiles | User profiles | name, faculty, department, level |
| study_sessions | Study data | day_name, start_time, stop_time, duration_minutes |
| timer_sessions | Timer history | subject, duration_mins, status |
| leaderboard_entries | Weekly board | total_minutes, reactions, badges |
| archives | Historical data | week_start_date, total_minutes, rank_on_board |

## 🔐 Security

All tables have Row Level Security (RLS):
- Users can only access their own data
- Leaderboard is publicly readable
- Reactions can be added by any authenticated user

## 🎯 Integration Checklist

- [ ] Set up Supabase project
- [ ] Add .env file with credentials
- [ ] Run schema.sql in Supabase
- [ ] Test authentication
- [ ] Update Profile screen
- [ ] Update Tracker screen
- [ ] Update Board screen
- [ ] Add reactions feature
- [ ] Test multi-device sync
- [ ] Test offline mode

## 📚 Documentation

- **Full Setup**: `supabase/README.md`
- **Integration Guide**: `INTEGRATION_GUIDE.md`
- **Summary**: `AUTH_AND_DATABASE_SUMMARY.md`

## 🆘 Quick Fixes

### "Invalid API key"
```bash
# Check .env file
cat .env
# Restart dev server
npm start
```

### "RLS policy violation"
```sql
-- Re-run schema.sql in Supabase SQL Editor
```

### "Realtime not working"
```
1. Go to Database > Replication
2. Enable for leaderboard_entries table
3. Restart app
```

## 💡 Tips

- Always update local store first, then sync
- Use `useSyncServices()` hook for easy access
- Handle errors gracefully (offline support)
- Real-time is automatic for leaderboard
- Test with multiple accounts

## 🔗 Quick Links

- Supabase Dashboard: https://app.supabase.com
- Supabase Docs: https://supabase.com/docs
- Discord Support: https://discord.supabase.com

---

**Need help?** Check `INTEGRATION_GUIDE.md` for detailed examples!
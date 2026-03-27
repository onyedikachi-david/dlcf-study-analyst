# Integration Guide: Adding Auth & Database to DLCF Study Analyst

This guide shows you how to integrate the new authentication and Supabase database features into your existing app screens.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Using Authentication](#using-authentication)
3. [Syncing Data](#syncing-data)
4. [Integrating with Existing Screens](#integrating-with-existing-screens)
5. [Best Practices](#best-practices)
6. [Examples](#examples)

## Quick Start

### 1. Complete Supabase Setup

Follow the detailed instructions in `supabase/README.md` to:
- Create a Supabase project
- Set up environment variables
- Run the database schema
- Configure storage and authentication

### 2. Install Dependencies

All dependencies are already installed. If you need to reinstall:

```bash
npm install
```

### 3. Start the App

```bash
npm start
```

The app will now show the sign-in screen for unauthenticated users.

## Using Authentication

### In Components

```tsx
import { useAuth } from '@/src/contexts/AuthContext';

function MyComponent() {
  const { user, loading, signOut } = useAuth();

  if (loading) {
    return <ActivityIndicator />;
  }

  if (!user) {
    return <Text>Not authenticated</Text>;
  }

  return (
    <View>
      <Text>Welcome {user.email}</Text>
      <Button title="Sign Out" onPress={signOut} />
    </View>
  );
}
```

### Protected Routes

Routes are automatically protected! The `_layout.tsx` handles redirecting:
- Unauthenticated users → Sign-in screen
- Authenticated users → Main app (tabs)

## Syncing Data

### Using the Custom Hook

The easiest way to sync data is using the `useSyncServices` hook:

```tsx
import { useSyncServices } from '@/src/hooks/useSyncServices';

function ProfileScreen() {
  const { updateProfile, uploadAvatar, syncProfile } = useSyncServices();
  
  const handleUpdateProfile = async () => {
    const { error } = await updateProfile({
      name: 'John Doe',
      faculty: 'Engineering',
    });
    
    if (error) {
      Alert.alert('Error', error.message);
    } else {
      Alert.alert('Success', 'Profile updated!');
    }
  };

  return (
    <Button title="Update Profile" onPress={handleUpdateProfile} />
  );
}
```

### Direct Service Usage

You can also use services directly:

```tsx
import { ProfileSyncService } from '@/src/services';
import { useAuth } from '@/src/contexts/AuthContext';

function MyComponent() {
  const { user } = useAuth();

  const handleSync = async () => {
    if (!user) return;
    
    const { error } = await ProfileSyncService.syncProfile(user.id);
    // Handle error
  };
}
```

## Integrating with Existing Screens

### 1. Profile Screen (`app/(tabs)/profile.tsx`)

**Current State**: Uses local Zustand store (`useProfileStore`)

**Integration Steps**:

```tsx
import { useSyncServices } from '@/src/hooks/useSyncServices';
import { useProfileStore } from '@/src/stores/useProfileStore';

function ProfileScreen() {
  const { profile, setProfile } = useProfileStore();
  const { updateProfile, uploadAvatar } = useSyncServices();

  const handleSave = async () => {
    // Update local store (existing code)
    setProfile({ name: newName, faculty: newFaculty });
    
    // Sync to Supabase (NEW)
    const { error } = await updateProfile({
      name: newName,
      faculty: newFaculty,
      department: newDepartment,
      level: newLevel,
    });
    
    if (error) {
      Alert.alert('Sync Error', 'Changes saved locally but failed to sync');
    }
  };

  const handleAvatarUpload = async (imageUri: string) => {
    const { url, error } = await uploadAvatar(imageUri, 'image/jpeg');
    
    if (error) {
      Alert.alert('Upload Failed', error.message);
    } else {
      setProfile({ avatarUri: url });
      Alert.alert('Success', 'Avatar uploaded!');
    }
  };

  return (
    // Your existing UI
  );
}
```

### 2. Tracker Screen (`app/(tabs)/tracker.tsx`)

**Current State**: Uses `useWeekStore` for study sessions

**Integration Steps**:

```tsx
import { useSyncServices } from '@/src/hooks/useSyncServices';
import { useWeekStore } from '@/src/stores/useWeekStore';

function TrackerScreen() {
  const { days, updateDay } = useWeekStore();
  const { syncDaySession } = useSyncServices();

  const handleDayUpdate = async (dayIndex: number, updates: any) => {
    // Update local store (existing)
    updateDay(dayIndex, updates);
    
    // Sync to Supabase (NEW)
    const dayEntry = days[dayIndex];
    const { error } = await syncDaySession(dayEntry);
    
    if (error) {
      console.error('Failed to sync day:', error);
      // Still works offline - will sync later
    }
  };

  return (
    // Your existing UI
  );
}
```

### 3. Board/Leaderboard Screen (`app/(tabs)/board.tsx`)

**Current State**: Uses `useLeaderboardStore` with demo data

**Integration Steps**:

```tsx
import { useSyncServices } from '@/src/hooks/useSyncServices';
import { useLeaderboardStore } from '@/src/stores/useLeaderboardStore';
import { useProfileStore } from '@/src/stores/useProfileStore';

function BoardScreen() {
  const { entries } = useLeaderboardStore();
  const { profile } = useProfileStore();
  const { 
    pinToLeaderboard, 
    addReaction, 
    getWeekTotal,
    refreshLeaderboard 
  } = useSyncServices();

  // Pin current week's stats to leaderboard
  const handlePinToBoard = async () => {
    const { total } = await getWeekTotal();
    
    const { error } = await pinToLeaderboard({
      name: profile.name,
      faculty: profile.faculty,
      department: profile.department,
      level: profile.level,
      totalMinutes: total,
      badges: calculateBadges(total), // Your badge logic
    });
    
    if (error) {
      Alert.alert('Error', 'Failed to pin to leaderboard');
    } else {
      Alert.alert('Success', 'Pinned to leaderboard!');
    }
  };

  // React to someone's entry
  const handleReaction = async (name: string, type: 'cheers' | 'fire' | 'star' | 'heart') => {
    const { error } = await addReaction(name, type);
    
    if (error) {
      Alert.alert('Error', 'Failed to add reaction');
    }
  };

  // Refresh leaderboard
  const handleRefresh = async () => {
    await refreshLeaderboard();
  };

  return (
    // Your existing UI with NEW features:
    // - Real-time updates (automatic)
    // - Pin button
    // - Reactions
    // - Refresh
  );
}
```

### 4. Vault/Archive Screen (`app/(tabs)/vault.tsx`)

**Integration Steps**:

```tsx
import { supabase } from '@/src/lib/supabase';
import { useAuth } from '@/src/contexts/AuthContext';

function VaultScreen() {
  const { user } = useAuth();
  const [archives, setArchives] = useState([]);

  useEffect(() => {
    if (user) {
      loadArchives();
    }
  }, [user]);

  const loadArchives = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('archives')
      .select('*')
      .eq('user_id', user.id)
      .order('week_start_date', { ascending: false });

    if (!error && data) {
      setArchives(data);
    }
  };

  const archiveCurrentWeek = async () => {
    if (!user) return;

    // Get week data from stores
    const { total } = await getWeekTotal();
    const { topic } = await getMostStudiedTopic();
    const { rank } = await getUserRank();

    const { error } = await supabase
      .from('archives')
      .insert({
        user_id: user.id,
        week_start_date: getWeekStartDate(),
        total_minutes: total,
        most_studied_topic: topic,
        rank_on_board: rank,
        badges: getCurrentBadges(),
      });

    if (!error) {
      Alert.alert('Success', 'Week archived!');
      loadArchives();
    }
  };

  return (
    // Your existing UI with archive data from DB
  );
}
```

## Best Practices

### 1. Offline-First Approach

Always update local Zustand stores first, then sync to Supabase:

```tsx
// ✅ GOOD: Local first, then sync
setProfile({ name: newName });
await updateProfile({ name: newName });

// ❌ BAD: Only updating remote
await updateProfile({ name: newName });
```

### 2. Error Handling

Always handle errors gracefully:

```tsx
const { error } = await syncProfile();
if (error) {
  // Log error but don't block user
  console.error('Sync failed:', error);
  // Maybe retry later or show a toast
  Toast.show('Will sync when online');
}
```

### 3. Loading States

Show loading indicators during sync operations:

```tsx
const [syncing, setSyncing] = useState(false);

const handleSync = async () => {
  setSyncing(true);
  const { error } = await syncProfile();
  setSyncing(false);
  
  if (!error) {
    Alert.alert('Success', 'Profile synced!');
  }
};
```

### 4. Automatic Sync

Sync data at natural points in the user flow:

```tsx
// When leaving a screen
useEffect(() => {
  return () => {
    // Sync on unmount
    syncDaySession(currentDay);
  };
}, []);

// After important actions
const handleSaveDay = async () => {
  updateDay(dayIndex, data);
  await syncDaySession(days[dayIndex]); // Sync immediately
};
```

### 5. Real-time Updates

The leaderboard automatically receives real-time updates. No polling needed!

```tsx
// This happens automatically when using LeaderboardSyncService
// The local store updates in real-time
const { entries } = useLeaderboardStore();

// Entries will update automatically when anyone pins/reacts
```

## Examples

### Complete Profile Update Flow

```tsx
import { useState } from 'react';
import { View, TextInput, Button, Alert, ActivityIndicator } from 'react-native';
import { useProfileStore } from '@/src/stores/useProfileStore';
import { useSyncServices } from '@/src/hooks/useSyncServices';

function EditProfileScreen() {
  const { profile, setProfile } = useProfileStore();
  const { updateProfile } = useSyncServices();
  const [name, setName] = useState(profile.name);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);

    // Update local store immediately
    setProfile({ name });

    // Sync to cloud
    const { error } = await updateProfile({ name });
    
    setSaving(false);

    if (error) {
      Alert.alert(
        'Sync Warning',
        'Changes saved locally but will sync when online'
      );
    } else {
      Alert.alert('Success', 'Profile updated!');
    }
  };

  return (
    <View>
      <TextInput
        value={name}
        onChangeText={setName}
        editable={!saving}
      />
      <Button
        title={saving ? 'Saving...' : 'Save'}
        onPress={handleSave}
        disabled={saving}
      />
      {saving && <ActivityIndicator />}
    </View>
  );
}
```

### Pin Weekly Stats to Leaderboard

```tsx
import { Button, Alert } from 'react-native';
import { useProfileStore } from '@/src/stores/useProfileStore';
import { useSyncServices } from '@/src/hooks/useSyncServices';

function PinToLeaderboardButton() {
  const { profile } = useProfileStore();
  const { pinToLeaderboard, getWeekTotal } = useSyncServices();
  const [pinning, setPinning] = useState(false);

  const handlePin = async () => {
    if (!profile.name || !profile.faculty) {
      Alert.alert('Error', 'Please complete your profile first');
      return;
    }

    setPinning(true);

    // Get total minutes from study sessions
    const { total, error: totalError } = await getWeekTotal();
    
    if (totalError) {
      Alert.alert('Error', 'Failed to calculate weekly total');
      setPinning(false);
      return;
    }

    // Pin to leaderboard
    const { error } = await pinToLeaderboard({
      name: profile.name,
      faculty: profile.faculty,
      department: profile.department,
      level: profile.level,
      totalMinutes: total,
      badges: [], // Add your badge calculation logic
    });

    setPinning(false);

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      Alert.alert('Success', 'Your stats are now on the leaderboard! 🎉');
    }
  };

  return (
    <Button
      title={pinning ? 'Pinning...' : 'Pin to Leaderboard'}
      onPress={handlePin}
      disabled={pinning}
    />
  );
}
```

### Avatar Upload with Image Picker

```tsx
import * as ImagePicker from 'expo-image-picker';
import { Button, Image, Alert } from 'react-native';
import { useProfileStore } from '@/src/stores/useProfileStore';
import { useSyncServices } from '@/src/hooks/useSyncServices';

function AvatarPicker() {
  const { profile, setProfile } = useProfileStore();
  const { uploadAvatar } = useSyncServices();
  const [uploading, setUploading] = useState(false);

  const pickImage = async () => {
    // Request permission
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photos');
      return;
    }

    // Pick image
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      await handleUpload(result.assets[0].uri);
    }
  };

  const handleUpload = async (uri: string) => {
    setUploading(true);

    const { url, error } = await uploadAvatar(uri, 'image/jpeg');

    setUploading(false);

    if (error) {
      Alert.alert('Upload Failed', error.message);
    } else if (url) {
      setProfile({ avatarUri: url });
      Alert.alert('Success', 'Avatar updated!');
    }
  };

  return (
    <View>
      {profile.avatarUri && (
        <Image
          source={{ uri: profile.avatarUri }}
          style={{ width: 100, height: 100, borderRadius: 50 }}
        />
      )}
      <Button
        title={uploading ? 'Uploading...' : 'Change Avatar'}
        onPress={pickImage}
        disabled={uploading}
      />
    </View>
  );
}
```

## Migration Checklist

- [ ] Complete Supabase setup (`supabase/README.md`)
- [ ] Test authentication (sign up, sign in, sign out)
- [ ] Update Profile screen with sync functionality
- [ ] Update Tracker screen to sync study sessions
- [ ] Update Board screen to use real leaderboard
- [ ] Update Vault screen to use database archives
- [ ] Add "Pin to Leaderboard" button
- [ ] Add reactions to leaderboard entries
- [ ] Test offline functionality
- [ ] Test real-time leaderboard updates
- [ ] Add error handling throughout
- [ ] Test with multiple users
- [ ] Add loading indicators
- [ ] Handle edge cases (network errors, etc.)

## Troubleshooting

### Data not syncing?

1. Check environment variables are set correctly
2. Check user is authenticated (`console.log(user)`)
3. Check Supabase logs in dashboard
4. Check RLS policies are correct

### Realtime not working?

1. Enable realtime for `leaderboard_entries` table
2. Check RLS SELECT policy allows viewing
3. Check subscription is active in console logs

### Avatar upload fails?

1. Check `avatars` bucket exists and is public
2. Check storage policies are configured
3. Check file size is reasonable (<5MB)

## Next Steps

1. **Add Push Notifications**: Notify users when someone reacts to their entry
2. **Add Data Export**: Let users export their study data
3. **Add Analytics**: Track usage patterns
4. **Add Social Features**: Let users follow accountability partners
5. **Add Gamification**: More badges, achievements, streaks

## Support

- Check `supabase/README.md` for detailed setup
- Check Supabase docs: https://supabase.com/docs
- Open an issue in the project repository

Happy coding! 🚀
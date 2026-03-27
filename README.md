# 📚 DLCF Study Analyst

A beautiful, feature-rich study tracking mobile app built with React Native and Expo for the DLCF (Deeper Life Campus Fellowship) community. Track your study sessions, compete on leaderboards, earn achievements, and build consistent study habits.

![React Native](https://img.shields.io/badge/React_Native-0.81-blue?logo=react)
![Expo](https://img.shields.io/badge/Expo-54-000020?logo=expo)
![Supabase](https://img.shields.io/badge/Supabase-Backend-3ECF8E?logo=supabase)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript)

## ✨ Features

### 🏠 Home Dashboard
- Weekly study progress overview with visual progress bars
- Daily goal tracking with customizable targets
- Streak tracking with milestone badges (🔥 3-day, ⚡ 5-day, 💎 7-day)
- XP leveling system based on cumulative study time
- Quick access to Pomodoro timer
- Submit weekly stats to the community leaderboard

### 📊 Leaderboard (Board)
- Community-wide study rankings
- React to other students' achievements with emojis
- Filter by all users or friends
- Pin your stats to compete with others
- Real-time sync with Supabase backend

### ⏱️ Study Tracker
- Log up to 3 study sessions per day
- Track start/stop times for each session
- Daily USR (User Study Rating) scoring system
- Course/topic logging for each day
- Built-in Pomodoro timer for focused sessions
- Visual indicators for completed sessions

### 📝 Vault (Study Facts)
- Save important study notes and facts
- Swipe-to-delete functionality
- Persistent storage for quick reference
- Perfect for memorizing key concepts

### 📈 Analytics
- Weekly study breakdown with bar charts
- Total hours studied (weekly & all-time)
- Average daily study time
- Study day consistency tracking
- Current streak visualization
- USR distribution analysis
- Most studied topic insights
- Badge collection progress

### 👤 Profile
- Customizable user profile (name, faculty, department, level)
- Accountability partner tracking
- Achievement badges display
- Season archives with historical data
- Community rank display
- Secure authentication with sign-out option

### 🏆 Achievement System
- 15+ unlockable badges
- Milestones for streaks, study hours, and consistency
- Visual badge collection in profile
- Celebratory confetti animations

## 🛠️ Tech Stack

- **Framework:** [Expo](https://expo.dev) (SDK 54)
- **Language:** TypeScript
- **Navigation:** Expo Router (file-based routing)
- **State Management:** Zustand
- **Backend:** Supabase (Auth + PostgreSQL)
- **Animations:** React Native Reanimated
- **Gestures:** React Native Gesture Handler
- **UI:** Custom components with dark/light theme support

## 📦 Installation

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (Mac) or Android Emulator

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/dlcf-study-analyst.git
   cd dlcf-study-analyst
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   
   Copy the example environment file and add your Supabase credentials:
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your Supabase project details:
   ```
   EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Start the development server**
   ```bash
   npx expo start
   ```

5. **Run on device/simulator**
   - Press `i` for iOS Simulator
   - Press `a` for Android Emulator
   - Scan QR code with Expo Go app for physical device

## 🗂️ Project Structure

```
dlcf-study-analyst/
├── app/                    # Expo Router screens
│   ├── (auth)/            # Authentication screens
│   │   ├── sign-in.tsx
│   │   ├── sign-up.tsx
│   │   └── reset-password.tsx
│   ├── (tabs)/            # Main tab screens
│   │   ├── index.tsx      # Home dashboard
│   │   ├── board.tsx      # Leaderboard
│   │   ├── tracker.tsx    # Study session tracker
│   │   ├── vault.tsx      # Study facts storage
│   │   ├── analytics.tsx  # Statistics & charts
│   │   └── profile.tsx    # User profile
│   └── _layout.tsx        # Root layout with auth
├── components/            # Reusable UI components
├── src/
│   ├── contexts/         # React contexts (Auth)
│   ├── hooks/            # Custom hooks
│   ├── lib/              # External service configs
│   ├── services/         # Sync services for Supabase
│   ├── stores/           # Zustand state stores
│   ├── theme/            # Colors and theming
│   ├── types/            # TypeScript definitions
│   └── utils/            # Helper functions
├── assets/               # Images, fonts, icons
└── supabase/            # Database migrations & types
```

## 🔐 Authentication

The app uses Supabase Authentication with:
- Email/password sign-up and sign-in
- Password reset via email
- Automatic session management
- Protected routes with auth guards

## 📱 Building for Production

### Android

```bash
# Development build
npx expo run:android

# Production APK/AAB
eas build --platform android
```

### iOS

```bash
# Development build (requires Mac)
npx expo run:ios

# Production build
eas build --platform ios
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built for the DLCF (Deeper Life Campus Fellowship) community
- Inspired by the need for better study accountability tools
- Thanks to all contributors and testers

---

<p align="center">
  Made with ❤️ for students who want to study smarter
</p>
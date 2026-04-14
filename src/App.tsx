import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import LandingScreen from './components/LandingScreen';
import RegistrationScreen from './components/RegistrationScreen';
import LoginScreen from './components/LoginScreen';
import InterestsScreen from './components/InterestsScreen';
import HomeScreen from './components/HomeScreen';
import MatchingScreen from './components/MatchingScreen';
import ChatScreen from './components/ChatScreen';
import ProfileScreen from './components/ProfileScreen';
import SecurityScreen from './components/SecurityScreen';
import AdminDashboard from './components/AdminDashboard';
import ChatsListScreen from './components/ChatsListScreen';
import SnippetsScreen from './components/SnippetsScreen';
import PrivacyPolicyScreen from './components/PrivacyPolicyScreen';
import NotificationsScreen from './components/NotificationsScreen';
import FollowsListScreen from './components/FollowsListScreen';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('landing');
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [previousScreen, setPreviousScreen] = useState('landing');
  const [followsConfig, setFollowsConfig] = useState<{ userId: string, type: 'followers' | 'following' } | null>(null);

  const navigateTo = (screen: string, params?: any) => {
    setPreviousScreen(currentScreen);
    if (screen === 'follows' && params) {
      setFollowsConfig(params);
    }
    setCurrentScreen(screen);
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'landing':
        return (
          <motion.div key="landing" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <LandingScreen onNext={() => navigateTo('registration')} onLogin={() => navigateTo('login')} />
          </motion.div>
        );
      case 'login':
        return (
          <motion.div key="login" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <LoginScreen onNext={() => navigateTo('home')} onBack={() => navigateTo('landing')} onSignUp={() => navigateTo('registration')} />
          </motion.div>
        );
      case 'registration':
        return (
          <motion.div key="registration" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <RegistrationScreen 
              onNext={() => navigateTo('interests')} 
              onBack={() => navigateTo('landing')} 
              onLogin={() => navigateTo('login')} 
              onPrivacyPolicy={() => navigateTo('privacy')}
            />
          </motion.div>
        );
      case 'privacy':
        return (
          <motion.div key="privacy" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}>
            <PrivacyPolicyScreen onBack={() => setCurrentScreen(previousScreen)} />
          </motion.div>
        );
      case 'interests':
        return (
          <motion.div key="interests" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <InterestsScreen onNext={() => navigateTo('home')} onBack={() => navigateTo('registration')} />
          </motion.div>
        );
      case 'home':
        return (
          <motion.div key="home" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <HomeScreen onSearch={() => navigateTo('matching')} onNav={navigateTo} />
          </motion.div>
        );
      case 'notifications':
        return (
          <motion.div key="notifications" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}>
            <NotificationsScreen onBack={() => setCurrentScreen(previousScreen)} />
          </motion.div>
        );
      case 'snippets':
        return (
          <motion.div key="snippets" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <SnippetsScreen onNav={navigateTo} />
          </motion.div>
        );
      case 'matching':
        return (
          <motion.div key="matching" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.05 }}>
            <MatchingScreen 
              onCancel={() => navigateTo('home')} 
              onMatch={(chatId) => {
                setCurrentChatId(chatId);
                navigateTo('chat');
              }} 
            />
          </motion.div>
        );
      case 'chat':
        return (
          <motion.div key="chat" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
            <ChatScreen chatId={currentChatId} onBack={() => navigateTo('chats')} />
          </motion.div>
        );
      case 'chats':
        return (
          <motion.div key="chats" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.05 }}>
            <ChatsListScreen 
              onChatSelect={(chatId) => {
                setCurrentChatId(chatId);
                navigateTo('chat');
              }}
              onBack={() => navigateTo('home')}
              onNav={navigateTo}
            />
          </motion.div>
        );
      case 'profile':
        return (
          <motion.div key="profile" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}>
            <ProfileScreen onNav={navigateTo} />
          </motion.div>
        );
      case 'follows':
        return (
          <motion.div key="follows" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            {followsConfig && (
              <FollowsListScreen 
                userId={followsConfig.userId} 
                type={followsConfig.type} 
                onBack={() => navigateTo('profile')} 
              />
            )}
          </motion.div>
        );
      case 'security':
        return (
          <motion.div key="security" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
            <SecurityScreen onBack={() => navigateTo('profile')} onPrivacyPolicy={() => navigateTo('privacy')} />
          </motion.div>
        );
      case 'admin':
        return (
          <motion.div key="admin" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}>
            <AdminDashboard onBack={() => navigateTo('home')} />
          </motion.div>
        );
      default:
        return (
          <motion.div key="default" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <LandingScreen onNext={() => navigateTo('registration')} onLogin={() => navigateTo('login')} />
          </motion.div>
        );
    }
  };

  return (
    <div className="bg-background min-h-screen overflow-x-hidden">
      <AnimatePresence mode="wait">
        {renderScreen()}
      </AnimatePresence>
    </div>
  );
}

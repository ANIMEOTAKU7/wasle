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

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('landing');
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);

  const renderScreen = () => {
    switch (currentScreen) {
      case 'landing':
        return (
          <motion.div key="landing" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <LandingScreen onNext={() => setCurrentScreen('registration')} onLogin={() => setCurrentScreen('login')} />
          </motion.div>
        );
      case 'login':
        return (
          <motion.div key="login" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <LoginScreen onNext={() => setCurrentScreen('home')} onBack={() => setCurrentScreen('landing')} onSignUp={() => setCurrentScreen('registration')} />
          </motion.div>
        );
      case 'registration':
        return (
          <motion.div key="registration" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <RegistrationScreen onNext={() => setCurrentScreen('interests')} onBack={() => setCurrentScreen('landing')} onLogin={() => setCurrentScreen('login')} />
          </motion.div>
        );
      case 'interests':
        return (
          <motion.div key="interests" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <InterestsScreen onNext={() => setCurrentScreen('home')} onBack={() => setCurrentScreen('registration')} />
          </motion.div>
        );
      case 'home':
        return (
          <motion.div key="home" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <HomeScreen onSearch={() => setCurrentScreen('matching')} onNav={setCurrentScreen} />
          </motion.div>
        );
      case 'snippets':
        return (
          <motion.div key="snippets" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <SnippetsScreen onNav={setCurrentScreen} />
          </motion.div>
        );
      case 'matching':
        return (
          <motion.div key="matching" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.05 }}>
            <MatchingScreen 
              onCancel={() => setCurrentScreen('home')} 
              onMatch={(chatId) => {
                setCurrentChatId(chatId);
                setCurrentScreen('chat');
              }} 
            />
          </motion.div>
        );
      case 'chat':
        return (
          <motion.div key="chat" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
            <ChatScreen chatId={currentChatId} onBack={() => setCurrentScreen('chats')} />
          </motion.div>
        );
      case 'chats':
        return (
          <motion.div key="chats" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.05 }}>
            <ChatsListScreen 
              onChatSelect={(chatId) => {
                setCurrentChatId(chatId);
                setCurrentScreen('chat');
              }}
              onBack={() => setCurrentScreen('home')}
              onNav={setCurrentScreen}
            />
          </motion.div>
        );
      case 'profile':
        return (
          <motion.div key="profile" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}>
            <ProfileScreen onNav={setCurrentScreen} />
          </motion.div>
        );
      case 'security':
        return (
          <motion.div key="security" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
            <SecurityScreen onBack={() => setCurrentScreen('profile')} />
          </motion.div>
        );
      case 'admin':
        return (
          <motion.div key="admin" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}>
            <AdminDashboard onBack={() => setCurrentScreen('home')} />
          </motion.div>
        );
      default:
        return (
          <motion.div key="default" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <LandingScreen onNext={() => setCurrentScreen('registration')} onLogin={() => setCurrentScreen('login')} />
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

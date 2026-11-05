import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { HomePage } from './pages/HomePage';
import { AuthPage } from './pages/AuthPage';
import { ChatInterface } from './pages/ChatInterface';
import { LegalPage } from './pages/LegalPage';
import { InfoPage } from './pages/InfoPage';

function AppContent() {
  const { user, loading } = useAuth();
  const [currentView, setCurrentView] = useState('home'); // 'home' | 'chat' | 'auth' | 'legal' | 'info'
  const [legalType, setLegalType] = useState('privacy');
  const [infoType, setInfoType] = useState('features');

  if (loading) {
    return (
      <div className="min-h-screen bg-nexora-darkest flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-nexora-accent border-t-transparent animate-spin" />
      </div>
    );
  }

  // Routing Handler
  const handleStartChat = () => {
    if (user) {
      setCurrentView('chat');
    } else {
      setCurrentView('auth');
    }
  };

  const handleOpenLegal = (type) => {
    setLegalType(type);
    setCurrentView('legal');
  };

  const handleNavigateInfo = (type) => {
    setInfoType(type);
    setCurrentView('info');
  };

  if (currentView === 'chat') {
    if (!user) {
      return (
        <AuthPage
          onBack={() => setCurrentView('home')}
          onComplete={() => setCurrentView('chat')}
        />
      );
    }
    return (
      <ChatInterface
        onNavigateHome={() => setCurrentView('home')}
        onOpenLegal={handleOpenLegal}
      />
    );
  }

  if (currentView === 'auth') {
    return (
      <AuthPage
        onBack={() => setCurrentView('home')}
        onComplete={() => setCurrentView('chat')}
      />
    );
  }

  if (currentView === 'legal') {
    return (
      <LegalPage
        pageType={legalType}
        onBack={() => setCurrentView('home')}
      />
    );
  }

  if (currentView === 'info') {
    return (
      <InfoPage
        pageType={infoType}
        onBack={() => setCurrentView('home')}
        onStartChat={handleStartChat}
      />
    );
  }

  return (
    <HomePage
      onStartChat={handleStartChat}
      onOpenLegal={handleOpenLegal}
      onNavigate={handleNavigateInfo}
    />
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

import React from 'react';
import AppRouter from './routes';
import { AuthProvider } from './utils/auth';
import { LanguageProvider } from './context/LanguageContext';

/**
 * 앱 루트 컴포넌트
 */
function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <AppRouter />
      </LanguageProvider>
    </AuthProvider>
  );
}

export default App;

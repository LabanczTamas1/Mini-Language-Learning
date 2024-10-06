import React, { useState } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import Register from './Register';
import Login from './Login';
import AddLanguage from './AddLanguage';
import AddDefinition from './AddDefinition';
import ReminderPopup from './ReminderPopup';

const App: React.FC = () => {
  const [isLogin, setIsLogin] = useState<boolean>(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // State to toggle between AddLanguage and AddDefinition
  const [showAddLanguage, setShowAddLanguage] = useState<boolean>(true);
  const [selectedLanguageId, setSelectedLanguageId] = useState<string | null>(null);

  // Popup state
  const [showPopup, setShowPopup] = useState<boolean>(false);
  const [currentWord, setCurrentWord] = useState<string>('exampleWord'); // Default word to define

  const handleRegisterSuccess = (id: string) => {
    setUserId(id);
  };

  const handleLoginSuccess = (id: string, authToken: string, email: string) => {
    setUserId(id);
    setToken(authToken);
    setUserEmail(email);
    localStorage.setItem('authToken', authToken); // Store token in localStorage
  };

  // Handle logout
  const handleLogout = () => {
    setUserId(null);
    setToken(null);
    setUserEmail(null);
    localStorage.removeItem('authToken'); // Clear the token from localStorage
  };

  // Handle navigation to AddDefinition page
  const handleLanguageClick = (languageId: string) => {
    setSelectedLanguageId(languageId);
    setShowAddLanguage(false); // Hide AddLanguage when a language is clicked
  };

  // Handle going back to AddLanguage page
  const handleBackClick = () => {
    setShowAddLanguage(true); // Show AddLanguage
    setSelectedLanguageId(null); // Reset selected language
  };

  // Show the popup
  const triggerPopup = (word: string) => {
    setCurrentWord(word);
    setShowPopup(true);
  };

  // Handle submitting the definition from the popup
  const handlePopupSubmit = (definition: string) => {
    console.log('Definition submitted:', definition);
    setShowPopup(false); // Close the popup
  };

  // Handle closing the popup
  const handlePopupClose = () => {
    setShowPopup(false);
  };

  return (
    <Router>
      <div>
        <h1>Language Learning App</h1>

        {!userId ? (
          <div>
            <h2>{isLogin ? 'Login' : 'Register'} to Continue</h2>
            {isLogin ? (
              <Login onLoginSuccess={handleLoginSuccess} />
            ) : (
              <Register onRegisterSuccess={handleRegisterSuccess} />
            )}
            <button onClick={() => setIsLogin(!isLogin)}>
              {isLogin ? 'Switch to Register' : 'Switch to Login'}
            </button>
          </div>
        ) : (
          <div>
            <h2>Welcome, {userEmail}!</h2>
            <button onClick={handleLogout}>Logout</button> {/* Logout button */}

            {/* Show AddLanguage or AddDefinition based on the state */}
            {token && userId && showAddLanguage && (
              <AddLanguage userId={userId} onLanguageClick={handleLanguageClick} />
            )}

            {/* Show AddDefinition only when a language is clicked */}
            {token && userId && !showAddLanguage && selectedLanguageId && (
              <div>
                <button onClick={handleBackClick}>Back</button>
                <AddDefinition languageId={selectedLanguageId} userId={userId} />
              </div>
            )}

            {/* Example button to trigger the popup */}
            <button onClick={() => triggerPopup('NewWord')}>Define a New Word</button>

            {/* Render the ReminderPopup if showPopup is true */}
            {showPopup && (
              <ReminderPopup
                word={currentWord}
                onSubmit={handlePopupSubmit}
                onClose={handlePopupClose}
              />
            )}
          </div>
        )}
      </div>
    </Router>
  );
};

export default App;

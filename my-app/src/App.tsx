import React, { useState, useEffect } from 'react';
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

    const [currentWord, setCurrentWord] = useState('');
    const [currentDefinition, setCurrentDefinition] = useState('');
    const [showPopup, setShowPopup] = useState(false);
    const [definitionId, setDefinitionId] = useState(''); // New state for definition ID

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

    const triggerPopup = (word: string, definition: string, id: string) => {
      setCurrentWord(word);
      setCurrentDefinition(definition);
      setDefinitionId(id); // Set the definition ID for the popup
      setShowPopup(true);
      console.log("Reminder", id); // Log the ID to ensure it is correct
  };
  

    const handlePopupSubmit = (definition: string) => {
        console.log('Definition submitted:', definition);
        // Additional logic can go here, if needed
    };

    useEffect(() => {
        const ws = new WebSocket('ws://localhost:8080');

        ws.onopen = () => {
            console.log('WebSocket connection established');
        };

        ws.onmessage = (event) => {
          const data = JSON.parse(event.data);
          console.log("Received data:", data);
          // Ensure data contains definitionId
          if (data.definitionId) {
              triggerPopup(data.word, data.definition, data.definitionId);
          } else {
              console.error('definitionId is missing in the received data:', data);
          }
      };
      

        ws.onclose = () => {
            console.log('WebSocket connection closed');
        };

        ws.onerror = (error) => {
            console.error('WebSocket error:', error);
        };

        return () => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.close();
            }
        };
    }, []);

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

                        {/* Render the ReminderPopup if showPopup is true */}
                        {showPopup && (
                            <div>
                            <ReminderPopup
                                languageId={selectedLanguageId ?? undefined} // Use optional chaining to handle null
                                userId={userId}
                                word={currentWord} // Pass the current word to the ReminderPopup
                                correctDefinition={currentDefinition}
                                definitionId={definitionId} // Pass the definition ID
                                onSubmit={handlePopupSubmit}
                                onClose={() => setShowPopup(false)} // Handle popup close here
                            />
                        </div>
                        )}
                    </div>
                )}
            </div>
        </Router>
    );
};

export default App;

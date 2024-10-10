import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate, useNavigate } from 'react-router-dom';
import Register from './Register';
import Login from './Login';
import AddLanguage from './AddLanguage';
import AddDefinition from './AddDefinition';
import ReminderPopup from './ReminderPopup';
import LandingPage from './LandingPage';
import './App.css';

const App: React.FC = () => {
    const [isLogin, setIsLogin] = useState<boolean>(true);
    const [userId, setUserId] = useState<string | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [userEmail, setUserEmail] = useState<string | null>(null);
    const [showAddLanguage, setShowAddLanguage] = useState<boolean>(true);
    const [selectedLanguageId, setSelectedLanguageId] = useState<string | null>(null);
    const [currentWord, setCurrentWord] = useState('');
    const [interval, setInterval] = useState('');
    const [currentDefinition, setCurrentDefinition] = useState('');
    const [showPopup, setShowPopup] = useState(false);
    const [definitionId, setDefinitionId] = useState('');

    const navigate = useNavigate(); // Use for navigation

    const handleRegisterSuccess = (id: string) => {
        setUserId(id);
        navigate('/home'); // Navigate to home after registration
    };

    const handleLoginSuccess = (id: string, authToken: string, email: string) => {
        setUserId(id);
        setToken(authToken);
        setUserEmail(email);
        localStorage.setItem('authToken', authToken); // Store token in localStorage
        navigate('/home'); // Navigate to home after login
    };

    const handleLogout = () => {
        setUserId(null);
        setToken(null);
        setUserEmail(null);
        localStorage.removeItem('authToken'); // Clear the token from localStorage
        navigate('/'); // Navigate back to the landing page
    };

    const handleLanguageClick = (languageId: string) => {
        setSelectedLanguageId(languageId);
        setShowAddLanguage(false); // Hide AddLanguage when a language is clicked
    };

    const handleBackClick = () => {
        setShowAddLanguage(true); // Show AddLanguage
        setSelectedLanguageId(null); // Reset selected language
    };

    const triggerPopup = (word: string, definition: string, id: string, interval: string) => {
        setCurrentWord(word);
        setInterval(interval); // Set the interval here
        setCurrentDefinition(definition);
        setDefinitionId(id); // Set the definition ID for the popup
        setShowPopup(true);
    };

    const handlePopupSubmit = (definition: string) => {
        console.log('Definition submitted:', definition);
    };

    useEffect(() => {
        const ws = new WebSocket('ws://localhost:8080');

        ws.onopen = () => {
            console.log('WebSocket connection established');
        };

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.definitionId) {
                triggerPopup(data.word, data.definition, data.definitionId, data.interval);
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
        <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login onLoginSuccess={handleLoginSuccess} />} />
            <Route path="/register" element={<Register onRegisterSuccess={handleRegisterSuccess} />} />
            
            {/* Protected Routes */}
            {token && userId && (
                <Route
                path="/home"
                element={
                    <div style={{ position: 'relative', padding: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
                            {!showAddLanguage && selectedLanguageId && (
                                <button onClick={handleBackClick} style={{ marginLeft: '10px' }}>Back</button>
                            )}
                            <button onClick={handleLogout}>Logout</button>
                        </div>
                        <h2>Welcome, {userEmail}!</h2>
            
                        {showAddLanguage && (
                            <AddLanguage userId={userId} onLanguageClick={handleLanguageClick} />
                        )}
            
                        {!showAddLanguage && selectedLanguageId && (
                            <div>
                                <AddDefinition languageId={selectedLanguageId} userId={userId} />
                            </div>
                        )}
            
                        {showPopup && (
                            <ReminderPopup
                                languageId={selectedLanguageId ?? undefined}
                                userId={userId}
                                word={currentWord}
                                correctDefinition={currentDefinition}
                                definitionId={definitionId}
                                interval={interval}
                                onSubmit={handlePopupSubmit}
                                onClose={() => setShowPopup(false)}
                            />
                        )}
                    </div>
                }
            />
            
            )}

            {/* Redirect to home if authenticated, or to login if not */}
            <Route path="*" element={token ? <Navigate to="/home" /> : <Navigate to="/" />} />
        </Routes>
    );
};

export default App;

import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate, useNavigate } from 'react-router-dom';
import Register from './Register';
import Login from './Login';
import AddLanguage from './AddLanguage';
import AddDefinition from './AddDefinition';
import ReminderPopup from './ReminderPopup';
import LandingPage from './LandingPage';
import UserProfile from './UserProfile';
import './App.css';

const App: React.FC = () => {
    const [isLogin, setIsLogin] = useState<boolean>(true);
    const [userId, setUserId] = useState<string | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [userEmail, setUserEmail] = useState<string | null>(null);
    const [showAddLanguage, setShowAddLanguage] = useState<boolean>(true);
    const [selectedLanguageId, setSelectedLanguageId] = useState<string | null>(null);
    const [currentLanguageName, setCurrentLanguageName] = useState<string | null>(null);
    const [currentWord, setCurrentWord] = useState('');
    const [interval, setInterval] = useState('');
    const [currentDefinition, setCurrentDefinition] = useState('');
    const [showPopup, setShowPopup] = useState(false);
    const [definitionId, setDefinitionId] = useState('');

    const navigate = useNavigate();

    const handleRegisterSuccess = (id: string) => {
        setUserId(id);
        navigate('/home');
    };

    const handleLoginSuccess = async (id: string, authToken: string, email: string) => {
        setUserId(id);
        setToken(authToken);
        setUserEmail(email);
        localStorage.setItem('authToken', authToken);
        await fetchLanguages(id); // Fetch languages after login
        navigate('/home');
    };

    const fetchLanguages = async (userId: string) => {
        try {
            const response = await fetch(`/languages/${userId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`, // Include token for authentication
                },
            });
            const languages = await response.json();
            if (languages.length > 0) {
                // Assuming you want to set the first language's name
                setCurrentLanguageName(languages[0].learningLanguage); // Adjust this based on your data structure
            }
        } catch (error) {
            console.error('Error fetching languages:', error);
        }
    };

    const handleLogout = () => {
        setUserId(null);
        setToken(null);
        setUserEmail(null);
        setCurrentLanguageName(null); // Reset language name on logout
        localStorage.removeItem('authToken');
        navigate('/');
    };

    const handleLanguageClick = (languageId: string) => {
        setSelectedLanguageId(languageId);
        setShowAddLanguage(false);
    };

    const handleBackClick = () => {
        setShowAddLanguage(true);
        setSelectedLanguageId(null);
    };

    const triggerPopup = (word: string, definition: string, id: string, interval: string) => {
        setCurrentWord(word);
        setInterval(interval);
        setCurrentDefinition(definition);
        setDefinitionId(id);
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
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                <button onClick={() => navigate('/profile')} style={{ marginBottom: '0px' }}>
                                    View Profile
                                </button>
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                    <button onClick={handleLogout} style={{ marginLeft: '10px' }}>Logout</button>
                                </div>
                            </div>

                            <h2>Welcome, {userEmail}!</h2>
                            {!showAddLanguage && selectedLanguageId && (
                                <button onClick={handleBackClick} style={{ marginLeft: '10px' }}>Back</button>
                            )}

                            {showAddLanguage && (
                                <AddLanguage userId={userId} onLanguageClick={handleLanguageClick} />
                            )}

                            {!showAddLanguage && selectedLanguageId && (
                                <div>
                                    <AddDefinition languageId={selectedLanguageId} userId={userId} languageName={currentLanguageName}/>
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

            {/* Profile Route */}
            {token && userId && (
                <Route
                    path="/profile"
                    element={<UserProfile userId={userId} token={token} userEmail={userEmail ?? ''} />}
                />
            )}

            {/* Redirect to home if authenticated, or to login if not */}
            <Route path="*" element={token ? <Navigate to="/home" /> : <Navigate to="/" />} />
        </Routes>
    );
};

export default App;

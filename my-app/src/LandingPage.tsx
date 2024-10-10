import React from 'react';
import { useNavigate } from 'react-router-dom';
import image from './images/7518240.jpg';


const LandingPage: React.FC = () => {
    const navigate = useNavigate();

    // Navigate to login or register
    const navigateToLogin = () => {
        navigate('/login');
    };

    const navigateToRegister = () => {
        navigate('/register');
    };

    return (
        <div className="landing-container">
            <div className="landing-image">
            <img src={image} alt="Language Learning" />
            </div>
            <div className="landing-content">
                <h1>Welcome to the Language Learning App</h1>
                <p>Learn new languages with ease. Track your progress with reminders!</p>
                <div className="landing-buttons">
                    <button onClick={navigateToLogin}>Login</button>
                    <button onClick={navigateToRegister}>Register</button>
                </div>
            </div>
        </div>
    );
};

export default LandingPage;

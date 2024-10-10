import React, { useState, useEffect } from 'react';
import './ReminderPopup.css'; // CSS for styling

interface ReminderPopupProps {
    languageId?: string;
    userId: string;
    word: string;
    correctDefinition: string;
    definitionId: string;
    interval: string; // Add interval prop
    onSubmit: (definition: string) => void;
    onClose: () => void;
}

const ReminderPopup: React.FC<ReminderPopupProps> = ({
    languageId,
    userId,
    word,
    correctDefinition,
    definitionId,
    interval, // Receive interval prop
    onSubmit,
    onClose,
}) => {
    const [definition, setDefinition] = useState<string>(''); // User's definition input
    const [isCorrect, setIsCorrect] = useState<boolean | null>(null); // Tracks correctness of user's input
    const [error, setError] = useState<string | null>(null); // Error message state
    const [authToken, setAuthToken] = useState<string | null>(null);

    useEffect(() => {
        const token = localStorage.getItem('authToken');
        setAuthToken(token); 
    }, []);

    const handleDefinitionSubmit = async () => {
        const userInput = definition.trim().toLowerCase();
        const correctInput = correctDefinition.trim().toLowerCase();

        let updatedStatus = { status: 'Failed', interval }; // Include interval in status

        if (userInput === correctInput) {
            setIsCorrect(true);
            updatedStatus.status = 'Achieved'; // Update status if correct
        } else {
            setIsCorrect(false);
        }

        if (authToken) {
            try {
                await updateReminderStatus(userId, languageId, definitionId, updatedStatus, authToken);
                onSubmit(definition);
                setTimeout(onClose, 3000);
            } catch (error) {
                console.error('Error updating reminder status:', error);
                setError('Failed to update reminder status. Please try again.');
            }
        } else {
            setError('Authentication token is missing. Please log in again.');
        }
    };

    const updateReminderStatus = async (
        userId: string,
        languageId: string | undefined,
        definitionId: string,
        updatedStatus: { status: string; interval: string },
        authToken: string
    ) => {
        try {
            if (!languageId) {
                throw new Error('Language ID is required.');
            }

            const response = await fetch(`http://localhost:3000/languages/${userId}/${languageId}/definitions/${definitionId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify(updatedStatus),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to update reminder status.');
            }

            const data = await response.json();
            console.log('Status updated:', data);
        } catch (error) {
            console.error('Error updating reminder status:', error);
            setError('Failed to update reminder status. Please try again.');
        }
    };

    return (
        <div className="reminder-popup">
            <div className="reminder-header">
                <h2>What is the definition of this word?</h2>
                <button className="close-button" onClick={onClose}>X</button>
            </div>
            <div className="reminder-content">
                <h3>{word}</h3>
                <input
                    type="text"
                    value={definition}
                    onChange={(e) => setDefinition(e.target.value)}
                    placeholder="Enter definition"
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            handleDefinitionSubmit();
                        }
                    }}
                />
                {isCorrect === true && <p className="success-message">Correct!</p>}
                {isCorrect === false && <p className="error-message">Incorrect, the correct definition is: "{correctDefinition}"</p>}
                {error && <p className="error-message">{error}</p>}
            </div>
        </div>
    );
};

export default ReminderPopup;

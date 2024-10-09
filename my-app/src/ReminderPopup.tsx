import React, { useState, useEffect } from 'react';
import './ReminderPopup.css'; // CSS for styling

interface ReminderPopupProps {
    languageId?: string; // Optional languageId
    userId: string;
    word: string;
    correctDefinition: string;
    definitionId: string;
    onSubmit: (definition: string) => void;
    onClose: () => void;
}

const ReminderPopup: React.FC<ReminderPopupProps> = ({
    languageId,
    userId,
    word,
    correctDefinition,
    definitionId,
    onSubmit,
    onClose,
}) => {
    const [definition, setDefinition] = useState<string>(''); // User's definition input
    const [isCorrect, setIsCorrect] = useState<boolean | null>(null); // Tracks correctness of user's input
    const [error, setError] = useState<string | null>(null); // Error message state
    const [interval, setInterval] = useState<string>('3_seconds'); // Interval state (e.g., 3_seconds)

    // Fetch the auth token from local storage or any other source
    const [authToken, setAuthToken] = useState<string | null>(null);
    
    useEffect(() => {
        const token = localStorage.getItem('authToken'); // Adjust this to your auth method
        setAuthToken(token); // Set the auth token state
    }, []);

    const handleDefinitionSubmit = async () => {
        const userInput = definition.trim().toLowerCase();
        const correctInput = correctDefinition.trim().toLowerCase();

        let updatedStatus: { status: string; interval: string } = { status: 'Failed', interval }; // Default status

        if (userInput === correctInput) {
            setIsCorrect(true);
            updatedStatus.status = 'Achieved'; // Status is updated to "Achieved" if correct
        } else {
            setIsCorrect(false);
        }

        // Check if authToken is available before calling updateReminderStatus
        if (authToken) {
            try {
                // Update the reminder status on the server
                await updateReminderStatus(userId, languageId, definitionId, updatedStatus, authToken);
                
                // Submit the definition and close the popup
                onSubmit(definition);
                
                // Close the popup after a 3-second delay
                setTimeout(onClose, 3000);
            } catch (error) {
                console.error('Error updating reminder status:', error);
                setError('Failed to update reminder status. Please try again.');
            }
        } else {
            setError('Authentication token is missing. Please log in again.');
        }
    };

    // Function to update reminder status (with proper TypeScript types)
    const updateReminderStatus = async (
        userId: string,
        languageId: string | undefined, // Handle optional languageId
        definitionId: string,
        updatedStatus: { status: string; interval: string }, // Include interval
        authToken: string // Add authToken as a parameter
    ) => {
        try {
            if (!languageId) {
                throw new Error('Language ID is required.');
            }

            // Construct the full URL using window.location.origin
            const response = await fetch(`http://localhost:3000/languages/${userId}/${languageId}/definitions/${definitionId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}` // Include the token in headers
                },
                body: JSON.stringify(updatedStatus), // Send both status and interval
            });

            // Check if the response is ok
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
                {/* Display feedback */}
                {isCorrect === true && <p className="success-message">Correct!</p>}
                {isCorrect === false && <p className="error-message">Incorrect, the correct definition is: "{correctDefinition}"</p>}
                {error && <p className="error-message">{error}</p>}
            </div>
        </div>
    );
};

export default ReminderPopup;

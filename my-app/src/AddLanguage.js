import React, { useState } from 'react';
import axios from 'axios';

const AddLanguage = ({ userId }) => {
    const [learningLanguage, setLearningLanguage] = useState('');
    const [translationLanguage, setTranslationLanguage] = useState('');
    const [errorMessage, setErrorMessage] = useState(''); // To store any error messages

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMessage(''); // Clear any previous error messages

        const languageData = {
            languageId: new Date().getTime(),
            learningLanguage,
            translationLanguage,
        };

        console.log('Language Data:', languageData); // Log the request payload

        try {
            const response = await axios.post(`http://localhost:3000/languages/${userId}`, languageData);
            console.log('Response:', response.data);
            alert('Language added successfully');

            // Reset input fields
            setLearningLanguage('');
            setTranslationLanguage('');
        } catch (error) {
            console.error('Axios error:', error.response ? error.response.data : error.message); // Log the error
            setErrorMessage('Failed to add language. Please try again.'); // Set error message
        }
    };

    return (
        <div>
            <h2>Add Language</h2>
            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    value={learningLanguage}
                    onChange={(e) => setLearningLanguage(e.target.value)}
                    placeholder="Learning Language"
                    required
                />
                <input
                    type="text"
                    value={translationLanguage}
                    onChange={(e) => setTranslationLanguage(e.target.value)}
                    placeholder="Translation Language"
                    required
                />
                <button type="submit">Add Language</button>
            </form>
            {errorMessage && <p style={{ color: 'red' }}>{errorMessage}</p>} {/* Display error message */}
        </div>
    );
};

export default AddLanguage;

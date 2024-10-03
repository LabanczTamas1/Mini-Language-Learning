import React from 'react';
import AddLanguage from './AddLanguage';

const App = () => {
    const userId = 1; // Example user ID, you can get this dynamically after user login

    return (
        <div>
            <h1>Language Learning App</h1>
            <AddLanguage userId={userId} />
            {/* Add other components as needed */}
        </div>
    );
};

export default App;

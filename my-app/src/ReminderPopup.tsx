import React, { useState } from 'react';
import './ReminderPopup.css'; // Import the updated CSS for styling

interface ReminderPopupProps {
    word: string;
    onSubmit: (definition: string) => void;
    onClose: () => void;
  }
  
  const ReminderPopup: React.FC<ReminderPopupProps> = ({ word, onSubmit, onClose }) => {
    const [definition, setDefinition] = useState<string>('');
  
    const handleSubmit = () => {
      onSubmit(definition);
      setDefinition(''); // Reset the definition field
    };
  
    return (
      <div>
        <h2>Reminder to Review Word: {word}</h2>
        <input
          type="text"
          value={definition}
          onChange={(e) => setDefinition(e.target.value)}
          placeholder="Enter definition"
        />
        <button onClick={handleSubmit}>Submit Definition</button>
        <button onClick={onClose}>Close</button>
      </div>
    );
  };
  
  export default ReminderPopup;
  

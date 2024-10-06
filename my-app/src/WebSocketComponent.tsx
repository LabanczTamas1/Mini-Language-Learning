import React, { useEffect, useState } from 'react';
import ReminderPopup from './ReminderPopup';

interface WebSocketComponentProps {
  userId: string | null;  // Pass userId or token from login
}

const WebSocketComponent: React.FC<WebSocketComponentProps> = ({ userId }) => {
  const [showPopup, setShowPopup] = useState<boolean>(false);
  const [reminderWord, setReminderWord] = useState<string | null>(null);

  useEffect(() => {
    let ws: WebSocket | null = null;

    // Only establish WebSocket connection if userId exists (user is logged in)
    if (userId) {
      ws = new WebSocket(`ws://localhost:3000/${userId}`);

      ws.onopen = () => {
        console.log('WebSocket connected');
      };

      ws.onmessage = (message) => {
        const data = JSON.parse(message.data);

        if (data.type === 'reminder') {
          setReminderWord(data.word);
          setShowPopup(true);
        }
      };

      ws.onclose = () => {
        console.log('WebSocket closed');
      };
    }

    return () => {
      // Close WebSocket connection when component unmounts or when user logs out
      if (ws) {
        ws.close();
      }
    };
  }, [userId]); // Re-run the effect when userId changes

  const handleSubmitDefinition = (definition: string) => {
    console.log(`Submitted definition for word: ${reminderWord}`, definition);
    setShowPopup(false); // Close the popup after submission
  };

  const handleClosePopup = () => {
    setShowPopup(false);
  };

  if (!userId) {
    // Don't render anything if user is not logged in
    return null;
  }

  return (
    <>
      {showPopup && reminderWord && (
        <ReminderPopup
          word={reminderWord}
          onSubmit={handleSubmitDefinition}
          onClose={handleClosePopup}
        />
      )}
    </>
  );
};

export default WebSocketComponent;

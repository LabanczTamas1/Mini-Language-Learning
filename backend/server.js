// Import required modules
const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const redis = require('redis');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const cron = require('node-cron');
require('dotenv').config(); // Load environment variables

// Initialize Express app
const app = express();

// Use CORS to allow requests from your frontend
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3001',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'], // List allowed methods
    allowedHeaders: ['Content-Type', 'Authorization'], // List allowed headers
}));

// Use body parser to parse incoming JSON requests
app.use(bodyParser.json());

const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', (ws) => {
    console.log('Client connected');
    ws.on('message', (message) => {
      console.log('received: %s', message);
    });
  });
  

// JWT secret key (set in environment variables for security)
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';

// Create Redis Client
const client = redis.createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6380'
});

// Redis Client event listeners
client.on('error', (err) => {
    console.error('Redis Client Error:', err);
});

client.on('connect', () => {
    console.log('Connected to Redis successfully');
});

// Connect to Redis
(async () => {
    try {
        await client.connect();
    } catch (err) {
        console.error('Failed to connect to Redis:', err);
    }
})();

// ------------------ USER AUTHENTICATION ------------------ //

// User registration route
app.post('/register', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required.' });
    }

    try {
        // Check if user already exists
        const userExists = await client.hGet('users', email);
        if (userExists) {
            return res.status(400).json({ error: 'User already exists.' });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Generate a unique user ID
        const userId = uuidv4();

        // Store user details in Redis
        await client.hSet('users', email, JSON.stringify({ userId, hashedPassword }));

        res.status(201).json({ userId });
    } catch (error) {
        console.error('Error during registration:', error.message);
        res.status(500).json({ error: 'Failed to register user.' });
    }
});

// User login route
app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required.' });
    }

    try {
        // Fetch user from Redis
        const userData = await client.hGet('users', email);
        if (!userData) {
            return res.status(400).json({ error: 'Invalid email or password.' });
        }

        const { userId, hashedPassword } = JSON.parse(userData);

        // Compare the provided password with the hashed password
        const passwordMatch = await bcrypt.compare(password, hashedPassword);
        if (!passwordMatch) {
            return res.status(400).json({ error: 'Invalid email or password.' });
        }

        // Generate a JWT token
        const token = jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: '1h' });

        res.status(200).json({ userId, token });
    } catch (error) {
        console.error('Error during login:', error.message);
        res.status(500).json({ error: 'Failed to log in.' });
    }
});

// Middleware to authenticate JWT tokens
function authenticate(req, res, next) {
    const token = req.headers['authorization'];
    if (!token) {
        return res.status(401).json({ error: 'Access denied, no token provided.' });
    }

    try {
        const decoded = jwt.verify(token.split(' ')[1], JWT_SECRET);
        req.user = decoded; // Add the decoded user info to the request
        next();
    } catch (error) {
        res.status(401).json({ error: 'Invalid token.' });
    }
}

// ------------------ LANGUAGE ROUTES (PROTECTED) ------------------ //

// Add a language (protected route)
app.post('/languages/:userId', authenticate, async (req, res) => {
    const { userId } = req.params;
    const { languageId, learningLanguage, translationLanguage } = req.body;

    if (!learningLanguage || !translationLanguage) {
        return res.status(400).json({ error: 'Both learning and translation languages are required.' });
    }

    try {
        const langIdStr = String(languageId);

        const languageData = JSON.stringify({ learningLanguage, translationLanguage });

        // Store language pair in Redis
        await client.hSet(`languages:${userId}`, langIdStr, languageData);
        await client.sAdd(`language_ids:${userId}`, langIdStr);

        res.status(200).json({ message: 'Language pair added successfully' });
    } catch (error) {
        console.error('Error adding language pair:', error.message);
        res.status(500).json({ error: 'Failed to add language pair.' });
    }
});

// Fetch all languages for a specific user (protected route)
app.get('/languages/:userId', authenticate, async (req, res) => {
    const { userId } = req.params;

    try {
        const languageIds = await client.sMembers(`language_ids:${userId}`);
        if (languageIds.length === 0) {
            return res.status(200).json([]); // No languages found
        }

        const languages = await Promise.all(languageIds.map(async (languageId) => {
            const languageData = await client.hGet(`languages:${userId}`, languageId);
            if (!languageData) return { languageId, learningLanguage: null, translationLanguage: null };

            const { learningLanguage, translationLanguage } = JSON.parse(languageData) || {};
            return { languageId, learningLanguage, translationLanguage };
        }));

        res.status(200).json(languages);
    } catch (error) {
        console.error('Error fetching languages:', error.message);
        res.status(500).json({ error: 'Failed to fetch languages.' });
    }
});

// ------------------ DEFINITION ROUTES (PROTECTED) ------------------ //

// Add a definition for a specific language (protected route)

// Route to add a definition for a specific language (protected route)
app.post('/languages/:userId/:languageId/definitions', authenticate, async (req, res) => {
    const { userId, languageId } = req.params;
    const { word, definition, reminderStatus3Seconds, reminderStatus1Minute, reminderStatus5Minutes, reminderStatus5Hours } = req.body;

    // Validate required fields
    if (!word || !definition) {
        return res.status(400).json({ error: 'Word and definition are required.' });
    }

    try {
        const definitionId = uuidv4();

        // Construct the definitionData without nesting reminder statuses
        const definitionData = JSON.stringify({
            definitionId, // Include the definitionId
            word,
            definition,
            reminderStatus3Seconds, // Directly include reminder statuses
            reminderStatus1Minute,
            reminderStatus5Minutes,
            reminderStatus5Hours
        });

        // Store the definition in Redis
        await client.hSet(`definitions:${userId}:${languageId}`, definitionId, definitionData);

        // Schedule reminders if needed
        scheduleReminders(userId, languageId, word, definition, definitionId);

        return res.status(201).json({ message: 'Definition added successfully', definitionId }); // Return the definitionId
    } catch (error) {
        console.error('Error adding definition:', error.message);
        return res.status(500).json({ error: 'Failed to add definition.' });
    }
});

// Route to update reminder status for a specific definition
app.patch('/languages/:userId/:languageId/definitions/:definitionId', authenticate, async (req, res) => {
    console.log('PATCH request received:', req.params, req.body);

    const { userId, languageId, definitionId } = req.params;
    const { status, interval } = req.body;  // Expecting status and interval (e.g., '3_seconds', '1_minute')
    console.log(`Reminder:`,status,interval);
    // Validate input
    if (!status || !interval) {
        return res.status(400).json({ error: 'Status and interval are required.' });
    }

    try {
        const definitionKey = `definitions:${userId}:${languageId}`;
        const definitionData = await client.hGet(definitionKey, definitionId);

        if (!definitionData) {
            return res.status(404).json({ error: 'Definition not found.' });
        }

        // Parse existing definition data
        const definition = JSON.parse(definitionData);

        // Update the reminder status for the given interval
        const reminderIntervals = ['reminderStatus3Seconds', 'reminderStatus1Minute', 'reminderStatus5Minutes', 'reminderStatus5Hours'];

        // Determine which reminder status to update based on the interval
        switch (interval) {
            case '3_seconds':
                definition.reminderStatus3Seconds = status;
                break;
            case '1_minute':
                definition.reminderStatus1Minute = status;
                break;
            case '5_minutes':
                definition.reminderStatus5Minutes = status;
                break;
            case '5_hours':
                definition.reminderStatus5Hours = status;
                break;
            default:
                return res.status(400).json({ error: 'Invalid interval provided.' });
        }

        // Save the updated definition data back to Redis
        await client.hSet(definitionKey, definitionId, JSON.stringify(definition));

        console.log(`Reminder status updated for user ${userId}, definition ${definitionId}, interval ${interval}, new status: ${status}`);

        return res.status(200).json({ message: 'Status updated successfully' });
    } catch (error) {
        console.error('Error updating reminder status:', error.message);
        return res.status(500).json({ error: 'Failed to update reminder status.' });
    }
});

// Function to schedule reminders
function scheduleReminders(userId, languageId, word, definition, definitionId) {    
    // Send a reminder after 3 seconds
    setTimeout(() => {
        sendReminder(userId, languageId, word, definition, definitionId, '3_seconds');
    }, 3000);

    // Send a reminder after 1 minute
    setTimeout(() => {
        sendReminder(userId, languageId, word, definition, definitionId, '1_minute');
    }, 60000); // 60 seconds

    // Send a reminder after 5 minutes
    setTimeout(() => {
        sendReminder(userId, languageId, word, definition, definitionId, '5_minutes');
    }, 300000); // 5 minutes in milliseconds

    // Send a reminder after 5 hours
    setTimeout(() => {
        sendReminder(userId, languageId, word, definition, definitionId, '5_hours');
    }, 18000000); // 5 hours in milliseconds
}

// Function to send reminders
function sendReminder(userId, languageId, word, definition, definitionId, interval) {
    console.log(`Reminder for user ${userId} to review word "${word}" - "${definition}" after ${interval}.`);
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            // Include the definitionId in the message
            client.send(JSON.stringify({ word, definition, definitionId, interval }));
        }
    });
}

// Route to fetch all definitions for a language
app.get('/languages/:userId/:languageId/definitions', authenticate, async (req, res) => {
    const { userId, languageId } = req.params;
    const { word } = req.query; // Capture the query parameter

    try {
        const definitionIds = await client.hKeys(`definitions:${userId}:${languageId}`);
        
        if (definitionIds.length === 0) {
            return res.status(200).json([]); // No definitions found
        }

        const definitions = await Promise.all(definitionIds.map(async (definitionId) => {
            const definitionData = await client.hGet(`definitions:${userId}:${languageId}`, definitionId);
            const { word: defWord, definition, reminderStatus3Seconds, reminderStatus1Minute, reminderStatus5Minutes, reminderStatus5Hours } = JSON.parse(definitionData) || {};

            // Filter definitions by the word if provided
            if (word && !defWord.toLowerCase().includes(word.toLowerCase())) {
                return null; // Exclude if it doesn't match
            }

            return { definitionId, word: defWord, definition, reminderStatus3Seconds, reminderStatus1Minute, reminderStatus5Minutes, reminderStatus5Hours };
        }));

        // Filter out any null values from the definitions array
        const filteredDefinitions = definitions.filter(def => def !== null);
        
        res.status(200).json(filteredDefinitions);
    } catch (error) {
        console.error('Error fetching definitions:', error.message);
        res.status(500).json({ error: 'Failed to fetch definitions.' });
    }
});

// Route to delete a specific definition
app.delete('/languages/:userId/:languageId/definitions/:definitionId', authenticate, async (req, res) => {
    const { userId, languageId, definitionId } = req.params;

    try {
        const definitionKey = `definitions:${userId}:${languageId}`;
        const definitionExists = await client.hExists(definitionKey, definitionId);

        if (!definitionExists) {
            return res.status(404).json({ error: 'Definition not found.' });
        }

        // Remove the definition from Redis
        await client.hDel(definitionKey, definitionId);

        return res.status(200).json({ message: 'Definition deleted successfully.' });
    } catch (error) {
        console.error('Error deleting definition:', error.message);
        return res.status(500).json({ error: 'Failed to delete definition.' });
    }
});

// Route to update a specific definition (word or definition)
app.put('/languages/:userId/:languageId/definitions/:definitionId', authenticate, async (req, res) => {
    const { userId, languageId, definitionId } = req.params;
    const { word, definition, status, interval } = req.body;

    // Validate the input for word and definition
    if (!word || !definition) {
        return res.status(400).json({ error: 'Word and definition are required.' });
    }

    // Set default values for status and interval if they are not provided
    const defaultStatus = status || 'In progress'; // Default to 'In progress'
    const defaultInterval = interval || '3_seconds'; // Default to '3_seconds'

    try {
        const definitionKey = `definitions:${userId}:${languageId}`;
        const definitionData = await client.hGet(definitionKey, definitionId);

        if (!definitionData) {
            return res.status(404).json({ error: 'Definition not found.' });
        }

        // Parse the current definition and update the word/definition fields
        const existingDefinition = JSON.parse(definitionData);
        existingDefinition.word = word;
        existingDefinition.definition = definition;

        // Update the reminder status based on the provided or default interval
        switch (defaultInterval) {
            case '3_seconds':
                existingDefinition.reminderStatus3Seconds = defaultStatus;
                break;
            case '1_minute':
                existingDefinition.reminderStatus1Minute = defaultStatus;
                break;
            case '5_minutes':
                existingDefinition.reminderStatus5Minutes = defaultStatus;
                break;
            case '5_hours':
                existingDefinition.reminderStatus5Hours = defaultStatus;
                break;
            default:
                return res.status(400).json({ error: 'Invalid interval provided.' });
        }

        // Save the updated definition back to Redis
        await client.hSet(definitionKey, definitionId, JSON.stringify(existingDefinition));

        return res.status(200).json({ message: 'Definition updated successfully.' });
    } catch (error) {
        console.error('Error updating definition:', error.message);
        return res.status(500).json({ error: 'Failed to update definition.' });
    }
});





// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

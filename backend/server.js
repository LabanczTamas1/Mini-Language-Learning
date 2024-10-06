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
    origin: process.env.FRONTEND_URL || 'http://localhost:3001'
}));

// Use body parser to parse incoming JSON requests
app.use(bodyParser.json());

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
app.post('/languages/:userId/:languageId/definitions', authenticate, async (req, res) => {
    const { userId, languageId } = req.params;
    const { word, definition } = req.body;

    if (!word || !definition) {
        return res.status(400).json({ error: 'Word and definition are required.' });
    }

    try {
        const definitionId = uuidv4();

        const definitionData = JSON.stringify({ word, definition });

        // Store the definition in Redis
        await client.hSet(`definitions:${userId}:${languageId}`, definitionId, definitionData);

        // Schedule reminders at 1 minute, 5 minutes, and 5 hours
        scheduleReminders(userId, languageId, word, definition, definitionId);

        res.status(201).json({ message: 'Definition added successfully' });
    } catch (error) {
        console.error('Error adding definition:', error.message);
        res.status(500).json({ error: 'Failed to add definition.' });
    }
});

// Function to schedule reminders
function scheduleReminders(userId, languageId, word, definition, definitionId) {
    cron.schedule('*/1 * * * *', () => sendReminder(userId, languageId, word, definition, definitionId, '1 minute'));
    cron.schedule('*/5 * * * *', () => sendReminder(userId, languageId, word, definition, definitionId, '5 minutes'));
    cron.schedule('0 */5 * * *', () => sendReminder(userId, languageId, word, definition, definitionId, '5 hours'));
}

// Function to send reminders
function sendReminder(userId, languageId, word, definition, definitionId, interval) {
    console.log(`Reminder for user ${userId} to review word "${word}" after ${interval}.`);
    // Optionally, trigger a UI notification via WebSockets, polling, etc.
}

// Fetch all definitions for a specific language (protected route)
app.get('/languages/:userId/:languageId/definitions', authenticate, async (req, res) => {
    const { userId, languageId } = req.params;

    try {
        const definitionIds = await client.hKeys(`definitions:${userId}:${languageId}`);
        if (definitionIds.length === 0) {
            return res.status(200).json([]); // No definitions found
        }

        const definitions = await Promise.all(definitionIds.map(async (definitionId) => {
            const definitionData = await client.hGet(`definitions:${userId}:${languageId}`, definitionId);
            const { word, definition } = JSON.parse(definitionData);

            return { definitionId, word, definition };
        }));

        res.status(200).json(definitions);
    } catch (error) {
        console.error('Error fetching definitions:', error.message);
        res.status(500).json({ error: 'Failed to fetch definitions.' });
    }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

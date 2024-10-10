import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './UserProfile.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faInfoCircle, faEnvelope, faSave } from '@fortawesome/free-solid-svg-icons';

interface UserProfileProps {
    userId: string;
    token: string;
    userEmail: string;
}

interface Language {
    languageId: string;
    learningLanguage: string;
    translationLanguage: string;
}

interface ReminderCounts {
    correct: number;
    inProgress: number;
    missed: number;
    total: number;
}

const UserProfile: React.FC<UserProfileProps> = ({ userId, token, userEmail }) => {
    const [name, setName] = useState('');
    const [bio, setBio] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isEditable, setIsEditable] = useState(true);
    const [languages, setLanguages] = useState<Language[]>([]);
    const [reminderCounts, setReminderCounts] = useState<Record<string, ReminderCounts>>({});

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await axios.get(`http://localhost:3000/profile/${userId}`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                setName(response.data.name || '');
                setBio(response.data.bio || '');
                if (response.data.name && response.data.bio) {
                    setIsEditable(false);
                }
            } catch (err) {
                setError('Failed to load profile');
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [userId, token]);

    useEffect(() => {
        const fetchLanguages = async () => {
            try {
                const response = await axios.get(`http://localhost:3000/languages/${userId}`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                setLanguages(response.data);
            } catch (err) {
                console.error('Error fetching languages:', err);
            }
        };

        fetchLanguages();
    }, [userId, token]);

    useEffect(() => {
        const fetchReminderCounts = async () => {
            const newReminderCounts: Record<string, ReminderCounts> = {};
            for (const lang of languages) {
                const counts = await calculateReminderCounts(lang.languageId);
                newReminderCounts[lang.languageId] = counts;
            }
            setReminderCounts(newReminderCounts);
        };

        if (languages.length > 0) {
            fetchReminderCounts();
        }
    }, [languages]);

    const calculateReminderCounts = async (languageId: string) => {
        try {
            const response = await axios.get(`http://localhost:3000/languages/${userId}/${languageId}/definitions`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            const definitions = response.data;
            const counts: ReminderCounts = { correct: 0, inProgress: 0, missed: 0, total: 0 };

            definitions.forEach((def: any) => {
                const reminderStatuses = [
                    def.reminderStatus3Seconds,
                    def.reminderStatus1Minute,
                    def.reminderStatus5Minutes,
                    def.reminderStatus5Hours,
                ];

                reminderStatuses.forEach((status) => {
                    if (status) {
                        counts.total += 1;
                        switch (status) {
                            case 'Achieved':
                                counts.correct += 1;
                                break;
                            case 'In progress':
                                counts.inProgress += 1;
                                break;
                            case 'Failed':
                                counts.missed += 1;
                                break;
                            default:
                                break;
                        }
                    }
                });
            });

            return counts;
        } catch (error) {
            console.error('Error fetching reminder counts:', error);
            return { correct: 0, inProgress: 0, missed: 0, total: 0 };
        }
    };

    const handleSave = async () => {
        try {
            await axios.put(`http://localhost:3000/profile/${userId}`, {
                name,
                bio,
            }, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            setIsEditable(false);
        } catch (err) {
            console.error('Error saving profile:', err);
            setError('Failed to save profile');
        }
    };

    if (loading) return <div>Loading...</div>;
    if (error) return <div className="error">{error}</div>;

    return (
        <div className="user-profile-container">
            <h1>User Profile</h1>
            <div className="user-profile-info">
                <div>
                    <FontAwesomeIcon icon={faEnvelope} />
                    <label>Email: </label>
                    <span>{userEmail}</span>
                </div>
                <div>
                    <FontAwesomeIcon icon={faUser} />
                    <label>Name: </label>
                    {isEditable ? (
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Enter your name"
                        />
                    ) : (
                        <span>{name}</span>
                    )}
                </div>
                <div>
                    <FontAwesomeIcon icon={faInfoCircle} />
                    <label>Bio: </label>
                    {isEditable ? (
                        <textarea
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            placeholder="Enter a short bio"
                        />
                    ) : (
                        <span>{bio}</span>
                    )}
                </div>
                {isEditable && (
                    <button onClick={handleSave}>
                        <FontAwesomeIcon icon={faSave} /> Save Profile
                    </button>
                )}
            </div>

            <h2>Language Reminder Status</h2>
            <div className="language-reminder-status">
                {languages.map(lang => {
                    const counts = reminderCounts[lang.languageId] || { correct: 0, inProgress: 0, missed: 0, total: 0 };

                    const correctPercentage = (counts.correct / counts.total) * 100 || 0;
                    const inProgressPercentage = (counts.inProgress / counts.total) * 100 || 0;
                    const missedPercentage = (counts.missed / counts.total) * 100 || 0;

                    return (
                        <div key={lang.languageId}>
                            <h3>{lang.learningLanguage} / {lang.translationLanguage}</h3>
                            <table>
                                <thead>
                                    <tr>
                                        <th>Status</th>
                                        <th>Count</th>
                                        <th>Progress</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td style={{ backgroundColor: '#c8e6c9' }}>Correct</td>
                                        <td>{counts.correct}</td>
                                        <td style={{ width: '200px' }}>
                                            <div className="progress-bar" style={{ width: `${correctPercentage}%`, backgroundColor: '#4caf50' }}>
                                                {correctPercentage.toFixed(0)}%
                                            </div>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style={{ backgroundColor: '#ffeb3b' }}>In Progress</td>
                                        <td>{counts.inProgress}</td>
                                        <td style={{ width: '200px' }}>
                                            <div className="progress-bar" style={{ width: `${inProgressPercentage}%`, backgroundColor: '#ffeb3b' }}>
                                                {inProgressPercentage.toFixed(0)}%
                                            </div>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style={{ backgroundColor: '#ffcccb' }}>Missed</td>
                                        <td>{counts.missed}</td>
                                        <td style={{ width: '200px' }}>
                                            <div className="progress-bar" style={{ width: `${missedPercentage}%`, backgroundColor: '#f44336' }}>
                                                {missedPercentage.toFixed(0)}%
                                            </div>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default UserProfile;

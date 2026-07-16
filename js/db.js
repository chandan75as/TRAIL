// js/db.js
const DB_KEY = 'sambandh_db';

const initialData = {
    users: [
        { id: 'u1', username: 'admin', password: 'password123', role: 'admin', isPremium: true, avatar: 'https://ui-avatars.com/api/?name=Admin&background=0D8ABC&color=fff' },
        { id: 'u2', username: 'john_doe', password: 'password123', role: 'user', isPremium: false, avatar: 'https://ui-avatars.com/api/?name=John+Doe' }
    ],
    posts: [
        { id: 'p1', authorId: 'u1', authorName: 'admin', title: 'Welcome to SAMBANDH', content: 'This is the first official post on the platform. Start exploring!', status: 'approved', timestamp: Date.now() - 86400000, upvotes: 42 },
        { id: 'p2', authorId: 'u2', authorName: 'john_doe', title: 'A new breakthrough in AI', content: 'Just read an amazing article about tech...', status: 'pending', timestamp: Date.now() - 3600000, upvotes: 0 }
    ],
    questions: [
        { id: 'q1', authorId: 'u2', authorName: 'john_doe', title: 'How to center a div without Flexbox?', content: 'I am struggling with older browser support.', timestamp: Date.now() - 7200000, answers: [] }
    ],
    groups: [
        { id: 'g1', name: 'Tech Enthusiasts', description: 'Discuss the latest in technology.', type: 'public', members: ['u1', 'u2'], posts: [] }
    ],
    messages: [
        { id: 'm1', authorName: 'admin', text: 'Welcome to the global chat!', timestamp: Date.now() - 10000 }
    ]
};

// Initialize DB if it doesn't exist
function initDB() {
    if (!localStorage.getItem(DB_KEY)) {
        localStorage.setItem(DB_KEY, JSON.stringify(initialData));
    }
}

// Get entire DB
function getDB() {
    return JSON.parse(localStorage.getItem(DB_KEY));
}

// Save entire DB
function saveDB(data) {
    localStorage.setItem(DB_KEY, JSON.stringify(data));
}

// Generate unique IDs
function generateId(prefix = 'id') {
    return prefix + '_' + Math.random().toString(36).substr(2, 9);
}

// Run initialization immediately
initDB();

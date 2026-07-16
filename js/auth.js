// js/auth.js
const SESSION_KEY = 'sambandh_session';

const Auth = {
    login: function(username, password) {
        const db = getDB();
        const user = db.users.find(u => u.username === username && u.password === password);
        
        if (user) {
            // Remove password before saving to session
            const sessionUser = { ...user };
            delete sessionUser.password;
            localStorage.setItem(SESSION_KEY, JSON.stringify(sessionUser));
            return true;
        }
        return false;
    },

    register: function(username, password) {
        const db = getDB();
        if (db.users.find(u => u.username === username)) {
            return false; // User exists
        }

        const newUser = {
            id: generateId('u'),
            username: username,
            password: password,
            role: 'user', // Default role
            isPremium: false,
            avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}`
        };

        db.users.push(newUser);
        saveDB(db);
        this.login(username, password); // Auto-login
        return true;
    },

    logout: function() {
        localStorage.removeItem(SESSION_KEY);
        window.location.href = 'login.html';
    },

    getCurrentUser: function() {
        const session = localStorage.getItem(SESSION_KEY);
        return session ? JSON.parse(session) : null;
    },

    requireAuth: function() {
        const user = this.getCurrentUser();
        if (!user) {
            window.location.href = 'login.html';
        }
        return user;
    },

    requireAdmin: function() {
        const user = this.requireAuth();
        if (user.role !== 'admin') {
            window.location.href = 'index.html';
        }
        return user;
    }
};

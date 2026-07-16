// js/chat.js
document.addEventListener('DOMContentLoaded', () => {
    const user = Auth.requireAuth();
    let currentMessageCount = 0; // Used to track if new messages arrived

    // Initial render
    renderChatMessages(user);

    // Form Submission
    document.getElementById('chatForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const input = document.getElementById('chatInput');
        const text = input.value.trim();

        if (text) {
            const db = getDB();
            db.messages.push({
                id: generateId('m'),
                authorId: user.id,
                authorName: user.username,
                text: text,
                timestamp: Date.now()
            });
            saveDB(db);
            
            input.value = '';
            renderChatMessages(user, true); // Force scroll on own submit
        }
    });

    // Simulate Real-time WebSocket by polling LocalStorage every 1 second
    setInterval(() => {
        renderChatMessages(user, false);
    }, 1000);
});

function renderChatMessages(currentUser, forceScroll = false) {
    const db = getDB();
    const chatWindow = document.getElementById('chat-window');
    
    // Check if new messages exist so we don't re-render unnecessarily
    if (db.messages.length === currentMessageCount && !forceScroll) {
        return; 
    }
    
    const isNewMessage = db.messages.length > currentMessageCount;
    currentMessageCount = db.messages.length;

    chatWindow.innerHTML = db.messages.map(msg => {
        const isMe = msg.authorName === currentUser.username;
        const time = new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        
        // Lookup author for avatar and premium status
        const author = db.users.find(u => u.username === msg.authorName);
        const avatar = author ? author.avatar : 'https://ui-avatars.com/api/?name=U';
        const isAdmin = author && author.role === 'admin';
        const isPremium = author && author.isPremium;

        if (isMe) {
            // Sent by Current User (Right aligned, Blue bubble)
            return `
                <div class="flex justify-end mb-4">
                    <div class="flex flex-col items-end max-w-[75%] sm:max-w-[60%]">
                        <div class="bg-blue-600 text-white rounded-2xl rounded-tr-sm px-4 py-2 shadow-sm text-sm">
                            ${msg.text}
                        </div>
                        <span class="text-[10px] text-gray-400 mt-1">${time}</span>
                    </div>
                </div>
            `;
        } else {
            // Sent by Others (Left aligned, Gray bubble)
            return `
                <div class="flex justify-start mb-4 gap-2">
                    <img src="${avatar}" class="w-8 h-8 rounded-full border border-gray-200 shrink-0 self-end mb-5">
                    <div class="flex flex-col items-start max-w-[75%] sm:max-w-[60%]">
                        <div class="flex items-center gap-1 mb-1 ml-1">
                            <span class="text-xs font-bold text-gray-700">${msg.authorName}</span>
                            ${isPremium ? '<span class="text-yellow-500 text-[10px]" title="Premium">★</span>' : ''}
                            ${isAdmin ? '<span class="bg-blue-100 text-blue-800 text-[8px] px-1 py-0.5 rounded font-bold">ADMIN</span>' : ''}
                        </div>
                        <div class="bg-white border border-gray-200 text-gray-800 rounded-2xl rounded-tl-sm px-4 py-2 shadow-sm text-sm">
                            ${msg.text}
                        </div>
                        <span class="text-[10px] text-gray-400 mt-1 ml-1">${time}</span>
                    </div>
                </div>
            `;
        }
    }).join('');

    // Auto-scroll to bottom if a new message appears or we force it (on manual submit)
    if (isNewMessage || forceScroll) {
        chatWindow.scrollTop = chatWindow.scrollHeight;
    }
}

// js/feed.js
document.addEventListener('DOMContentLoaded', () => {
    Auth.requireAuth(); // Ensure user is logged in
    
    const user = Auth.getCurrentUser();
    if(document.getElementById('mobile-avatar')) {
        document.getElementById('mobile-avatar').src = user.avatar;
    }
    
    renderFeed();
});

function renderFeed() {
    const db = getDB();
    const feedContainer = document.getElementById('feed-container');
    if (!feedContainer) return;

    // Filter only approved posts and sort by newest first
    const approvedPosts = db.posts
        .filter(post => post.status === 'approved')
        .sort((a, b) => b.timestamp - a.timestamp);

    if (approvedPosts.length === 0) {
        feedContainer.innerHTML = `
            <div class="bg-white p-8 rounded-lg shadow-sm text-center border border-gray-200">
                <p class="text-gray-500">No posts yet. Be the first to share something!</p>
            </div>`;
        return;
    }

    feedContainer.innerHTML = approvedPosts.map(post => {
        const date = new Date(post.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit' });
        const author = db.users.find(u => u.id === post.authorId);
        const avatar = author ? author.avatar : 'https://ui-avatars.com/api/?name=Unknown';
        
        return `
            <article class="bg-white sm:rounded-lg shadow-sm border-y sm:border border-gray-200 overflow-hidden">
                <div class="p-4 flex gap-3 items-center border-b border-gray-50">
                    <img src="${avatar}" alt="${post.authorName}" class="w-10 h-10 rounded-full border border-gray-200">
                    <div>
                        <p class="font-semibold text-gray-900 text-sm flex items-center gap-1">
                            ${post.authorName} 
                            ${author && author.isPremium ? '<span class="text-yellow-500 text-xs" title="Premium User">★</span>' : ''}
                            ${author && author.role === 'admin' ? '<span class="bg-blue-100 text-blue-800 text-[10px] px-1.5 py-0.5 rounded font-bold">ADMIN</span>' : ''}
                        </p>
                        <p class="text-xs text-gray-500">${date}</p>
                    </div>
                </div>
                <div class="p-4">
                    <h2 class="text-xl font-bold text-gray-900 mb-2">${post.title}</h2>
                    <p class="text-gray-700 whitespace-pre-wrap text-sm leading-relaxed">${post.content}</p>
                </div>
                <div class="px-4 py-3 bg-gray-50 border-t border-gray-100 flex items-center gap-4">
                    <button onclick="upvotePost('${post.id}')" class="flex items-center gap-1.5 text-gray-500 hover:text-blue-600 transition font-medium text-sm">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"></path></svg>
                        ${post.upvotes}
                    </button>
                    <button class="flex items-center gap-1.5 text-gray-500 hover:text-blue-600 transition font-medium text-sm">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
                        Comment
                    </button>
                </div>
            </article>
        `;
    }).join('');
}

function upvotePost(postId) {
    const db = getDB();
    const post = db.posts.find(p => p.id === postId);
    if (post) {
        post.upvotes += 1;
        saveDB(db);
        renderFeed(); // Re-render instantly to show update
    }
}

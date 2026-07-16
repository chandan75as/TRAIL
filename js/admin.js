// js/admin.js
document.addEventListener('DOMContentLoaded', () => {
    // SECURITY: Kick out anyone who isn't an admin
    Auth.requireAdmin();
    renderPendingPosts();
});

function renderPendingPosts() {
    const db = getDB();
    const container = document.getElementById('pending-container');
    if (!container) return;

    const pendingPosts = db.posts.filter(post => post.status === 'pending');

    if (pendingPosts.length === 0) {
        container.innerHTML = `
            <div class="bg-white p-8 rounded-xl shadow-sm border border-gray-200 text-center">
                <svg class="w-12 h-12 text-green-500 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                <h3 class="text-lg font-bold text-gray-900">All caught up!</h3>
                <p class="text-gray-500">There are no pending posts to review.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = pendingPosts.map(post => `
        <div class="bg-white rounded-xl shadow-sm border border-orange-200 overflow-hidden relative">
            <div class="absolute top-0 left-0 w-1 h-full bg-orange-400"></div>
            <div class="p-5">
                <div class="flex justify-between items-start mb-2">
                    <div>
                        <p class="text-sm text-gray-500 font-medium mb-1">Submitted by <span class="text-gray-900 font-bold">${post.authorName}</span></p>
                        <h2 class="text-xl font-bold text-gray-900">${post.title}</h2>
                    </div>
                    <span class="bg-orange-100 text-orange-800 text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wide">Review</span>
                </div>
                <p class="text-gray-700 text-sm bg-gray-50 p-4 rounded-lg border border-gray-100 whitespace-pre-wrap my-3">${post.content}</p>
                
                <div class="flex gap-3 mt-4 pt-4 border-t border-gray-100">
                    <button onclick="updatePostStatus('${post.id}', 'approved')" class="flex-1 bg-green-50 hover:bg-green-100 text-green-700 font-bold py-2 px-4 rounded-lg transition border border-green-200">
                        Approve Post
                    </button>
                    <button onclick="updatePostStatus('${post.id}', 'rejected')" class="flex-1 bg-red-50 hover:bg-red-100 text-red-700 font-bold py-2 px-4 rounded-lg transition border border-red-200">
                        Reject Post
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

function updatePostStatus(postId, newStatus) {
    const db = getDB();
    const postIndex = db.posts.findIndex(p => p.id === postId);
    
    if (postIndex !== -1) {
        db.posts[postIndex].status = newStatus;
        if(newStatus === 'approved') {
            db.posts[postIndex].timestamp = Date.now(); // Reset timestamp to now so it appears at top of feed
        }
        saveDB(db);
        renderPendingPosts(); // Refresh UI
    }
}

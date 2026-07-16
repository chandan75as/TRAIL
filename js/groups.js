// js/groups.js
document.addEventListener('DOMContentLoaded', () => {
    Auth.requireAuth();

    if (document.getElementById('groups-container')) {
        initGroupsList();
    } else if (document.getElementById('group-header')) {
        initGroupDetail();
    }
});

/* =======================================
   GROUPS HUB (groups.html)
   ======================================= */
function initGroupsList() {
    renderGroups();

    document.getElementById('createGroupForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const user = Auth.getCurrentUser();
        const name = document.getElementById('gName').value.trim();
        const desc = document.getElementById('gDesc').value.trim();

        if (name && desc) {
            const db = getDB();
            db.groups.push({
                id: generateId('g'),
                name: name,
                description: desc,
                type: 'public',
                members: [user.id], // Creator is automatically a member
                posts: []
            });
            saveDB(db);
            
            document.getElementById('createGroupForm').reset();
            renderGroups();
        }
    });
}

function renderGroups() {
    const db = getDB();
    const user = Auth.getCurrentUser();
    const container = document.getElementById('groups-container');

    if (db.groups.length === 0) {
        container.innerHTML = `<div class="col-span-full bg-white p-8 text-center text-gray-500 rounded-lg shadow-sm border border-gray-200">No groups yet. Create one!</div>`;
        return;
    }

    container.innerHTML = db.groups.map(g => {
        const isMember = g.members.includes(user.id);
        
        return `
            <div class="bg-white p-5 sm:rounded-xl shadow-sm border-y sm:border border-gray-200 flex flex-col justify-between">
                <div>
                    <h3 class="text-xl font-bold text-gray-900 mb-1">${g.name}</h3>
                    <p class="text-sm text-gray-600 line-clamp-2 mb-3">${g.description}</p>
                    <p class="text-xs font-medium text-gray-400 mb-4">${g.members.length} member${g.members.length !== 1 ? 's' : ''}</p>
                </div>
                <div>
                    ${isMember 
                        ? `<button onclick="window.location.href='group-detail.html?groupId=${g.id}'" class="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-2 rounded-lg transition-colors border border-gray-300">View Group</button>`
                        : `<button onclick="joinGroup('${g.id}')" class="w-full bg-purple-100 hover:bg-purple-200 text-purple-700 font-bold py-2 rounded-lg transition-colors border border-purple-300">Join Group</button>`
                    }
                </div>
            </div>
        `;
    }).join('');
}

function joinGroup(groupId) {
    const db = getDB();
    const user = Auth.getCurrentUser();
    const group = db.groups.find(g => g.id === groupId);
    
    if (group && !group.members.includes(user.id)) {
        group.members.push(user.id);
        saveDB(db);
        
        if(window.location.pathname.includes('group-detail')) {
            initGroupDetail(); // Refresh detail page
        } else {
            renderGroups(); // Refresh list page
        }
    }
}

/* =======================================
   GROUP DETAIL (group-detail.html)
   ======================================= */
function initGroupDetail() {
    const urlParams = new URLSearchParams(window.location.search);
    const groupId = urlParams.get('groupId');
    const user = Auth.getCurrentUser();

    if (!groupId) {
        window.location.href = 'groups.html';
        return;
    }

    renderGroupDetailView(groupId, user);

    document.getElementById('groupPostForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const content = document.getElementById('groupPostContent').value.trim();
        if (content) {
            const db = getDB();
            const group = db.groups.find(g => g.id === groupId);
            
            group.posts.push({
                id: generateId('gp'),
                authorId: user.id,
                authorName: user.username,
                content: content,
                timestamp: Date.now()
            });
            saveDB(db);
            
            document.getElementById('groupPostContent').value = '';
            renderGroupDetailView(groupId, user);
        }
    });
}

function renderGroupDetailView(groupId, user) {
    const db = getDB();
    const group = db.groups.find(g => g.id === groupId);
    
    if (!group) {
        document.getElementById('group-header').innerHTML = `<p class="text-red-500 font-bold">Group not found.</p>`;
        return;
    }

    const isMember = group.members.includes(user.id);

    // Header Render
    document.getElementById('group-header').innerHTML = `
        <div class="absolute top-0 left-0 w-full h-2 bg-purple-500"></div>
        <div class="flex justify-between items-start pt-2">
            <div>
                <h1 class="text-2xl font-bold text-gray-900">${group.name}</h1>
                <p class="text-gray-600 mt-1">${group.description}</p>
                <p class="text-sm text-gray-500 font-medium mt-3">${group.members.length} member${group.members.length !== 1 ? 's' : ''}</p>
            </div>
            ${!isMember 
                ? `<button onclick="joinGroup('${group.id}')" class="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-6 rounded-lg transition">Join</button>` 
                : `<span class="bg-green-100 text-green-800 text-xs font-bold px-3 py-1.5 rounded-full border border-green-200">Joined</span>`
            }
        </div>
    `;

    // Permissions check
    if (isMember) {
        document.getElementById('group-post-form-container').classList.remove('hidden');
        renderGroupPosts(group, db);
    } else {
        document.getElementById('group-feed-container').innerHTML = `
            <div class="bg-white p-8 text-center text-gray-500 rounded-lg shadow-sm border border-gray-200">
                <svg class="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                <p class="font-bold text-gray-700">Private Feed</p>
                <p class="text-sm">You must join this group to view and create posts.</p>
            </div>
        `;
    }
}

function renderGroupPosts(group, db) {
    const container = document.getElementById('group-feed-container');
    const posts = [...group.posts].sort((a, b) => b.timestamp - a.timestamp);

    if (posts.length === 0) {
        container.innerHTML = `<div class="bg-gray-50 p-6 text-center text-gray-500 rounded-lg border border-gray-200">No posts in this group yet.</div>`;
        return;
    }

    container.innerHTML = posts.map(post => {
        const date = new Date(post.timestamp).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit' });
        const author = db.users.find(u => u.id === post.authorId);
        const avatar = author ? author.avatar : 'https://ui-avatars.com/api/?name=Unknown';

        return `
            <div class="bg-white p-4 sm:rounded-xl shadow-sm border-y sm:border border-gray-200">
                <div class="flex items-center gap-3 mb-3">
                    <img src="${avatar}" class="w-8 h-8 rounded-full border border-gray-200">
                    <div>
                        <p class="font-bold text-gray-900 text-sm">${post.authorName}</p>
                        <p class="text-xs text-gray-500">${date}</p>
                    </div>
                </div>
                <p class="text-gray-800 whitespace-pre-wrap text-sm">${post.content}</p>
            </div>
        `;
    }).join('');
}

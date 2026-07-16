// js/qa.js
document.addEventListener('DOMContentLoaded', () => {
    Auth.requireAuth();

    // Check which page we are on
    if (document.getElementById('questions-container')) {
        initQAList();
    } else if (document.getElementById('question-header')) {
        initQADetail();
    }
});

/* =======================================
   QA HUB LOGIC (qa.html)
   ======================================= */
function initQAList() {
    renderQuestions();

    document.getElementById('askQuestionForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const user = Auth.getCurrentUser();
        const title = document.getElementById('qTitle').value.trim();
        const content = document.getElementById('qContent').value.trim();

        if (title && content) {
            const db = getDB();
            db.questions.push({
                id: generateId('q'),
                authorId: user.id,
                authorName: user.username,
                title: title,
                content: content,
                timestamp: Date.now(),
                answers: [] // Array to hold nested answers
            });
            saveDB(db);
            
            document.getElementById('askQuestionForm').reset();
            renderQuestions(); // Refresh UI instantly
        }
    });
}

function renderQuestions() {
    const db = getDB();
    const container = document.getElementById('questions-container');
    
    // Sort newest first
    const questions = [...db.questions].sort((a, b) => b.timestamp - a.timestamp);

    if (questions.length === 0) {
        container.innerHTML = `<div class="bg-white p-8 text-center text-gray-500 rounded-lg shadow-sm border border-gray-200">No questions asked yet. Be the first!</div>`;
        return;
    }

    container.innerHTML = questions.map(q => {
        const date = new Date(q.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        const answerCount = q.answers.length;
        
        return `
            <a href="qa-detail.html?id=${q.id}" class="block bg-white p-5 sm:rounded-lg shadow-sm border-y sm:border border-gray-200 hover:border-indigo-300 transition-colors cursor-pointer group">
                <div class="flex items-start gap-4">
                    <div class="flex flex-col items-center justify-center p-3 rounded-lg ${answerCount > 0 ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-500'} min-w-[70px]">
                        <span class="text-xl font-bold">${answerCount}</span>
                        <span class="text-xs font-medium">Answers</span>
                    </div>
                    <div class="flex-1">
                        <h3 class="text-lg font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">${q.title}</h3>
                        <p class="text-sm text-gray-600 mt-1 line-clamp-2">${q.content}</p>
                        <p class="text-xs text-gray-400 mt-3 font-medium">Asked by ${q.authorName} on ${date}</p>
                    </div>
                </div>
            </a>
        `;
    }).join('');
}

/* =======================================
   QA DETAIL LOGIC (qa-detail.html)
   ======================================= */
function initQADetail() {
    // Extract ID from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const questionId = urlParams.get('id');

    if (!questionId) {
        window.location.href = 'qa.html';
        return;
    }

    renderQuestionDetail(questionId);

    // Answer Submission
    document.getElementById('submitAnswerForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const user = Auth.getCurrentUser();
        const content = document.getElementById('answerContent').value.trim();

        if (content) {
            const db = getDB();
            const question = db.questions.find(q => q.id === questionId);
            
            if (question) {
                question.answers.push({
                    id: generateId('a'),
                    authorId: user.id,
                    authorName: user.username,
                    content: content,
                    timestamp: Date.now(),
                    upvotes: 0
                });
                saveDB(db);
                
                document.getElementById('answerContent').value = '';
                renderQuestionDetail(questionId); // Refresh thread
            }
        }
    });
}

function renderQuestionDetail(questionId) {
    const db = getDB();
    const question = db.questions.find(q => q.id === questionId);
    
    if (!question) {
        document.getElementById('question-header').innerHTML = `<p class="text-red-500 font-bold text-center">Question not found or deleted.</p>`;
        return;
    }

    const date = new Date(question.timestamp).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    
    // Render Header
    document.getElementById('question-header').innerHTML = `
        <h1 class="text-2xl font-bold text-gray-900 mb-3">${question.title}</h1>
        <p class="text-gray-700 whitespace-pre-wrap mb-4 bg-gray-50 p-4 rounded-lg border border-gray-100">${question.content}</p>
        <div class="flex items-center gap-2 text-sm text-gray-500">
            <span>Asked by <strong class="text-gray-900">${question.authorName}</strong></span>
            <span>•</span>
            <span>${date}</span>
        </div>
    `;

    // Render Answers Count
    document.getElementById('answers-count').textContent = `${question.answers.length} Answer${question.answers.length === 1 ? '' : 's'}`;

    // Render Answers List
    const answersContainer = document.getElementById('answers-container');
    if (question.answers.length === 0) {
        answersContainer.innerHTML = `<div class="bg-gray-50 p-6 text-center text-gray-500 rounded-lg border border-gray-200">No solutions yet. Be the first to help out!</div>`;
        return;
    }

    // Sort answers by upvotes, then by date
    const sortedAnswers = [...question.answers].sort((a, b) => b.upvotes - a.upvotes || a.timestamp - b.timestamp);

    answersContainer.innerHTML = sortedAnswers.map(ans => {
        const ansDate = new Date(ans.timestamp).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit' });
        const ansAuthor = db.users.find(u => u.id === ans.authorId);
        const avatar = ansAuthor ? ansAuthor.avatar : 'https://ui-avatars.com/api/?name=Unknown';

        return `
            <div class="bg-white p-5 sm:rounded-xl shadow-sm border-y sm:border border-gray-200 flex gap-4">
                <div class="flex flex-col items-center gap-1">
                    <button onclick="upvoteAnswer('${question.id}', '${ans.id}')" class="p-1 text-gray-400 hover:text-green-600 transition bg-gray-50 rounded">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7"></path></svg>
                    </button>
                    <span class="font-bold text-gray-700 text-lg">${ans.upvotes}</span>
                </div>
                <div class="flex-1">
                    <div class="flex items-center gap-2 mb-2">
                        <img src="${avatar}" class="w-6 h-6 rounded-full border border-gray-200">
                        <span class="font-semibold text-gray-900 text-sm">${ans.authorName}</span>
                        ${ansAuthor && ansAuthor.role === 'admin' ? '<span class="bg-blue-100 text-blue-800 text-[10px] px-1.5 py-0.5 rounded font-bold">ADMIN</span>' : ''}
                        <span class="text-xs text-gray-400">• ${ansDate}</span>
                    </div>
                    <p class="text-gray-800 whitespace-pre-wrap">${ans.content}</p>
                </div>
            </div>
        `;
    }).join('');
}

function upvoteAnswer(questionId, answerId) {
    const db = getDB();
    const question = db.questions.find(q => q.id === questionId);
    if (question) {
        const answer = question.answers.find(a => a.id === answerId);
        if (answer) {
            answer.upvotes += 1;
            saveDB(db);
            renderQuestionDetail(questionId); // Refresh UI to show new vote count
        }
    }
}

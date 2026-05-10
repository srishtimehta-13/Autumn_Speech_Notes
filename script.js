// Check for browser support
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

if (!SpeechRecognition) {
    alert('Sorry, your browser does not support Speech Recognition. Please use Chrome, Edge, or Safari.');
}

// Initialize Speech Recognition
const recognition = new SpeechRecognition();
recognition.continuous = true;
recognition.interimResults = true;
recognition.lang = 'en-US';

// Get DOM elements
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const clearBtn = document.getElementById('clearBtn');
const saveBtn = document.getElementById('saveBtn');
const clearAllBtn = document.getElementById('clearAllBtn');
const speechText = document.getElementById('speechText');
const noteTitle = document.getElementById('noteTitle');
const notesList = document.getElementById('notesList');
const statusText = document.getElementById('statusText');
const statusDot = document.getElementById('statusDot');

// State
let isListening = false;
let finalTranscript = '';
let notes = [];

// Load saved notes from storage
loadNotes();

// Event Listeners
startBtn.addEventListener('click', startListening);
stopBtn.addEventListener('click', stopListening);
clearBtn.addEventListener('click', clearText);
saveBtn.addEventListener('click', saveNote);
clearAllBtn.addEventListener('click', clearAllNotes);

// Speech Recognition Events
recognition.onstart = () => {
    isListening = true;
    startBtn.disabled = true;
    stopBtn.disabled = false;
    statusText.textContent = 'Listening... Speak now';
    statusDot.classList.add('listening');
};

recognition.onresult = (event) => {
    let interimTranscript = '';
    
    for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        
        if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
        } else {
            interimTranscript += transcript;
        }
    }
    
    speechText.value = finalTranscript + interimTranscript;
};

recognition.onerror = (event) => {
    console.error('Speech recognition error:', event.error);
    
    let errorMessage = 'An error occurred';
    
    switch(event.error) {
        case 'no-speech':
            errorMessage = 'No speech detected. Please try again.';
            break;
        case 'audio-capture':
            errorMessage = 'No microphone found. Please ensure microphone is connected.';
            break;
        case 'not-allowed':
            errorMessage = 'Microphone permission denied. Please allow microphone access.';
            break;
        case 'network':
            errorMessage = 'Network error occurred. Please check your connection.';
            break;
    }
    
    statusText.textContent = errorMessage;
    stopListening();
};

recognition.onend = () => {
    if (isListening) {
        // Restart if user hasn't stopped manually
        recognition.start();
    }
};

// Functions
function startListening() {
    try {
        finalTranscript = speechText.value;
        recognition.start();
    } catch (error) {
        console.error('Error starting recognition:', error);
        alert('Could not start speech recognition. Please try again.');
    }
}

function stopListening() {
    isListening = false;
    recognition.stop();
    startBtn.disabled = false;
    stopBtn.disabled = true;
    statusText.textContent = 'Stopped listening';
    statusDot.classList.remove('listening');
}

function clearText() {
    speechText.value = '';
    finalTranscript = '';
    noteTitle.value = '';
}

function saveNote() {
    const content = speechText.value.trim();
    const title = noteTitle.value.trim() || 'Untitled Note';
    
    if (!content) {
        alert('Please record some speech before saving!');
        return;
    }
    
    const note = {
        id: Date.now(),
        title: title,
        content: content,
        date: new Date().toLocaleString()
    };
    
    notes.unshift(note);
    saveNotesToStorage();
    renderNotes();
    clearText();
    
    // Show success feedback
    statusText.textContent = 'Note saved successfully! ✓';
    setTimeout(() => {
        statusText.textContent = isListening ? 'Listening... Speak now' : 'Ready to listen';
    }, 2000);
}

function deleteNote(id) {
    if (confirm('Are you sure you want to delete this note?')) {
        notes = notes.filter(note => note.id !== id);
        saveNotesToStorage();
        renderNotes();
    }
}

function copyNote(content) {
    navigator.clipboard.writeText(content).then(() => {
        statusText.textContent = 'Note copied to clipboard! ✓';
        setTimeout(() => {
            statusText.textContent = isListening ? 'Listening... Speak now' : 'Ready to listen';
        }, 2000);
    }).catch(err => {
        console.error('Failed to copy:', err);
        alert('Failed to copy note to clipboard');
    });
}

function clearAllNotes() {
    if (notes.length === 0) {
        alert('No notes to clear!');
        return;
    }
    
    if (confirm('Are you sure you want to delete all notes? This cannot be undone.')) {
        notes = [];
        saveNotesToStorage();
        renderNotes();
    }
}

function renderNotes() {
    if (notes.length === 0) {
        notesList.innerHTML = '<p class="empty-state">No notes yet. Start speaking to create your first note!</p>';
        return;
    }
    
    notesList.innerHTML = notes.map(note => `
        <div class="note-item">
            <div class="note-header">
                <div>
                    <div class="note-title">${escapeHtml(note.title)}</div>
                    <div class="note-date">${note.date}</div>
                </div>
                <div class="note-actions">
                    <button class="note-btn btn-copy" onclick="copyNote(\`${escapeHtml(note.content).replace(/`/g, '\\`')}\`)">
                        📋 Copy
                    </button>
                    <button class="note-btn btn-delete" onclick="deleteNote(${note.id})">
                        🗑️ Delete
                    </button>
                </div>
            </div>
            <div class="note-content">${escapeHtml(note.content)}</div>
        </div>
    `).join('');
}

function saveNotesToStorage() {
    try {
        const notesData = JSON.stringify(notes);
        localStorage.setItem('speechNotes', notesData);
    } catch (error) {
        console.error('Error saving notes:', error);
    }
}

function loadNotes() {
    try {
        const saved = localStorage.getItem('speechNotes');
        if (saved) {
            notes = JSON.parse(saved);
            renderNotes();
        }
    } catch (error) {
        console.error('Error loading notes:', error);
        notes = [];
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Make functions globally accessible for inline event handlers
window.deleteNote = deleteNote;
window.copyNote = copyNote;
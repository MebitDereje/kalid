/**
 * Messages Module - Messaging functionality
 */
const Messages = {
    currentGroupId: null,
    replyTo: null,
    typingTimeout: null,
    isTyping: false,

    // Initialize messages
    init() {
        this.bindEvents();
    },

    // Bind event listeners
    bindEvents() {
        const sendBtn = document.getElementById('sendBtn');
        const messageInput = document.getElementById('messageInput');
        const emojiBtn = document.getElementById('emojiBtn');
        const attachmentBtn = document.getElementById('attachmentBtn');
        const voiceBtn = document.getElementById('voiceBtn');
        const fileInput = document.getElementById('fileInput');

        sendBtn?.addEventListener('click', () => this.sendMessage());
        messageInput?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
        messageInput?.addEventListener('input', () => this.handleTyping());
        emojiBtn?.addEventListener('click', () => this.toggleEmojiPicker());
        attachmentBtn?.addEventListener('click', () => fileInput?.click());
        voiceBtn?.addEventListener('click', () => VoiceRecorder.open());
        fileInput?.addEventListener('change', (e) => this.handleFileUpload(e));
    },

    // Send text message
    sendMessage() {
        const input = document.getElementById('messageInput');
        const text = input.value.trim();

        if (!text || !this.currentGroupId) {
            Notifications.showToast('warning', 'Empty Message', 'Please type a message before sending');
            return;
        }

        // Sanitize input
        const sanitizedText = this.sanitizeInput(text);

        const message = {
            id: 'msg_' + Date.now(),
            text: sanitizedText,
            author: Storage.loadCurrentUser().name,
            authorId: Storage.loadCurrentUser().id,
            timestamp: new Date().toISOString(),
            type: 'text',
            reactions: [],
            replyTo: this.replyTo ? {
                id: this.replyTo.id,
                author: this.replyTo.author,
                text: this.replyTo.text
            } : null
        };

        const messages = Storage.loadMessages(this.currentGroupId);
        messages.push(message);
        Storage.saveMessages(this.currentGroupId, messages);

        this.renderMessage(message);
        input.value = '';
        this.cancelReply();
        this.scrollToBottom();
        Notifications.notifyNewMessage({ name: this.currentGroupId }, message);
    },

    // Render a message
    renderMessage(message) {
        const container = document.getElementById('messagesContainer');
        if (!container) return;

        const isSent = message.authorId === Storage.loadCurrentUser().id;
        const messageEl = document.createElement('div');
        messageEl.className = `message ${isSent ? 'sent' : 'received'}`;
        messageEl.dataset.messageId = message.id;

        let replyHtml = '';
        if (message.replyTo) {
            replyHtml = `
                <div class="reply-context">
                    <strong>${this.escapeHtml(message.replyTo.author)}:</strong>
                    <p>${this.escapeHtml(message.replyTo.text)}</p>
                </div>
            `;
        }

        messageEl.innerHTML = `
            ${!isSent ? `<img src="assets/images/default-avatar.png" alt="Avatar" class="message-avatar">` : ''}
            <div class="message-content">
                <div class="message-header">
                    <span class="message-author">${this.escapeHtml(message.author)}</span>
                    <span class="message-time">${this.formatTime(message.timestamp)}</span>
                </div>
                ${replyHtml}
                <div class="message-text">${this.escapeHtml(message.text)}</div>
                <div class="message-actions">
                    <button class="reaction-btn" data-reaction="like"><i class="fas fa-thumbs-up"></i></button>
                    <button class="reaction-btn" data-reaction="love"><i class="fas fa-heart"></i></button>
                    <button class="reaction-btn" data-reaction="thumbs-up"><i class="fas fa-thumbs-up"></i></button>
                    ${isSent ? `<button class="edit-btn"><i class="fas fa-edit"></i></button>
                    <button class="delete-btn"><i class="fas fa-trash"></i></button>` : `<button class="reply-btn"><i class="fas fa-reply"></i></button>`}
                </div>
                ${message.reactions.length > 0 ? `
                <div class="reactions">
                    ${message.reactions.map(r => `<span class="reaction"><i class="fas fa-${r.type}"></i> ${r.count}</span>`).join('')}
                </div>` : ''}
            </div>
        `;

        // Insert before any date separator at the end
        const dateSeparators = container.querySelectorAll('.message-date');
        if (dateSeparators.length > 0) {
            container.insertBefore(messageEl, dateSeparators[dateSeparators.length - 1].nextSibling);
        } else {
            container.appendChild(messageEl);
        }

        this.bindMessageActions(messageEl, message);
    },

    // Bind message action buttons
    bindMessageActions(messageEl, message) {
        // Reaction buttons
        messageEl.querySelectorAll('.reaction-btn').forEach(btn => {
            btn.addEventListener('click', () => this.addReaction(message.id, btn.dataset.reaction));
        });

        // Reply button
        const replyBtn = messageEl.querySelector('.reply-btn');
        if (replyBtn) {
            replyBtn.addEventListener('click', () => this.replyToMessage(message));
        }

        // Edit button
        const editBtn = messageEl.querySelector('.edit-btn');
        if (editBtn) {
            editBtn.addEventListener('click', () => this.editMessage(message.id));
        }

        // Delete button
        const deleteBtn = messageEl.querySelector('.delete-btn');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => this.deleteMessage(message.id));
        }
    },

    // Add reaction to message
    addReaction(messageId, reactionType) {
        const messages = Storage.loadMessages(this.currentGroupId);
        const message = messages.find(m => m.id === messageId);
        if (!message) return;

        const existingReaction = message.reactions.find(r => r.type === reactionType);
        if (existingReaction) {
            existingReaction.count++;
        } else {
            message.reactions.push({ type: reactionType, count: 1 });
        }

        Storage.saveMessages(this.currentGroupId, messages);
        this.updateMessageReactions(messageId, message.reactions);
    },

    // Update message reactions display
    updateMessageReactions(messageId, reactions) {
        const messageEl = document.querySelector(`.message[data-message-id="${messageId}"] .reactions`);
        if (messageEl) {
            messageEl.innerHTML = reactions.map(r => 
                `<span class="reaction"><i class="fas fa-${r.type}"></i> ${r.count}</span>`
            ).join('');
        }
    },

    // Reply to message
    replyToMessage(message) {
        this.replyTo = message;
        const preview = document.getElementById('replyPreview');
        if (preview) {
            preview.innerHTML = `
                <div class="reply-content">
                    <span>Replying to: <strong>${this.escapeHtml(message.author)}</strong></span>
                    <p class="reply-text">${this.escapeHtml(message.text)}</p>
                </div>
                <button class="cancel-reply" id="cancelReply">
                    <i class="fas fa-times"></i>
                </button>
            `;
            preview.style.display = 'flex';
            document.getElementById('cancelReply').addEventListener('click', () => this.cancelReply());
        }
    },

    // Cancel reply
    cancelReply() {
        this.replyTo = null;
        const preview = document.getElementById('replyPreview');
        if (preview) {
            preview.style.display = 'none';
        }
    },

    // Edit message
    editMessage(messageId) {
        const messages = Storage.loadMessages(this.currentGroupId);
        const message = messages.find(m => m.id === messageId);
        if (!message) return;

        const newText = prompt('Edit message:', message.text);
        if (newText !== null && newText.trim() !== '') {
            message.text = this.sanitizeInput(newText.trim());
            message.edited = true;
            Storage.saveMessages(this.currentGroupId, messages);
            this.updateMessageText(messageId, message.text);
        }
    },

    // Update message text display
    updateMessageText(messageId, text) {
        const messageEl = document.querySelector(`.message[data-message-id="${messageId}"] .message-text`);
        if (messageEl) {
            messageEl.textContent = text;
        }
    },

    // Delete message
    deleteMessage(messageId) {
        if (!confirm('Are you sure you want to delete this message?')) return;

        const messages = Storage.loadMessages(this.currentGroupId);
        const index = messages.findIndex(m => m.id === messageId);
        if (index > -1) {
            messages.splice(index, 1);
            Storage.saveMessages(this.currentGroupId, messages);
            document.querySelector(`.message[data-message-id="${messageId}"]`).remove();
        }
    },

    // Handle typing indicator
    handleTyping() {
        if (this.isTyping) return;

        this.isTyping = true;
        const indicator = document.getElementById('typingIndicator');
        if (indicator) {
            indicator.style.display = 'flex';
        }

        clearTimeout(this.typingTimeout);
        this.typingTimeout = setTimeout(() => {
            this.isTyping = false;
            if (indicator) {
                indicator.style.display = 'none';
            }
        }, 3000);
    },

    // Toggle emoji picker
    toggleEmojiPicker() {
        const picker = document.getElementById('emojiPicker');
        if (picker) {
            picker.classList.toggle('active');
        }
    },

    // Insert emoji
    insertEmoji(emoji) {
        const input = document.getElementById('messageInput');
        if (input) {
            input.value += emoji;
            input.focus();
        }
        this.toggleEmojiPicker();
    },

    // Handle file upload
    handleFileUpload(event) {
        const files = Array.from(event.target.files);
        files.forEach(file => {
            if (this.validateFile(file)) {
                FileHandler.previewFile(file);
            } else {
                Notifications.showToast('error', 'Invalid File', 'File type not supported');
            }
        });
    },

    // Validate file
    validateFile(file) {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'video/mp4', 'video/webm'];
        const maxSize = 50 * 1024 * 1024; // 50MB

        return allowedTypes.includes(file.type) && file.size <= maxSize;
    },

    // Format time
    formatTime(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    },

    // Escape HTML for security
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    // Sanitize input
    sanitizeInput(text) {
        return text.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    },

    // Scroll to bottom
    scrollToBottom() {
        const container = document.getElementById('messagesContainer');
        if (container) {
            container.scrollTop = container.scrollHeight;
        }
    },

    // Handle @mentions detection
    handleMentions(text) {
        const mentionRegex = /@(\w+)/g;
        return text.replace(mentionRegex, '<span class="mention">@$1</span>');
    }
};

/**
 * Voice Recorder Module
 */
const VoiceRecorder = {
    mediaRecorder: null,
    audioChunks: [],
    recordingTime: 0,
    recordingTimer: null,

    // Open voice recorder modal
    open() {
        const modal = document.getElementById('voiceModal');
        if (modal) {
            modal.classList.add('active');
            this.setupRecorder();
        }
    },

    // Close voice recorder modal
    close() {
        const modal = document.getElementById('voiceModal');
        modal?.classList.remove('active');
        this.stopRecording();
    },

    // Setup media recorder
    async setupRecorder() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.mediaRecorder = new MediaRecorder(stream);
            this.audioChunks = [];

            this.mediaRecorder.ondataavailable = (event) => {
                this.audioChunks.push(event.data);
            };

            this.startRecording();
        } catch (error) {
            console.error('Microphone access error:', error);
            Notifications.showToast('error', 'Microphone Error', 'Cannot access microphone');
        }
    },

    // Start recording
    startRecording() {
        this.recordingTime = 0;
        document.getElementById('recordingTime').textContent = '00:00';
        document.getElementById('sendVoiceMessage').disabled = true;

        this.recordingTimer = setInterval(() => {
            this.recordingTime++;
            const minutes = Math.floor(this.recordingTime / 60);
            const seconds = this.recordingTime % 60;
            document.getElementById('recordingTime').textContent = 
                `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }, 1000);

        this.mediaRecorder?.start();
    },

    // Stop recording
    stopRecording() {
        if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
            this.mediaRecorder.stop();
            this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
        }
        clearInterval(this.recordingTimer);
    },

    // Send voice message
    sendVoiceMessage() {
        if (this.audioChunks.length === 0) return;

        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);

        const message = {
            id: 'msg_' + Date.now(),
            text: '',
            author: Storage.loadCurrentUser().name,
            authorId: Storage.loadCurrentUser().id,
            timestamp: new Date().toISOString(),
            type: 'voice',
            audioUrl: audioUrl,
            duration: this.recordingTime
        };

        const messages = Storage.loadMessages(Messages.currentGroupId);
        messages.push(message);
        Storage.saveMessages(Messages.currentGroupId, messages);

        this.close();
    }
};

/**
 * File Handler Module
 */
const FileHandler = {
    previewFile(file) {
        const modal = document.getElementById('filePreviewModal');
        const previewBody = document.getElementById('filePreviewBody');

        if (!modal || !previewBody) return;

        previewBody.innerHTML = '';

        if (file.type.startsWith('image/')) {
            const img = document.createElement('img');
            img.src = URL.createObjectURL(file);
            previewBody.appendChild(img);
        } else if (file.type === 'application/pdf') {
            previewBody.innerHTML = `<i class="fas fa-file-pdf" style="font-size: 4rem; color: #dc3545;"></i>`;
        } else if (file.type.startsWith('video/')) {
            const video = document.createElement('video');
            video.src = URL.createObjectURL(file);
            video.controls = true;
            video.style.maxWidth = '100%';
            previewBody.appendChild(video);
        }

        modal.classList.add('active');

        document.getElementById('sendFile').onclick = () => {
            this.sendFile(file);
            modal.classList.remove('active');
        };

        document.getElementById('cancelFile').onclick = () => {
            modal.classList.remove('active');
        };
    },

    sendFile(file) {
        const message = {
            id: 'msg_' + Date.now(),
            text: file.name,
            author: Storage.loadCurrentUser().name,
            authorId: Storage.loadCurrentUser().id,
            timestamp: new Date().toISOString(),
            type: 'file',
            fileUrl: URL.createObjectURL(file),
            fileType: file.type,
            fileSize: file.size
        };

        const messages = Storage.loadMessages(Messages.currentGroupId);
        messages.push(message);
        Storage.saveMessages(Messages.currentGroupId, messages);
        Messages.renderMessage(message);
    }
};
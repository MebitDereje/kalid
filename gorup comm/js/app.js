/**
 * Main Application Module - App initialization and coordination
 */
const App = {
    // Initialize application
    init() {
        this.initializeTheme();
        this.bindGlobalEvents();
        Groups.init();
        Messages.init();
        Notifications.init();
        this.initializeEmojiPicker();
        this.initializePollModal();
        this.initializeEventModal();
        this.initializeVoiceRecording();
        this.initializeDashboard();
        this.handleInitialGroupSelection();
    },

    // Initialize theme
    initializeTheme() {
        const theme = Storage.loadTheme();
        document.documentElement.setAttribute('data-theme', theme);
        this.updateThemeIcon(theme);
    },

    // Update theme toggle icon
    updateThemeIcon(theme) {
        const toggle = document.getElementById('themeToggle');
        if (toggle) {
            const icon = toggle.querySelector('i');
            icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
        }
    },

    // Bind global events
    bindGlobalEvents() {
        const themeToggle = document.getElementById('themeToggle');

        themeToggle?.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', newTheme);
            Storage.saveTheme(newTheme);
            this.updateThemeIcon(newTheme);
        });
    },

    // Initialize emoji picker
    initializeEmojiPicker() {
        document.querySelectorAll('.emoji').forEach(emoji => {
            emoji.addEventListener('click', () => {
                Messages.insertEmoji(emoji.textContent);
            });
        });

        document.querySelectorAll('.emoji-category').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.emoji-category').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });

        // Close emoji picker when clicking outside
        document.addEventListener('click', (e) => {
            const picker = document.getElementById('emojiPicker');
            const emojiBtn = document.getElementById('emojiBtn');
            if (picker && emojiBtn && !picker.contains(e.target) && !emojiBtn.contains(e.target)) {
                picker.classList.remove('active');
            }
        });
    },

    // Initialize poll modal
    initializePollModal() {
        const pollModal = document.getElementById('pollModal');
        const createPollBtn = document.getElementById('createPollBtn');
        const pollForm = document.getElementById('pollForm');
        const addOption = document.getElementById('addOption');

        createPollBtn?.addEventListener('click', () => {
            pollModal?.classList.add('active');
        });

        pollForm?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleCreatePoll();
        });

        addOption?.addEventListener('click', () => {
            const container = document.getElementById('pollOptions');
            const count = container.querySelectorAll('.poll-option').length + 1;
            const input = document.createElement('input');
            input.type = 'text';
            input.className = 'poll-option';
            input.placeholder = `Option ${count}`;
            input.required = true;
            container.appendChild(input);
        });

        document.getElementById('closePollModal')?.addEventListener('click', () => {
            pollModal?.classList.remove('active');
        });
    },

    // Handle create poll
    handleCreatePoll() {
        const question = document.getElementById('pollQuestion').value;
        const options = Array.from(document.querySelectorAll('.poll-option')).map(opt => opt.value).filter(v => v);

        if (!question || options.length < 2) {
            Notifications.showToast('warning', 'Invalid Poll', 'Please add at least 2 options');
            return;
        }

        const poll = {
            id: 'poll_' + Date.now(),
            question: Groups.sanitizeInput(question),
            options: options.map((opt, idx) => ({ text: Groups.sanitizeInput(opt), votes: 0, id: idx })),
            author: Storage.loadCurrentUser().name,
            createdAt: new Date().toISOString()
        };

        const messages = Storage.loadMessages(Groups.currentGroup.id);
        messages.push({
            id: 'msg_' + Date.now(),
            text: '',
            author: Storage.loadCurrentUser().name,
            authorId: Storage.loadCurrentUser().id,
            timestamp: new Date().toISOString(),
            type: 'poll',
            poll: poll
        });

        Storage.saveMessages(Groups.currentGroup.id, messages);
        document.getElementById('pollModal')?.classList.remove('active');
        document.getElementById('pollForm').reset();
    },

    // Initialize event modal
    initializeEventModal() {
        const eventModal = document.getElementById('eventModal');
        const scheduleEventBtn = document.getElementById('scheduleEventBtn');
        const eventForm = document.getElementById('eventForm');

        scheduleEventBtn?.addEventListener('click', () => {
            eventModal?.classList.add('active');
        });

        eventForm?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleScheduleEvent();
        });

        document.getElementById('closeEventModal')?.addEventListener('click', () => {
            eventModal?.classList.remove('active');
        });
    },

    // Handle schedule event
    handleScheduleEvent() {
        const title = document.getElementById('eventTitle').value;
        const date = document.getElementById('eventDate').value;
        const time = document.getElementById('eventTime').value;
        const description = document.getElementById('eventDescription').value;

        if (!title || !date || !time) {
            Notifications.showToast('warning', 'Invalid Event', 'Please fill all required fields');
            return;
        }

        const event = {
            id: 'event_' + Date.now(),
            title: Groups.sanitizeInput(title),
            date,
            time,
            description: Groups.sanitizeInput(description || ''),
            author: Storage.loadCurrentUser().name,
            createdAt: new Date().toISOString()
        };

        const messages = Storage.loadMessages(Groups.currentGroup.id);
        messages.push({
            id: 'msg_' + Date.now(),
            text: '',
            author: Storage.loadCurrentUser().name,
            authorId: Storage.loadCurrentUser().id,
            timestamp: new Date().toISOString(),
            type: 'event',
            event: event
        });

        Storage.saveMessages(Groups.currentGroup.id, messages);
        document.getElementById('eventModal')?.classList.remove('active');
        document.getElementById('eventForm').reset();
    },

    // Initialize voice recording
    initializeVoiceRecording() {
        document.getElementById('stopRecording')?.addEventListener('click', () => {
            VoiceRecorder.stopRecording();
            document.getElementById('sendVoiceMessage').disabled = false;
        });

        document.getElementById('sendVoiceMessage')?.addEventListener('click', () => {
            VoiceRecorder.sendVoiceMessage();
        });

        document.getElementById('closeVoiceModal')?.addEventListener('click', () => {
            VoiceRecorder.close();
        });
    },

    // Initialize dashboard
    initializeDashboard() {
        const dashboardModal = document.getElementById('dashboardModal');
        const dashboardToggle = document.getElementById('dashboardToggle');

        dashboardToggle?.addEventListener('click', () => {
            dashboardModal?.classList.add('active');
            this.updateDashboardStats();
        });

        document.getElementById('closeDashboard')?.addEventListener('click', () => {
            dashboardModal?.classList.remove('active');
        });
    },

    // Update dashboard statistics
    updateDashboardStats() {
        document.querySelector('.stat-card:nth-child(1) .stat-value').textContent = Groups.groups.length || 0;
        document.querySelector('.stat-card:nth-child(2) .stat-value').textContent = 23;
        document.querySelector('.stat-card:nth-child(3) .stat-value').textContent = Storage.loadMessages('group_1')?.length || 0;
        document.querySelector('.stat-card:nth-child(4) .stat-value').textContent = 12;
    },

    // Handle initial group selection
    handleInitialGroupSelection() {
        const firstGroup = document.querySelector('.group-item');
        if (firstGroup) {
            const groupId = firstGroup.dataset.groupId;
            Groups.selectGroup(groupId);
        }
    }
};

// Document ready
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});

// Export modules for global access
window.App = App;
window.Groups = Groups;
window.Messages = Messages;
window.Storage = Storage;
window.Notifications = Notifications;
window.VoiceRecorder = VoiceRecorder;
window.FileHandler = FileHandler;
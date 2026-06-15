/**
 * Notifications Module - Notification system and alerts
 */
const Notifications = {
    soundEnabled: true,
    notificationPermission: 'default',

    // Initialize notifications
    init() {
        this.requestPermission();
        this.loadSettings();
    },

    // Request browser notification permission
    requestPermission() {
        if ('Notification' in window) {
            Notification.requestPermission().then(permission => {
                this.notificationPermission = permission;
            });
        }
    },

    // Load notification settings
    loadSettings() {
        const settings = Storage.load('notificationSettings');
        if (settings) {
            this.soundEnabled = settings.soundEnabled;
        }
    },

    // Save notification settings
    saveSettings() {
        Storage.save('notificationSettings', {
            soundEnabled: this.soundEnabled
        });
    },

    // Show browser notification
    showNotification(title, body, icon = null) {
        if (this.notificationPermission === 'granted') {
            const notification = new Notification(title, {
                body,
                icon: icon || 'assets/images/default-avatar.png',
                badge: 'assets/images/default-avatar.png'
            });

            notification.onclick = function() {
                window.focus();
                this.close();
            };
        }
    },

    // Play notification sound
    playSound(soundType = 'message') {
        if (!this.soundEnabled) return;

        const sounds = {
            message: 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAABJdIGBAACBhYqFbF1fdJOnp5mPf3CAaGiqGJvbqWeow==',
            mention: 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAABJdIGBAACBhYqFbF1fdJOnp5mPf3CAaGiqGJvbqWeow=='
        };

        try {
            const audio = new Audio(sounds[soundType]);
            audio.volume = 0.5;
            audio.play().catch(() => {});
        } catch (error) {
            console.error('Sound play error:', error);
        }
    },

    // Show toast notification
    showToast(type, title, message, duration = 5000) {
        const container = document.getElementById('toastContainer');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <i class="fas fa-${this.getToastIcon(type)} toast-icon"></i>
            <div>
                <strong>${title}</strong>
                <p>${message}</p>
            </div>
        `;

        container.appendChild(toast);

        setTimeout(() => {
            toast.remove();
        }, duration);
    },

    // Get toast icon based on type
    getToastIcon(type) {
        const icons = {
            success: 'check-circle',
            error: 'exclamation-circle',
            warning: 'exclamation-triangle',
            info: 'info-circle'
        };
        return icons[type] || 'info-circle';
    },

    // Update unread counter
    updateUnreadCounter(groupId, count) {
        const badge = document.querySelector(`.group-item[data-group-id="${groupId}"] .unread-badge`);
        if (badge) {
            badge.textContent = count;
            badge.style.display = count > 0 ? 'block' : 'none';
        }
    },

    // New message notification
    notifyNewMessage(group, message) {
        if (document.hidden || !document.hasFocus()) {
            this.showNotification(`New message from ${group.name}`, message.text);
            this.playSound('message');
        }
    },

    // Mention notification
    notifyMention(sender, message) {
        this.showNotification(`Mention from ${sender}`, message);
        this.playSound('mention');
    }
};
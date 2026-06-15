/**
 * Storage Module - LocalStorage functionality
 */
const Storage = {
    // Save data to localStorage
    save(key, data) {
        try {
            const serialized = JSON.stringify(data);
            localStorage.setItem(`groupcomm_${key}`, serialized);
            return true;
        } catch (error) {
            console.error('Storage save error:', error);
            return false;
        }
    },

    // Load data from localStorage
    load(key) {
        try {
            const item = localStorage.getItem(`groupcomm_${key}`);
            return item ? JSON.parse(item) : null;
        } catch (error) {
            console.error('Storage load error:', error);
            return null;
        }
    },

    // Remove data from localStorage
    remove(key) {
        localStorage.removeItem(`groupcomm_${key}`);
    },

    // Clear all app data
    clearAll() {
        Object.keys(localStorage)
            .filter(key => key.startsWith('groupcomm_'))
            .forEach(key => localStorage.removeItem(key));
    },

    // Save groups
    saveGroups(groups) {
        return this.save('groups', groups);
    },

    // Load groups
    loadGroups() {
        return this.load('groups') || [];
    },

    // Save messages
    saveMessages(groupId, messages) {
        return this.save(`messages_${groupId}`, messages);
    },

    // Load messages
    loadMessages(groupId) {
        return this.load(`messages_${groupId}`) || [];
    },

    // Save current user
    saveCurrentUser(user) {
        return this.save('currentUser', user);
    },

    // Load current user
    loadCurrentUser() {
        return this.load('currentUser') || {
            id: 'user_' + Date.now(),
            name: 'John Doe',
            avatar: 'assets/images/default-avatar.png'
        };
    },

    // Save theme preference
    saveTheme(theme) {
        return this.save('theme', theme);
    },

    // Load theme preference
    loadTheme() {
        return this.load('theme') || 'light';
    },

    // Save pinned messages
    savePinnedMessages(messages) {
        return this.save('pinnedMessages', messages);
    },

    // Load pinned messages
    loadPinnedMessages() {
        return this.load('pinnedMessages') || [];
    },

    // Save archived groups
    saveArchivedGroups(groups) {
        return this.save('archivedGroups', groups);
    },

    // Load archived groups
    loadArchivedGroups() {
        return this.load('archivedGroups') || [];
    }
};
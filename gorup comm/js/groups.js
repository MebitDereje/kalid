/**
 * Groups Module - Group management functionality
 */
const Groups = {
    groups: [],
    currentGroup: null,

    // Initialize groups
    init() {
        this.loadGroups();
        this.bindEvents();
    },

    // Load groups from storage
    loadGroups() {
        this.groups = Storage.loadGroups();
        if (this.groups.length === 0) {
            this.createDefaultGroups();
        }
        this.renderGroupsList();
    },

    // Create default groups for demo
    createDefaultGroups() {
        this.groups = [
            {
                id: 'group_1',
                name: 'Development Team',
                description: 'Project development discussions and updates',
                icon: 'assets/images/group1.png',
                createdAt: new Date().toISOString(),
                admin: Storage.loadCurrentUser().id,
                members: [Storage.loadCurrentUser().id],
                announcements: []
            },
            {
                id: 'group_2',
                name: 'Marketing Team',
                description: 'Marketing strategy and campaigns',
                icon: 'assets/images/group2.png',
                createdAt: new Date().toISOString(),
                admin: Storage.loadCurrentUser().id,
                members: [Storage.loadCurrentUser().id],
                announcements: []
            }
        ];
        Storage.saveGroups(this.groups);
    },

    // Render groups list
    renderGroupsList() {
        const container = document.getElementById('groupsList');
        if (!container) return;

        container.innerHTML = this.groups.map(group => `
            <li class="group-item ${group.id === this.currentGroup?.id ? 'active' : ''}" data-group-id="${group.id}">
                <div class="group-info">
                    <img src="${group.icon}" alt="Group" class="group-avatar">
                    <div class="group-details">
                        <h4>${this.escapeHtml(group.name)}</h4>
                        <p>${this.escapeHtml(group.description)}</p>
                    </div>
                    <span class="unread-badge" style="display: none;">0</span>
                </div>
            </li>
        `).join('');

        this.bindGroupClick();
    },

    // Bind group click events
    bindGroupClick() {
        document.querySelectorAll('.group-item').forEach(item => {
            item.addEventListener('click', () => {
                const groupId = item.dataset.groupId;
                this.selectGroup(groupId);
            });
        });
    },

    // Select a group
    selectGroup(groupId) {
        const group = this.groups.find(g => g.id === groupId);
        if (!group) return;

        this.currentGroup = group;
        Messages.currentGroupId = groupId;

        document.querySelectorAll('.group-item').forEach(item => {
            item.classList.toggle('active', item.dataset.groupId === groupId);
        });

        this.updateChatHeader();
        this.loadGroupMessages();
        this.loadGroupMembers();
    },

    // Update chat header
    updateChatHeader() {
        if (!this.currentGroup) return;

        const groupName = document.getElementById('currentGroupName');
        const memberCount = document.getElementById('memberCount');
        const chatAvatar = document.querySelector('.chat-group-avatar');

        if (groupName) groupName.textContent = this.currentGroup.name;
        if (memberCount) {
            memberCount.textContent = `${this.currentGroup.members.length} members`;
        }
        if (chatAvatar) chatAvatar.src = this.currentGroup.icon;
    },

    // Load group messages
    loadGroupMessages() {
        const messages = Storage.loadMessages(this.currentGroup.id);
        const container = document.getElementById('messagesContainer');
        if (!container) return;

        container.innerHTML = messages.map(msg => this.createMessageElement(msg)).join('');

        // Add date separator
        const dateSep = document.createElement('div');
        dateSep.className = 'message-date';
        dateSep.textContent = 'Today';
        container.prepend(dateSep);
    },

    // Create message element
    createMessageElement(message) {
        const isSent = message.authorId === Storage.loadCurrentUser().id;
        let replyHtml = '';
        if (message.replyTo) {
            replyHtml = `
                <div class="reply-context">
                    <strong>${this.escapeHtml(message.replyTo.author)}:</strong>
                    <p>${this.escapeHtml(message.replyTo.text)}</p>
                </div>
            `;
        }

        return `
            <div class="message ${isSent ? 'sent' : 'received'}" data-message-id="${message.id}">
                ${!isSent ? `<img src="assets/images/default-avatar.png" alt="Avatar" class="message-avatar">` : ''}
                <div class="message-content">
                    <div class="message-header">
                        <span class="message-author">${this.escapeHtml(message.author)}</span>
                        <span class="message-time">${Messages.formatTime(message.timestamp)}</span>
                    </div>
                    ${replyHtml}
                    <div class="message-text">${this.escapeHtml(message.text)}</div>
                    <div class="message-actions">
                        <button class="reaction-btn" data-reaction="like"><i class="fas fa-thumbs-up"></i></button>
                        <button class="reaction-btn" data-reaction="love"><i class="fas fa-heart"></i></button>
                        ${isSent ? `<button class="edit-btn"><i class="fas fa-edit"></i></button>
                        <button class="delete-btn"><i class="fas fa-trash"></i></button>` : `<button class="reply-btn"><i class="fas fa-reply"></i></button>`}
                    </div>
                </div>
            </div>
        `;
    },

    // Load group members
    loadGroupMembers() {
        const members = Storage.load('members') || [
            { id: 'user_1', name: 'Alice Johnson', avatar: 'assets/images/avatar1.png', status: 'online' },
            { id: 'user_2', name: 'Bob Smith', avatar: 'assets/images/avatar2.png', status: 'offline' },
            { id: 'user_3', name: 'Charlie Brown', avatar: 'assets/images/avatar3.png', status: 'online' }
        ];

        const container = document.getElementById('membersList');
        if (!container) return;

        container.innerHTML = members.map(member => `
            <li class="member-item">
                <img src="${member.avatar}" alt="Member">
                <span>${this.escapeHtml(member.name)} ${member.id === this.currentGroup?.admin ? '(Admin)' : ''}</span>
                <span class="member-status ${member.status}"></span>
            </li>
        `).join('');
    },

    // Create new group
    createGroup(name, description, icon) {
        if (!this.validateGroupName(name)) return false;

        const group = {
            id: 'group_' + Date.now(),
            name: this.sanitizeInput(name),
            description: this.sanitizeInput(description || ''),
            icon: icon || 'assets/images/default-group.png',
            createdAt: new Date().toISOString(),
            admin: Storage.loadCurrentUser().id,
            members: [Storage.loadCurrentUser().id],
            announcements: []
        };

        this.groups.push(group);
        Storage.saveGroups(this.groups);
        this.renderGroupsList();
        this.selectGroup(group.id);

        return true;
    },

    // Edit group
    editGroup(groupId, name, description, announcement) {
        const group = this.groups.find(g => g.id === groupId);
        if (!group) return false;

        group.name = this.sanitizeInput(name);
        group.description = this.sanitizeInput(description || '');
        if (announcement) {
            group.announcements.push({
                text: this.sanitizeInput(announcement),
                createdAt: new Date().toISOString()
            });
        }

        Storage.saveGroups(this.groups);
        this.updateChatHeader();

        return true;
    },

    // Delete group
    deleteGroup(groupId) {
        if (!confirm('Are you sure you want to delete this group?')) return false;

        this.groups = this.groups.filter(g => g.id !== groupId);
        Storage.saveGroups(this.groups);
        Storage.remove(`messages_${groupId}`);

        if (this.currentGroup?.id === groupId) {
            this.currentGroup = this.groups[0] || null;
            if (this.currentGroup) {
                this.selectGroup(this.currentGroup.id);
            }
        } else {
            this.renderGroupsList();
        }

        return true;
    },

    // Leave group
    leaveGroup(groupId) {
        const group = this.groups.find(g => g.id === groupId);
        if (!group) return false;

        group.members = group.members.filter(m => m !== Storage.loadCurrentUser().id);
        Storage.saveGroups(this.groups);

        if (group.members.length === 0) {
            this.deleteGroup(groupId);
        }

        Notifications.showToast('info', 'Left Group', `You left ${group.name}`);
        return true;
    },

    // Add member to group
    addMember(groupId, memberId) {
        const group = this.groups.find(g => g.id === groupId);
        if (!group) return false;

        if (!group.members.includes(memberId)) {
            group.members.push(memberId);
            Storage.saveGroups(this.groups);
            this.loadGroupMembers();
        }

        return true;
    },

    // Remove member from group
    removeMember(groupId, memberId) {
        const group = this.groups.find(g => g.id === groupId);
        if (!group || group.admin !== Storage.loadCurrentUser().id) return false;

        group.members = group.members.filter(m => m !== memberId);
        Storage.saveGroups(this.groups);
        this.loadGroupMembers();

        return true;
    },

    // Assign admin
    assignAdmin(groupId, memberId) {
        const group = this.groups.find(g => g.id === groupId);
        if (!group || group.admin !== Storage.loadCurrentUser().id) return false;

        group.admin = memberId;
        Storage.saveGroups(this.groups);
        this.loadGroupMembers();

        return true;
    },

    // Validate group name
    validateGroupName(name) {
        if (!name || name.trim() === '') {
            Notifications.showToast('warning', 'Invalid Name', 'Group name cannot be empty');
            return false;
        }
        if (name.length > 50) {
            Notifications.showToast('warning', 'Invalid Name', 'Group name too long (max 50 chars)');
            return false;
        }
        return true;
    },

    // Sanitize input
    sanitizeInput(text) {
        return text.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    },

    // Escape HTML
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    // Bind events
    bindEvents() {
        const createGroupBtn = document.getElementById('createGroupBtn');
        const createGroupForm = document.getElementById('createGroupForm');
        const editGroupForm = document.getElementById('editGroupForm');
        const addMemberForm = document.getElementById('addMemberForm');
        const groupInfoBtn = document.getElementById('groupInfoBtn');
        const groupSettingsBtn = document.getElementById('groupSettingsBtn');

        createGroupBtn?.addEventListener('click', () => this.showCreateGroupModal());
        createGroupForm?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleCreateGroup();
        });
        editGroupForm?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleEditGroup();
        });
        addMemberForm?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleAddMember();
        });
        groupInfoBtn?.addEventListener('click', () => this.showGroupPanel());
        groupSettingsBtn?.addEventListener('click', () => this.showAddMemberModal());
    },

    // Show create group modal
    showCreateGroupModal() {
        const modal = document.getElementById('createGroupModal');
        modal?.classList.add('active');
        document.getElementById('closeCreateGroup')?.addEventListener('click', () => {
            modal?.classList.remove('active');
        });
    },

    // Handle create group
    handleCreateGroup() {
        const name = document.getElementById('groupName').value;
        const description = document.getElementById('groupDescription').value;

        if (this.createGroup(name, description)) {
            document.getElementById('createGroupModal')?.classList.remove('active');
            document.getElementById('createGroupForm').reset();
            Notifications.showToast('success', 'Group Created', `${name} created successfully`);
        }
    },

    // Show group panel
    showGroupPanel() {
        const panel = document.getElementById('groupPanel');
        panel?.classList.add('active');

        const panelName = document.getElementById('panelGroupName');
        const panelDesc = document.getElementById('panelGroupDesc');

        if (panelName) panelName.textContent = this.currentGroup?.name;
        if (panelDesc) panelDesc.textContent = this.currentGroup?.description;

        document.getElementById('closePanel')?.addEventListener('click', () => {
            panel?.classList.remove('active');
        });

        document.getElementById('editGroupBtn')?.addEventListener('click', () => {
            this.showEditGroupModal();
            panel?.classList.remove('active');
        });

        document.getElementById('addMemberBtn')?.addEventListener('click', () => {
            this.showAddMemberModal();
        });

        document.getElementById('leaveGroupBtn')?.addEventListener('click', () => {
            this.leaveGroup(this.currentGroup.id);
            panel?.classList.remove('active');
        });

        document.getElementById('deleteGroupBtn')?.addEventListener('click', () => {
            this.deleteGroup(this.currentGroup.id);
            panel?.classList.remove('active');
        });
    },

    // Show edit group modal
    showEditGroupModal() {
        const modal = document.getElementById('editGroupModal');
        modal?.classList.add('active');

        if (this.currentGroup) {
            document.getElementById('editGroupName').value = this.currentGroup.name;
            document.getElementById('editGroupDescription').value = this.currentGroup.description;
        }

        document.getElementById('closeEditGroup')?.addEventListener('click', () => {
            modal?.classList.remove('active');
        });
    },

    // Handle edit group
    handleEditGroup() {
        const name = document.getElementById('editGroupName').value;
        const description = document.getElementById('editGroupDescription').value;

        if (this.editGroup(this.currentGroup.id, name, description)) {
            document.getElementById('editGroupModal')?.classList.remove('active');
            Notifications.showToast('success', 'Group Updated', 'Group details updated');
        }
    },

    // Show add member modal
    showAddMemberModal() {
        const modal = document.getElementById('addMemberModal');
        modal?.classList.add('active');

        document.getElementById('closeAddMember')?.addEventListener('click', () => {
            modal?.classList.remove('active');
        });
    },

    // Handle add member
    handleAddMember() {
        const email = document.getElementById('memberEmail').value;

        if (email && this.addMember(this.currentGroup.id, email)) {
            document.getElementById('addMemberModal')?.classList.remove('active');
            document.getElementById('addMemberForm').reset();
            Notifications.showToast('success', 'Member Added', 'New member added to group');
        }
    }
};
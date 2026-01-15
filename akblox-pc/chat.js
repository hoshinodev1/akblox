// Chat System for AKBlox
class ChatSystem {
    constructor() {
        this.currentChat = 'friends';
        this.messages = JSON.parse(localStorage.getItem('akblox_chat_messages')) || {};
        this.friends = JSON.parse(localStorage.getItem('akblox_friends')) || [];
        this.setupEventListeners();
        this.loadFriends();
        this.simulateMessages();
    }
    
    setupEventListeners() {
        // Chat tabs
        document.querySelectorAll('.chat-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.switchChatTab(e.target.dataset.tab);
            });
        });
        
        // Send message
        document.getElementById('sendMessageBtn')?.addEventListener('click', () => {
            this.sendMessage();
        });
        
        document.getElementById('chatInput')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendMessage();
            }
        });
        
        // Chat toggle
        document.getElementById('chatToggleBtn')?.addEventListener('click', () => {
            this.toggleChat();
        });
        
        // Voice chat toggle
        document.getElementById('voiceChatToggle')?.addEventListener('click', () => {
            this.toggleVoiceChat();
        });
        
        // Search users
        document.getElementById('globalSearch')?.addEventListener('input', (e) => {
            this.searchUsers(e.target.value);
        });
    }
    
    switchChatTab(tabId) {
        this.currentChat = tabId;
        
        // Update tabs
        document.querySelectorAll('.chat-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabId);
        });
        
        // Update chat areas
        document.querySelectorAll('.chat-messages-container').forEach(container => {
            container.classList.toggle('active', container.id === `${tabId}ChatMessages`);
        });
        
        this.loadChatMessages(tabId);
    }
    
    loadFriends() {
        // Mock friends data
        const mockFriends = [
            {
                id: 'friend1',
                username: 'CoolPlayer123',
                avatar: 'https://cdn-icons-png.flaticon.com/512/4333/4333609.png',
                status: 'online',
                lastSeen: 'Now',
                game: 'Obby Adventure'
            },
            {
                id: 'friend2',
                username: 'ProBuilder',
                avatar: 'https://cdn-icons-png.flaticon.com/512/4333/4333609.png',
                status: 'ingame',
                lastSeen: '2 min ago',
                game: 'Building Simulator'
            },
            {
                id: 'friend3',
                username: 'ChatMaster',
                avatar: 'https://cdn-icons-png.flaticon.com/512/4333/4333609.png',
                status: 'online',
                lastSeen: 'Now',
                game: null
            }
        ];
        
        this.friends = mockFriends;
        
        // Update friends list
        const friendsList = document.getElementById('friendsList');
        const chatFriendsList = document.getElementById('chatFriendsList');
        
        if (friendsList) {
            friendsList.innerHTML = this.friends.map(friend => `
                <div class="friend-item" data-friend-id="${friend.id}">
                    <div class="friend-avatar">
                        <img src="${friend.avatar}" alt="${friend.username}">
                        <span class="friend-status status-${friend.status}"></span>
                    </div>
                    <div class="friend-info">
                        <div class="friend-name">${friend.username}</div>
                        <div class="friend-status-text">
                            ${friend.status === 'ingame' ? `Playing ${friend.game}` : friend.status}
                        </div>
                    </div>
                    <div class="friend-actions">
                        <button class="friend-action-btn" data-action="message">
                            <i class="fas fa-comment"></i>
                        </button>
                        <button class="friend-action-btn" data-action="call">
                            <i class="fas fa-phone"></i>
                        </button>
                    </div>
                </div>
            `).join('');
            
            // Add click handlers
            friendsList.querySelectorAll('.friend-item').forEach(item => {
                item.addEventListener('click', (e) => {
                    if (!e.target.closest('.friend-actions')) {
                        const friendId = item.dataset.friendId;
                        this.openFriendChat(friendId);
                    }
                });
            });
        }
        
        // Update count
        document.getElementById('onlineFriendsCount').textContent = 
            this.friends.filter(f => f.status === 'online' || f.status === 'ingame').length;
    }
    
    loadChatMessages(chatType) {
        const messagesArea = document.getElementById('messagesArea');
        if (!messagesArea) return;
        
        let messages = this.messages[chatType] || [];
        
        if (chatType === 'friends' && messages.length === 0) {
            // Add some mock messages
            messages = [
                {
                    id: 'msg1',
                    sender: 'CoolPlayer123',
                    avatar: 'https://cdn-icons-png.flaticon.com/512/4333/4333609.png',
                    message: 'Hey! Want to play Obby Adventure together?',
                    timestamp: new Date(Date.now() - 3600000).toISOString(),
                    isCurrentUser: false
                },
                {
                    id: 'msg2',
                    sender: 'You',
                    avatar: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png',
                    message: 'Sure! I\'ll join your server.',
                    timestamp: new Date(Date.now() - 3500000).toISOString(),
                    isCurrentUser: true
                },
                {
                    id: 'msg3',
                    sender: 'CoolPlayer123',
                    avatar: 'https://cdn-icons-png.flaticon.com/512/4333/4333609.png',
                    message: 'Great! I\'m in server "Obby Fun"',
                    timestamp: new Date(Date.now() - 3400000).toISOString(),
                    isCurrentUser: false
                }
            ];
            
            this.messages[chatType] = messages;
            localStorage.setItem('akblox_chat_messages', JSON.stringify(this.messages));
        }
        
        messagesArea.innerHTML = messages.map(msg => `
            <div class="message ${msg.isCurrentUser ? 'current-user' : ''}">
                <div class="message-header">
                    <div class="message-avatar">
                        <img src="${msg.avatar}" alt="${msg.sender}">
                    </div>
                    <div class="message-sender">${msg.sender}</div>
                    <div class="message-time">${this.formatTime(msg.timestamp)}</div>
                </div>
                <div class="message-content">${this.escapeHtml(msg.message)}</div>
            </div>
        `).join('');
        
        // Scroll to bottom
        messagesArea.scrollTop = messagesArea.scrollHeight;
    }
    
    sendMessage() {
        const input = document.getElementById('chatInput');
        const message = input.value.trim();
        
        if (!message) return;
        
        const currentUser = window.authSystem?.currentUser;
        if (!currentUser) return;
        
        const newMessage = {
            id: 'msg_' + Date.now(),
            sender: currentUser.isGuest ? currentUser.username : currentUser.username,
            avatar: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png',
            message: message,
            timestamp: new Date().toISOString(),
            isCurrentUser: true
        };
        
        // Add to messages
        if (!this.messages[this.currentChat]) {
            this.messages[this.currentChat] = [];
        }
        
        this.messages[this.currentChat].push(newMessage);
        localStorage.setItem('akblox_chat_messages', JSON.stringify(this.messages));
        
        // Update UI
        this.loadChatMessages(this.currentChat);
        
        // Clear input
        input.value = '';
        input.focus();
        
        // Simulate response for friends chat
        if (this.currentChat === 'friends') {
            setTimeout(() => {
                this.simulateFriendResponse();
            }, 1000);
        }
    }
    
    simulateFriendResponse() {
        const friends = ['CoolPlayer123', 'ProBuilder', 'ChatMaster'];
        const randomFriend = friends[Math.floor(Math.random() * friends.length)];
        const responses = [
            'Nice! Want to team up?',
            'I\'m in the same game!',
            'Check out my new avatar!',
            'Join my server!',
            'Let\'s play together!'
        ];
        
        const response = {
            id: 'msg_' + Date.now(),
            sender: randomFriend,
            avatar: 'https://cdn-icons-png.flaticon.com/512/4333/4333609.png',
            message: responses[Math.floor(Math.random() * responses.length)],
            timestamp: new Date().toISOString(),
            isCurrentUser: false
        };
        
        if (!this.messages[this.currentChat]) {
            this.messages[this.currentChat] = [];
        }
        
        this.messages[this.currentChat].push(response);
        localStorage.setItem('akblox_chat_messages', JSON.stringify(this.messages));
        
        this.loadChatMessages(this.currentChat);
        
        // Show notification
        this.showMessageNotification(randomFriend, response.message);
    }
    
    simulateMessages() {
        // Simulate incoming messages every 30-60 seconds
        setInterval(() => {
            if (Math.random() > 0.7) { // 30% chance
                this.simulateFriendResponse();
            }
        }, 30000 + Math.random() * 30000);
    }
    
    openFriendChat(friendId) {
        const friend = this.friends.find(f => f.id === friendId);
        if (!friend) return;
        
        this.switchChatTab('friends');
        
        // In a real implementation, this would load the specific friend's chat
        this.showToast(`Opening chat with ${friend.username}`, 'info');
    }
    
    searchUsers(query) {
        if (!query || query.length < 2) {
            document.getElementById('searchResults').style.display = 'none';
            return;
        }
        
        // Mock search results
        const results = [
            { username: 'CoolPlayer123', status: 'online', avatar: 'https://cdn-icons-png.flaticon.com/512/4333/4333609.png' },
            { username: 'ProBuilder', status: 'ingame', avatar: 'https://cdn-icons-png.flaticon.com/512/4333/4333609.png' },
            { username: 'ChatMaster', status: 'online', avatar: 'https://cdn-icons-png.flaticon.com/512/4333/4333609.png' },
            { username: 'GameDev2023', status: 'offline', avatar: 'https://cdn-icons-png.flaticon.com/512/4333/4333609.png' }
        ].filter(user => 
            user.username.toLowerCase().includes(query.toLowerCase())
        );
        
        const resultsContainer = document.getElementById('searchResults');
        if (results.length > 0) {
            resultsContainer.innerHTML = results.map(user => `
                <div class="search-result-item" data-username="${user.username}">
                    <img src="${user.avatar}" alt="${user.username}" class="result-avatar">
                    <div class="result-info">
                        <div class="result-username">${user.username}</div>
                        <div class="result-status status-${user.status}">${user.status}</div>
                    </div>
                    <button class="result-action add-friend" data-username="${user.username}">
                        <i class="fas fa-user-plus"></i>
                    </button>
                    <button class="result-action message" data-username="${user.username}">
                        <i class="fas fa-comment"></i>
                    </button>
                </div>
            `).join('');
            
            resultsContainer.style.display = 'block';
            
            // Add event listeners
            resultsContainer.querySelectorAll('.add-friend').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const username = btn.dataset.username;
                    this.sendFriendRequest(username);
                });
            });
            
            resultsContainer.querySelectorAll('.message').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const username = btn.dataset.username;
                    this.openUserChat(username);
                });
            });
            
            // Close results when clicking outside
            document.addEventListener('click', (e) => {
                if (!resultsContainer.contains(e.target) && e.target.id !== 'globalSearch') {
                    resultsContainer.style.display = 'none';
                }
            });
        } else {
            resultsContainer.style.display = 'none';
        }
    }
    
    sendFriendRequest(username) {
        // Show glowing notification
        this.showGlowingNotification({
            title: 'Friend Request Sent',
            message: `Friend request sent to ${username}`,
            type: 'friend_request'
        });
        
        // Simulate friend request response after 5-10 seconds
        setTimeout(() => {
            if (Math.random() > 0.3) { // 70% chance of acceptance
                this.showGlowingNotification({
                    title: 'Friend Request Accepted',
                    message: `${username} accepted your friend request!`,
                    type: 'friend_accepted'
                });
                
                // Add to friends list
                const newFriend = {
                    id: 'friend_' + Date.now(),
                    username: username,
                    avatar: 'https://cdn-icons-png.flaticon.com/512/4333/4333609.png',
                    status: 'online',
                    lastSeen: 'Now'
                };
                
                this.friends.push(newFriend);
                localStorage.setItem('akblox_friends', JSON.stringify(this.friends));
                this.loadFriends();
            }
        }, 5000 + Math.random() * 5000);
    }
    
    openUserChat(username) {
        this.switchChatTab('friends');
        this.showToast(`Opening chat with ${username}`, 'info');
    }
    
    toggleChat() {
        const chatContainer = document.getElementById('chatContainer');
        if (chatContainer) {
            chatContainer.classList.toggle('hidden');
        }
    }
    
    toggleVoiceChat() {
        // This would connect to voice chat
        this.showToast('Voice chat toggled', 'info');
    }
    
    showMessageNotification(sender, message) {
        // Update notification count
        const countElement = document.querySelector('.notification-count');
        if (countElement) {
            const currentCount = parseInt(countElement.textContent) || 0;
            countElement.textContent = currentCount + 1;
        }
        
        // Show glowing notification
        this.showGlowingNotification({
            title: `Message from ${sender}`,
            message: message,
            type: 'message'
        });
    }
    
    showGlowingNotification(data) {
        const notification = document.getElementById('glowingNotification');
        if (!notification) return;
        
        document.getElementById('glowTitle').textContent = data.title;
        document.getElementById('glowMessage').textContent = data.message;
        
        // Update icon based on type
        const icon = notification.querySelector('.glow-icon i');
        icon.className = `fas fa-${data.type === 'friend_request' ? 'user-plus' : 
                          data.type === 'friend_accepted' ? 'user-check' : 
                          data.type === 'message' ? 'comment' : 'bell'}`;
        
        // Show notification
        notification.classList.add('show');
        
        // Auto hide after 10 seconds
        setTimeout(() => {
            notification.classList.remove('show');
        }, 10000);
        
        // Add button handlers
        document.getElementById('glowAcceptBtn')?.addEventListener('click', () => {
            notification.classList.remove('show');
            this.showToast('Request accepted!', 'success');
        });
        
        document.getElementById('glowDeclineBtn')?.addEventListener('click', () => {
            notification.classList.remove('show');
            this.showToast('Request declined', 'info');
        });
    }
    
    showToast(message, type = 'info') {
        // Simple toast notification
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            padding: 12px 20px;
            background-color: ${type === 'success' ? '#43b581' : type === 'error' ? '#f04747' : '#7289da'};
            color: white;
            border-radius: 5px;
            z-index: 3000;
            animation: slideInRight 0.3s ease;
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
    
    formatTime(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;
        
        if (diff < 60000) return 'Just now';
        if (diff < 3600000) return Math.floor(diff / 60000) + 'm ago';
        if (diff < 86400000) return Math.floor(diff / 3600000) + 'h ago';
        
        return date.toLocaleDateString();
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize chat system
document.addEventListener('DOMContentLoaded', function() {
    window.chatSystem = new ChatSystem();
});
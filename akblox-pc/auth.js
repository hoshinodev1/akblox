// Authentication System for AKBlox
class AuthSystem {
    constructor() {
        this.currentUser = null;
        this.isGuest = false;
        this.users = JSON.parse(localStorage.getItem('akblox_users')) || [];
        this.sessions = JSON.parse(localStorage.getItem('akblox_sessions')) || {};
        this.init();
    }
    
    init() {
        this.loadCurrentSession();
        this.setupEventListeners();
        this.updateUI();
    }
    
    setupEventListeners() {
        // Auth tabs
        document.querySelectorAll('.auth-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const tabId = e.target.dataset.tab;
                this.switchAuthTab(tabId);
            });
        });
        
        // Switch tab links
        document.querySelectorAll('.switch-tab').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const tab = e.target.getAttribute('href').replace('#', '');
                this.switchAuthTab(tab);
            });
        });
        
        // Login form
        document.getElementById('loginForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.login();
        });
        
        // Register form
        document.getElementById('registerForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.register();
        });
        
        // Guest play
        document.getElementById('guestForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.playAsGuest();
        });
        
        // Logout
        document.getElementById('logoutBtn')?.addEventListener('click', () => {
            this.logout();
        });
        
        // Contact owner
        document.getElementById('contactOwnerBtn')?.addEventListener('click', () => {
            this.showContactModal();
        });
        
        // Show password toggle
        document.querySelectorAll('.show-password-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const input = this.closest('.input-with-icon').querySelector('input');
                const icon = this.querySelector('i');
                
                if (input.type === 'password') {
                    input.type = 'text';
                    icon.classList.remove('fa-eye');
                    icon.classList.add('fa-eye-slash');
                } else {
                    input.type = 'password';
                    icon.classList.remove('fa-eye-slash');
                    icon.classList.add('fa-eye');
                }
            });
        });
        
        // Username availability check
        document.getElementById('regUsername')?.addEventListener('input', (e) => {
            this.checkUsernameAvailability(e.target.value);
        });
        
        // Password strength check
        document.getElementById('regPassword')?.addEventListener('input', (e) => {
            this.checkPasswordStrength(e.target.value);
        });
    }
    
    switchAuthTab(tabId) {
        // Update tabs
        document.querySelectorAll('.auth-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabId);
        });
        
        // Update forms
        document.querySelectorAll('.auth-form').forEach(form => {
            form.classList.toggle('active', form.id === `${tabId}Form`);
        });
    }
    
    loadCurrentSession() {
        const session = localStorage.getItem('akblox_current_session');
        if (session) {
            const sessionData = JSON.parse(session);
            if (sessionData.expires > Date.now()) {
                this.currentUser = this.users.find(u => u.id === sessionData.userId);
                this.isGuest = sessionData.isGuest || false;
                return true;
            } else {
                localStorage.removeItem('akblox_current_session');
            }
        }
        return false;
    }
    
    async login() {
        const username = document.getElementById('loginUsername').value;
        const password = document.getElementById('loginPassword').value;
        const rememberMe = document.getElementById('rememberMe')?.checked || false;
        
        if (!username || !password) {
            this.showNotification('Please fill in all fields', 'error');
            return;
        }
        
        // Mock API call - in production, this would be a real API call
        const user = this.users.find(u => 
            (u.username === username || u.email === username) && 
            u.password === this.hashPassword(password)
        );
        
        if (user) {
            this.currentUser = user;
            this.isGuest = false;
            
            // Create session
            const session = {
                userId: user.id,
                token: this.generateToken(),
                expires: Date.now() + (rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000),
                isGuest: false
            };
            
            localStorage.setItem('akblox_current_session', JSON.stringify(session));
            
            // Save to sessions
            if (!this.sessions[user.id]) {
                this.sessions[user.id] = [];
            }
            this.sessions[user.id].push(session);
            localStorage.setItem('akblox_sessions', JSON.stringify(this.sessions));
            
            this.showNotification(`Welcome back, ${user.username}!`, 'success');
            this.updateUI();
            
            // Hide auth, show dashboard
            document.getElementById('authContainer').classList.remove('active');
            document.getElementById('dashboardContainer').classList.add('active');
            
        } else {
            this.showNotification('Invalid username or password', 'error');
        }
    }
    
    async register() {
        const username = document.getElementById('regUsername').value;
        const email = document.getElementById('regEmail').value;
        const password = document.getElementById('regPassword').value;
        const confirmPassword = document.getElementById('regConfirmPassword').value;
        const birthday = document.getElementById('regBirthday').value;
        const acceptTerms = document.getElementById('acceptTerms').checked;
        
        // Validation
        if (!username || !email || !password || !confirmPassword || !birthday) {
            this.showNotification('Please fill in all fields', 'error');
            return;
        }
        
        if (!acceptTerms) {
            this.showNotification('You must accept the terms of service', 'error');
            return;
        }
        
        if (password !== confirmPassword) {
            this.showNotification('Passwords do not match', 'error');
            return;
        }
        
        if (password.length < 8) {
            this.showNotification('Password must be at least 8 characters', 'error');
            return;
        }
        
        if (this.users.find(u => u.username === username)) {
            this.showNotification('Username already taken', 'error');
            return;
        }
        
        if (this.users.find(u => u.email === email)) {
            this.showNotification('Email already registered', 'error');
            return;
        }
        
        // Calculate age
        const birthDate = new Date(birthday);
        const age = Math.floor((Date.now() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
        
        if (age < 13) {
            this.showNotification('You must be at least 13 years old to register', 'error');
            return;
        }
        
        // Create user
        const user = {
            id: this.generateId(),
            username: username,
            email: email,
            password: this.hashPassword(password),
            birthday: birthday,
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString(),
            isVerified: false,
            level: 1,
            experience: 0,
            coins: 1000, // Starting coins
            gems: 50, // Starting gems
            friends: [],
            inventory: [],
            avatar: {
                head: 'default',
                torso: 'default',
                legs: 'default',
                accessories: []
            },
            servers: [],
            settings: {
                theme: 'dark',
                notifications: true,
                privacy: 'friends'
            }
        };
        
        this.users.push(user);
        localStorage.setItem('akblox_users', JSON.stringify(this.users));
        
        // Auto login
        this.currentUser = user;
        this.isGuest = false;
        
        const session = {
            userId: user.id,
            token: this.generateToken(),
            expires: Date.now() + (24 * 60 * 60 * 1000),
            isGuest: false
        };
        
        localStorage.setItem('akblox_current_session', JSON.stringify(session));
        
        this.showNotification(`Account created! Welcome to AKBlox, ${username}!`, 'success');
        this.updateUI();
        
        // Switch to dashboard
        document.getElementById('authContainer').classList.remove('active');
        document.getElementById('dashboardContainer').classList.add('active');
        
        // Send welcome notification
        this.sendNotification({
            type: 'welcome',
            title: 'Welcome to AKBlox!',
            message: 'Start exploring games, customizing your avatar, and making friends!',
            timestamp: new Date().toISOString()
        });
    }
    
    playAsGuest() {
        const guestName = document.getElementById('guestName').value || `Guest_${Math.floor(Math.random() * 9999)}`;
        
        this.currentUser = {
            id: 'guest_' + this.generateId(),
            username: guestName,
            isGuest: true,
            createdAt: new Date().toISOString(),
            coins: 500,
            gems: 10,
            friends: [],
            inventory: [],
            avatar: {
                head: 'default',
                torso: 'default',
                legs: 'default',
                accessories: []
            },
            servers: []
        };
        
        this.isGuest = true;
        
        const session = {
            userId: this.currentUser.id,
            token: this.generateToken(),
            expires: Date.now() + (12 * 60 * 60 * 1000), // 12 hour session for guests
            isGuest: true
        };
        
        localStorage.setItem('akblox_current_session', JSON.stringify(session));
        
        this.showNotification(`Playing as ${guestName}. Some features are limited.`, 'warning');
        this.updateUI();
        
        // Switch to dashboard
        document.getElementById('authContainer').classList.remove('active');
        document.getElementById('dashboardContainer').classList.add('active');
    }
    
    logout() {
        this.currentUser = null;
        this.isGuest = false;
        localStorage.removeItem('akblox_current_session');
        
        this.showNotification('Logged out successfully', 'info');
        this.updateUI();
        
        // Switch to auth screen
        document.getElementById('authContainer').classList.add('active');
        document.getElementById('dashboardContainer').classList.remove('active');
        this.switchAuthTab('login');
    }
    
    checkUsernameAvailability(username) {
        const checkElement = document.getElementById('usernameCheck');
        if (!username || username.length < 3) {
            checkElement.style.display = 'none';
            return;
        }
        
        const isAvailable = !this.users.find(u => u.username.toLowerCase() === username.toLowerCase());
        
        checkElement.style.display = 'flex';
        checkElement.className = `input-check ${isAvailable ? 'valid' : 'invalid'}`;
        checkElement.innerHTML = isAvailable ? '<i class="fas fa-check"></i>' : '<i class="fas fa-times"></i>';
    }
    
    checkPasswordStrength(password) {
        const strengthBar = document.querySelector('.strength-bar');
        const strengthLabel = document.querySelector('.strength-label');
        
        if (!password) {
            strengthBar.style.width = '0%';
            strengthBar.className = 'strength-bar';
            strengthLabel.textContent = '';
            return;
        }
        
        let strength = 0;
        if (password.length >= 8) strength++;
        if (/[A-Z]/.test(password)) strength++;
        if (/[0-9]/.test(password)) strength++;
        if (/[^A-Za-z0-9]/.test(password)) strength++;
        
        const width = (strength / 4) * 100;
        strengthBar.style.width = `${width}%`;
        
        let colorClass = '';
        let label = '';
        
        switch(strength) {
            case 1:
                colorClass = 'weak';
                label = 'Weak';
                break;
            case 2:
                colorClass = 'fair';
                label = 'Fair';
                break;
            case 3:
                colorClass = 'good';
                label = 'Good';
                break;
            case 4:
                colorClass = 'strong';
                label = 'Strong';
                break;
            default:
                colorClass = 'weak';
                label = 'Weak';
        }
        
        strengthBar.className = `strength-bar ${colorClass}`;
        strengthLabel.textContent = label;
    }
    
    updateUI() {
        if (this.currentUser) {
            // Update user info in UI
            const usernameElements = document.querySelectorAll('#currentUsername, #dropdownUsername, .username');
            usernameElements.forEach(el => {
                el.textContent = this.currentUser.username;
            });
            
            // Update currency
            document.getElementById('akCoins')?.textContent = this.currentUser.coins?.toLocaleString() || '0';
            document.getElementById('akGems')?.textContent = this.currentUser.gems?.toLocaleString() || '0';
            document.getElementById('marketBalance')?.textContent = this.currentUser.coins?.toLocaleString() || '0';
            
            // Update avatar
            const avatarImg = document.getElementById('userAvatarImg');
            if (avatarImg) {
                // In production, this would be the user's actual avatar
                avatarImg.src = `https://cdn-icons-png.flaticon.com/512/3135/3135715.png`;
            }
            
            // Show verify badge if verified
            const verifyBadge = document.getElementById('userVerifyBadge');
            if (verifyBadge) {
                verifyBadge.style.display = this.currentUser.isVerified ? 'flex' : 'none';
            }
            
            // Update online status
            document.querySelector('.online-status').style.backgroundColor = '#43b581';
            
            // Show logout button, hide login
            document.getElementById('logoutBtn').style.display = 'block';
            
        } else {
            // Reset UI to logged out state
            document.querySelector('.online-status').style.backgroundColor = '#747f8d';
            document.getElementById('logoutBtn').style.display = 'none';
        }
    }
    
    showContactModal() {
        const modal = document.getElementById('contactModal');
        modal.style.display = 'flex';
        
        // Setup contact form
        const form = document.getElementById('contactForm');
        form.reset();
        
        if (this.currentUser) {
            document.getElementById('contactName').value = this.currentUser.username;
            document.getElementById('contactEmail').value = this.currentUser.email || '';
        }
        
        // Close modal handlers
        document.getElementById('closeContactModal').addEventListener('click', () => {
            modal.style.display = 'none';
        });
        
        document.getElementById('cancelContactBtn').addEventListener('click', () => {
            modal.style.display = 'none';
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
        
        // Form submission
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.sendContactEmail();
        });
    }
    
    async sendContactEmail() {
        const name = document.getElementById('contactName').value;
        const email = document.getElementById('contactEmail').value;
        const subject = document.getElementById('contactSubject').value;
        const message = document.getElementById('contactMessage').value;
        
        if (!name || !email || !subject || !message) {
            this.showNotification('Please fill in all fields', 'error');
            return;
        }
        
        // In production, this would send to your backend which then emails gamedevhuboriginal@gmail.com
        // For now, we'll simulate it
        
        const emailData = {
            to: 'gamedevhuboriginal@gmail.com',
            from: email,
            subject: `AKBlox Contact: ${subject}`,
            message: `From: ${name} (${email})\n\n${message}`,
            timestamp: new Date().toISOString()
        };
        
        // Save to localStorage (simulated)
        let contactMessages = JSON.parse(localStorage.getItem('akblox_contact_messages')) || [];
        contactMessages.push(emailData);
        localStorage.setItem('akblox_contact_messages', JSON.stringify(contactMessages));
        
        this.showNotification('Message sent to AKBlox owner!', 'success');
        document.getElementById('contactModal').style.display = 'none';
        
        // Clear form
        document.getElementById('contactForm').reset();
    }
    
    hashPassword(password) {
        // In production, use proper hashing like bcrypt
        // This is a simple example
        return btoa(password + 'akblox_salt');
    }
    
    generateToken() {
        return 'akblox_' + Math.random().toString(36).substr(2) + Date.now().toString(36);
    }
    
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
    
    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification-item ${type}`;
        notification.innerHTML = `
            <div class="notification-icon">
                <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            </div>
            <div class="notification-content">
                <div class="notification-title">${type.toUpperCase()}</div>
                <div class="notification-message">${message}</div>
                <div class="notification-time">Just now</div>
            </div>
        `;
        
        // Add to notification panel
        const notificationList = document.getElementById('notificationList');
        if (notificationList) {
            notificationList.prepend(notification);
            
            // Update count
            const countElement = document.querySelector('.notification-count');
            if (countElement) {
                const currentCount = parseInt(countElement.textContent) || 0;
                countElement.textContent = currentCount + 1;
            }
        }
        
        // Also show as toast
        this.showToast(message, type);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            notification.remove();
        }, 5000);
    }
    
    showToast(message, type) {
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
    
    sendNotification(notificationData) {
        let notifications = JSON.parse(localStorage.getItem('akblox_notifications')) || [];
        notifications.unshift({
            ...notificationData,
            id: this.generateId(),
            read: false
        });
        localStorage.setItem('akblox_notifications', JSON.stringify(notifications));
    }
}

// Initialize auth system when page loads
document.addEventListener('DOMContentLoaded', function() {
    window.authSystem = new AuthSystem();
});
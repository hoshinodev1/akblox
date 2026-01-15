// Server System for AKBlox
class ServerSystem {
    constructor() {
        this.servers = JSON.parse(localStorage.getItem('akblox_servers')) || this.generateMockServers();
        this.currentServer = null;
        this.setupEventListeners();
        this.loadServers();
        this.updateServerStatus();
    }
    
    generateMockServers() {
        const serverNames = [
            'Obby Fun', 'Tycoon City', 'Roleplay World', 'Adventure Land',
            'Building Hub', 'Racing Central', 'Fight Club', 'Parkour Paradise',
            'Survival Island', 'Creative Space', 'Party Zone', 'Mini Games'
        ];
        
        const regions = ['US West', 'US East', 'Europe', 'Asia', 'Australia'];
        
        return serverNames.map((name, index) => ({
            id: 'server_' + (index + 1),
            name: name,
            region: regions[Math.floor(Math.random() * regions.length)],
            players: Math.floor(Math.random() * 100) + 50,
            maxPlayers: 100,
            ping: Math.floor(Math.random() * 100) + 30,
            game: name.includes('Obby') ? 'Obby Adventure' : 
                  name.includes('Tycoon') ? 'Pizza Tycoon' :
                  name.includes('Roleplay') ? 'Roleplay Simulator' :
                  name.includes('Adventure') ? 'Adventure Quest' : 'Various Games',
            status: 'online',
            lastUpdated: new Date().toISOString()
        }));
    }
    
    setupEventListeners() {
        // Server browser
        document.getElementById('refreshServersBtn')?.addEventListener('click', () => {
            this.refreshServers();
        });
        
        // Join server buttons
        document.addEventListener('click', (e) => {
            if (e.target.closest('.join-server-btn')) {
                const serverItem = e.target.closest('.server-item');
                const serverId = serverItem?.dataset.serverId;
                if (serverId) {
                    this.joinServer(serverId);
                }
            }
        });
    }
    
    loadServers() {
        const serversList = document.getElementById('serversList');
        if (!serversList) return;
        
        serversList.innerHTML = this.servers.map(server => `
            <div class="server-item" data-server-id="${server.id}">
                <div class="server-icon">${server.name.charAt(0)}</div>
                <div class="server-info">
                    <div class="server-name">${server.name}</div>
                    <div class="server-stats">
                        <span class="server-players">${server.players}/${server.maxPlayers}</span>
                        <span class="server-ping">${server.ping}ms</span>
                        <span class="server-region">${server.region}</span>
                    </div>
                </div>
                <button class="join-server-btn">Join</button>
            </div>
        `).join('');
        
        // Update server count
        document.getElementById('serverCount').textContent = this.servers.length;
    }
    
    refreshServers() {
        // Simulate server refresh
        this.servers.forEach(server => {
            server.players = Math.max(50, Math.min(100, 
                server.players + Math.floor(Math.random() * 20) - 10
            ));
            server.ping = Math.floor(Math.random() * 100) + 30;
            server.lastUpdated = new Date().toISOString();
        });
        
        localStorage.setItem('akblox_servers', JSON.stringify(this.servers));
        this.loadServers();
        
        this.showToast('Servers refreshed', 'success');
    }
    
    joinServer(serverId) {
        const server = this.servers.find(s => s.id === serverId);
        if (!server) return;
        
        if (server.players >= server.maxPlayers) {
            this.showToast('Server is full!', 'error');
            return;
        }
        
        this.currentServer = server;
        
        // Update player count
        server.players++;
        localStorage.setItem('akblox_servers', JSON.stringify(this.servers));
        this.loadServers();
        
        // Show success message
        this.showToast(`Joining ${server.name}...`, 'success');
        
        // In a real implementation, this would load the game
        setTimeout(() => {
            this.showToast(`Connected to ${server.name}!`, 'success');
            
            // Update user's current server
            const user = window.authSystem?.currentUser;
            if (user) {
                user.currentServer = server.id;
            }
        }, 2000);
    }
    
    updateServerStatus() {
        // Simulate server status changes
        setInterval(() => {
            this.servers.forEach(server => {
                if (Math.random() > 0.95) { // 5% chance of status change
                    server.status = server.status === 'online' ? 'maintenance' : 'online';
                    server.lastUpdated = new Date().toISOString();
                }
                
                // Update player counts slightly
                const change = Math.floor(Math.random() * 10) - 5;
                server.players = Math.max(0, Math.min(server.maxPlayers, server.players + change));
            });
            
            localStorage.setItem('akblox_servers', JSON.stringify(this.servers));
            
            // Update UI if needed
            if (document.visibilityState === 'visible') {
                this.loadServers();
            }
        }, 30000); // Update every 30 seconds
    }
    
    showToast(message, type = 'info') {
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
}

// Initialize server system
document.addEventListener('DOMContentLoaded', function() {
    window.serverSystem = new ServerSystem();
});

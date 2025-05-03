/**
 * UI helper functions for the Conference Chat application
 */

class ChatUI {
    constructor() {
        this.elements = {
            userForm: null,
            chatInterface: null,
            messagesList: null,
            messageInput: null,
            sendButton: null,
            userInfo: null,
            logoutButton: null,
            errorAlert: null
        };
    }

    /**
     * Initialize UI elements
     */
    init() {
        console.log('Initializing UI elements...');
        
        // Get all relevant DOM elements
        this.elements.userForm = document.getElementById('userForm');
        this.elements.chatInterface = document.getElementById('chatInterface');
        this.elements.messagesList = document.getElementById('messagesList');
        this.elements.messageInput = document.getElementById('messageInput');
        this.elements.sendButton = document.getElementById('sendButton');
        this.elements.userInfo = document.getElementById('userInfo');
        this.elements.logoutButton = document.getElementById('logoutButton');
        this.elements.errorAlert = document.getElementById('errorAlert');

        // Log status of UI elements
        console.log('UI elements found:', {
            userForm: !!this.elements.userForm,
            chatInterface: !!this.elements.chatInterface,
            messagesList: !!this.elements.messagesList,
            messageInput: !!this.elements.messageInput,
            sendButton: !!this.elements.sendButton,
            userInfo: !!this.elements.userInfo,
            logoutButton: !!this.elements.logoutButton,
            errorAlert: !!this.elements.errorAlert
        });

        // Initial UI state
        this.hideElement(this.elements.errorAlert);
    }

    /**
     * Show the user login form and hide the chat interface
     */
    showUserForm() {
        if (!this.elements.userForm || !this.elements.chatInterface) return;
        
        this.showElement(this.elements.userForm);
        this.hideElement(this.elements.chatInterface);
    }

    /**
     * Show the chat interface and hide the user login form
     */
    showChatInterface() {
        if (!this.elements.userForm || !this.elements.chatInterface) return;
        
        this.hideElement(this.elements.userForm);
        this.showElement(this.elements.chatInterface);
    }

    /**
     * Update the user information display
     * @param {Object} user - User information object
     */
    updateUserInfo(user) {
        if (!this.elements.userInfo || !user) return;
        
        const nameElement = this.elements.userInfo.querySelector('.user-name');
        const roleElement = this.elements.userInfo.querySelector('.user-role');
        
        if (nameElement) nameElement.textContent = user.name;
        if (roleElement) {
            roleElement.textContent = user.role;
            roleElement.className = `badge badge-${user.role}`;
        }
    }

    /**
     * Add a message to the chat display
     * @param {Object} message - Message object
     * @param {boolean} isCurrentUser - Whether the message is from the current user
     */
    addMessage(message, isCurrentUser) {
        console.log('Adding message to UI:', message, 'isCurrentUser:', isCurrentUser);
        
        if (!this.elements.messagesList) {
            console.error('Message list element not found');
            return;
        }
        
        if (!message) {
            console.error('Cannot add undefined message');
            return;
        }
        
        const messageEl = document.createElement('div');
        messageEl.className = `message ${isCurrentUser ? 'message-own' : 'message-other'}`;
        
        const messageHeader = document.createElement('div');
        messageHeader.className = 'message-header';
        
        const nameSpan = document.createElement('span');
        nameSpan.className = 'message-name';
        nameSpan.textContent = message.user_name;
        
        const timeSpan = document.createElement('span');
        timeSpan.className = 'message-time';
        timeSpan.textContent = this.formatTimestamp(message.created_at);
        console.log('Message timestamp:', message.created_at, 'formatted as:', this.formatTimestamp(message.created_at));
        
        messageHeader.appendChild(nameSpan);
        messageHeader.appendChild(timeSpan);
        
        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        messageContent.textContent = message.content;
        
        messageEl.appendChild(messageHeader);
        messageEl.appendChild(messageContent);
        
        this.elements.messagesList.appendChild(messageEl);
        console.log('Message added to DOM');
        
        // Scroll to the bottom
        this.scrollToBottom();
    }

    /**
     * Clear the message input field
     */
    clearMessageInput() {
        if (this.elements.messageInput) {
            this.elements.messageInput.value = '';
            this.elements.messageInput.focus();
        }
    }

    /**
     * Scroll the message list to the bottom
     */
    scrollToBottom() {
        if (this.elements.messagesList) {
            this.elements.messagesList.scrollTop = this.elements.messagesList.scrollHeight;
        }
    }

    /**
     * Show an error message
     * @param {string} message - Error message to display
     */
    showError(message) {
        if (!this.elements.errorAlert) return;
        
        this.elements.errorAlert.textContent = message;
        this.showElement(this.elements.errorAlert);
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            this.hideElement(this.elements.errorAlert);
        }, 5000);
    }

    /**
     * Format a timestamp into a readable time
     * @param {string} timestamp - ISO timestamp
     * @returns {string} - Formatted time string
     */
    formatTimestamp(timestamp) {
        if (!timestamp) return '';
        
        const date = new Date(timestamp);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    /**
     * Show an element
     * @param {HTMLElement} element - Element to show
     */
    showElement(element) {
        if (element) {
            element.classList.remove('hidden');
        }
    }

    /**
     * Hide an element
     * @param {HTMLElement} element - Element to hide
     */
    hideElement(element) {
        if (element) {
            element.classList.add('hidden');
        }
    }
}

// Create and export a singleton instance
const chatUI = new ChatUI();

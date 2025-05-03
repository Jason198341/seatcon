/**
 * Chat functionality for the Conference Chat application
 */

class ChatManager {
    constructor() {
        this.lastMessageTime = 0;
        this.isInitialized = false;
    }

    /**
     * Initialize the chat manager
     */
    init() {
        if (this.isInitialized) return;
        
        // Initialize UI
        chatUI.init();
        
        // Check for saved user
        const savedUser = supabaseClient.getSavedUserInfo();
        if (savedUser) {
            this.setupChatInterface(savedUser);
        } else {
            this.setupUserForm();
        }
        
        this.isInitialized = true;
    }

    /**
     * Set up the user login form and event listeners
     */
    setupUserForm() {
        chatUI.showUserForm();
        
        const userForm = document.getElementById('userForm');
        if (!userForm) return;
        
        userForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const nameInput = document.getElementById('userNameInput');
            const emailInput = document.getElementById('userEmailInput');
            const roleSelect = document.getElementById('userRoleInput');
            
            if (!nameInput || !emailInput || !roleSelect) return;
            
            const name = nameInput.value.trim();
            const email = emailInput.value.trim();
            const role = roleSelect.value;
            
            if (!name) {
                chatUI.showError('Please enter your name');
                return;
            }
            
            if (!email || !this.validateEmail(email)) {
                chatUI.showError('Please enter a valid email address');
                return;
            }
            
            const userInfo = { name, email, role };
            const success = supabaseClient.setUser(userInfo);
            
            if (success) {
                this.setupChatInterface(userInfo);
            }
        });
    }

    /**
     * Set up the chat interface after user login
     * @param {Object} user - User information
     */
    setupChatInterface(user) {
        chatUI.showChatInterface();
        chatUI.updateUserInfo(user);
        
        // Load existing messages
        this.loadMessages();
        
        // Set up message subscription
        supabaseClient.subscribeToMessages(this.handleNewMessage.bind(this));
        
        // Set up send message functionality
        const sendButton = document.getElementById('sendButton');
        const messageInput = document.getElementById('messageInput');
        
        if (sendButton && messageInput) {
            sendButton.addEventListener('click', () => this.sendMessage());
            
            messageInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
                }
            });
            
            messageInput.addEventListener('input', () => {
                sendButton.disabled = messageInput.value.trim() === '';
            });
        }
        
        // Set up logout functionality
        const logoutButton = document.getElementById('logoutButton');
        if (logoutButton) {
            logoutButton.addEventListener('click', () => this.logout());
        }
    }

    /**
     * Load existing messages from the database
     */
    async loadMessages() {
        console.log('Loading existing messages...');
        const messages = await supabaseClient.getMessages();
        
        console.log('Loaded messages:', messages);
        
        if (!messages || !messages.length) {
            console.log('No messages found or error loading messages');
            return;
        }
        
        const currentUser = supabaseClient.currentUser;
        console.log('Current user for message comparison:', currentUser);
        
        messages.forEach(message => {
            const isCurrentUser = currentUser && message.user_email === currentUser.email;
            console.log(`Adding message from ${message.user_name}, isCurrentUser: ${isCurrentUser}`);
            chatUI.addMessage(message, isCurrentUser);
        });
        
        chatUI.scrollToBottom();
    }

    /**
     * Handle a new message from the real-time subscription
     * @param {Object} message - New message object
     */
    handleNewMessage(message) {
        console.log('Received new message from subscription:', message);
        
        if (!message) {
            console.error('Received empty message in handler');
            return;
        }
        
        const currentUser = supabaseClient.currentUser;
        const isCurrentUser = currentUser && message.user_email === currentUser.email;
        
        console.log(`Handling message from ${message.user_name}, isCurrentUser: ${isCurrentUser}`);
        chatUI.addMessage(message, isCurrentUser);
        chatUI.scrollToBottom();
    }

    /**
     * Send a new message
     */
    async sendMessage() {
        console.log('Attempting to send message...');
        
        const messageInput = document.getElementById('messageInput');
        if (!messageInput) {
            console.error('Message input element not found');
            return;
        }
        
        const content = messageInput.value.trim();
        if (!content) {
            console.log('Message content is empty, not sending');
            return;
        }
        
        // Simple throttle to prevent spam
        const now = Date.now();
        if (now - this.lastMessageTime < CONFIG.CHAT.MESSAGE_THROTTLE) {
            console.log('Message throttled, sending too fast');
            chatUI.showError('Please wait a moment before sending another message');
            return;
        }
        
        console.log(`Sending message: "${content}"`);
        
        // Send the message
        const result = await supabaseClient.sendMessage(content);
        
        if (result) {
            console.log('Message sent successfully:', result);
            chatUI.clearMessageInput();
            this.lastMessageTime = now;
        } else {
            console.error('Failed to send message');
            chatUI.showError('Failed to send message. Please try again.');
        }
    }

    /**
     * Log out the current user
     */
    logout() {
        supabaseClient.unsubscribeFromMessages();
        supabaseClient.clearUser();
        
        // Reset UI
        chatUI.showUserForm();
        
        // Clear message list
        const messagesList = document.getElementById('messagesList');
        if (messagesList) {
            messagesList.innerHTML = '';
        }
    }

    /**
     * Validate an email address
     * @param {string} email - Email address to validate
     * @returns {boolean} - Whether the email is valid
     */
    validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }
}

// Create and export a singleton instance
const chatManager = new ChatManager();

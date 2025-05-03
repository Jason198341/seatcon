/**
 * Chat functionality for the Conference Chat application
 */

class ChatManager {
    constructor() {
        this.lastMessageTime = 0;
        this.isInitialized = false;
        this.boundHandleNewMessage = null;
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
        console.log('Setting up chat interface for user:', user);
        chatUI.showChatInterface();
        chatUI.updateUserInfo(user);
        
        // Load existing messages
        this.loadMessages();
        
        // Set up message subscription
        this.setupRealTimeSubscription();
        
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
     * Set up real-time message subscription with auto-reconnect
     */
    setupRealTimeSubscription() {
        console.log('Setting up real-time subscription for messages');
        
        // Bind the handler to this instance and store the bound function
        this.boundHandleNewMessage = this.handleNewMessage.bind(this);
        
        // Subscribe to messages
        supabaseClient.subscribeToMessages(this.boundHandleNewMessage);
        
        // Set up auto-reconnect
        window.addEventListener('online', () => {
            console.log('Network connection restored, reconnecting to message stream');
            supabaseClient.unsubscribeFromMessages();
            supabaseClient.subscribeToMessages(this.boundHandleNewMessage);
            
            // Reload messages to ensure we didn't miss any
            this.loadMessages();
        });

        // Set a periodic reconnection to ensure subscription stays active
        this.reconnectInterval = setInterval(() => {
            console.log('Performing periodic reconnection check...');
            supabaseClient.unsubscribeFromMessages();
            supabaseClient.subscribeToMessages(this.boundHandleNewMessage);
        }, 60000); // Check every minute
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
        
        // Clear existing messages to prevent duplicates
        const messagesList = document.getElementById('messagesList');
        if (messagesList) {
            messagesList.innerHTML = '';
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
        
        // Get message list element to check if this message already exists
        const messagesList = document.getElementById('messagesList');
        if (messagesList) {
            // Simple check to avoid duplicate messages
            const messageElements = messagesList.querySelectorAll('.message-content');
            let isDuplicate = false;
            
            messageElements.forEach(element => {
                if (element.textContent === message.content &&
                    element.closest('.message').querySelector('.message-name').textContent === message.user_name) {
                    isDuplicate = true;
                }
            });
            
            if (isDuplicate) {
                console.log('Duplicate message detected, not adding to UI');
                return;
            }
        }
        
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
        
        // Clear input immediately to improve perceived performance
        chatUI.clearMessageInput();
        
        // Add optimistic message to UI
        const optimisticMessage = {
            id: 'temp-' + Date.now(),
            user_name: supabaseClient.currentUser.name,
            user_email: supabaseClient.currentUser.email,
            user_role: supabaseClient.currentUser.role,
            content: content,
            created_at: new Date().toISOString()
        };
        
        chatUI.addMessage(optimisticMessage, true);
        chatUI.scrollToBottom();
        
        // Send the message
        const result = await supabaseClient.sendMessage(content);
        
        if (result) {
            console.log('Message sent successfully:', result);
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
        // Clear reconnection interval
        if (this.reconnectInterval) {
            clearInterval(this.reconnectInterval);
            this.reconnectInterval = null;
        }
        
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

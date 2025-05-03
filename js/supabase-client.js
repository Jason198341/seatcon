/**
 * Supabase client for the Conference Chat application
 * Handles database operations and real-time subscriptions
 */

class SupabaseClient {
    constructor() {
        this.supabase = null;
        this.currentUser = null;
        this.messageSubscription = null;
        this.init();
    }

    /**
     * Initialize the Supabase client
     */
    init() {
        try {
            console.log("Supabase URL:", CONFIG.SUPABASE_URL);
            console.log("Supabase Key (first 10 chars):", CONFIG.SUPABASE_KEY.substring(0, 10) + "...");
            this.supabase = supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_KEY);
            console.log('Supabase client initialized successfully');
            // Test connection
            this.testConnection();
        } catch (error) {
            console.error('Error initializing Supabase client:', error);
        }
    }
    
    /**
     * Test the Supabase connection
     */
    async testConnection() {
        try {
            const { data, error } = await this.supabase
                .from('messages')
                .select('count')
                .limit(1);
                
            if (error) {
                console.error('Connection test failed:', error);
            } else {
                console.log('Connection test successful:', data);
            }
        } catch (error) {
            console.error('Connection test error:', error);
        }
    }

    /**
     * Set the current user information
     * @param {Object} userInfo - User information object
     */
    setUser(userInfo) {
        if (!userInfo || !userInfo.name || !userInfo.email) {
            console.error('Invalid user information');
            return false;
        }

        this.currentUser = {
            name: userInfo.name,
            email: userInfo.email,
            role: userInfo.role || CONFIG.ROLES.ATTENDEE
        };

        // Save user info to local storage
        localStorage.setItem('userInfo', JSON.stringify(this.currentUser));
        return true;
    }

    /**
     * Get saved user information from local storage
     * @returns {Object|null} - User information or null if not found
     */
    getSavedUserInfo() {
        const userInfo = localStorage.getItem('userInfo');
        if (userInfo) {
            try {
                this.currentUser = JSON.parse(userInfo);
                return this.currentUser;
            } catch (error) {
                console.error('Error parsing saved user info:', error);
                return null;
            }
        }
        return null;
    }

    /**
     * Clear user information
     */
    clearUser() {
        this.currentUser = null;
        localStorage.removeItem('userInfo');
    }

    /**
     * Send a message to the chat
     * @param {string} content - Message content
     * @returns {Promise<Object|null>} - Created message object or null on error
     */
    async sendMessage(content) {
        if (!this.currentUser || !content.trim()) {
            console.error('User not set or empty message');
            return null;
        }
        
        console.log("Sending message:", content);
        console.log("Current user:", this.currentUser);
        
        try {
            const message = {
                user_name: this.currentUser.name,
                user_email: this.currentUser.email,
                user_role: this.currentUser.role,
                content: content
            };
            
            console.log("Message to insert:", message);
            
            const { data, error } = await this.supabase
                .from('messages')
                .insert([message])
                .select();
                
            if (error) {
                console.error("Insert error details:", error);
                throw error;
            }
            
            console.log("Message inserted successfully:", data);
            return data[0];
        } catch (error) {
            console.error('Error sending message:', error);
            return null;
        }
    }

    /**
     * Get recent messages from the chat
     * @param {number} limit - Maximum number of messages to retrieve
     * @returns {Promise<Array|null>} - Array of messages or null on error
     */
    async getMessages(limit = CONFIG.CHAT.MAX_MESSAGES) {
        try {
            const { data, error } = await this.supabase
                .from('messages')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(limit);
                
            if (error) {
                throw error;
            }
            
            return data.reverse(); // Return in chronological order
        } catch (error) {
            console.error('Error fetching messages:', error);
            return null;
        }
    }

    /**
     * Subscribe to new messages in real-time
     * @param {Function} callback - Callback function to handle new messages
     */
    subscribeToMessages(callback) {
        if (this.messageSubscription) {
            this.messageSubscription.unsubscribe();
        }
        
        console.log("Subscribing to messages...");
        
        try {
            // 새로운 방식의 Supabase 실시간 구독
            this.messageSubscription = this.supabase
                .channel('public:messages')
                .on(
                    'postgres_changes',
                    {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'messages'
                    },
                    (payload) => {
                        console.log("New message received:", payload);
                        const message = payload.new;
                        if (message) {
                            // 메시지가 성공적으로 수신되면 즉시 콜백 호출
                            callback(message);
                        }
                    }
                )
                .subscribe((status) => {
                    console.log("Subscription status:", status);
                    
                    if (status === 'SUBSCRIBED') {
                        console.log("Successfully subscribed to real-time updates");
                    } else if (status === 'CHANNEL_ERROR') {
                        console.error("Error subscribing to real-time updates");
                        // 에러 발생 시 재시도
                        setTimeout(() => this.subscribeToMessages(callback), 3000);
                    }
                });
                
            // 구독이 활성화되었는지 확인
            if (this.messageSubscription) {
                console.log("Subscription object created:", this.messageSubscription);
            } else {
                console.error("Failed to create subscription object");
            }
        } catch (error) {
            console.error("Error setting up real-time subscription:", error);
            // 예외 발생 시 재시도
            setTimeout(() => this.subscribeToMessages(callback), 3000);
        }
    }

    /**
     * Unsubscribe from real-time messages
     */
    unsubscribeFromMessages() {
        if (this.messageSubscription) {
            this.messageSubscription.unsubscribe();
            this.messageSubscription = null;
        }
    }
}

// Create and export a singleton instance
const supabaseClient = new SupabaseClient();

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
            this.supabase = supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_KEY);
            console.log('Supabase client initialized successfully');
        } catch (error) {
            console.error('Error initializing Supabase client:', error);
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
        
        try {
            const { data, error } = await this.supabase
                .from('messages')
                .insert([
                    {
                        user_name: this.currentUser.name,
                        user_email: this.currentUser.email,
                        user_role: this.currentUser.role,
                        content: content
                    }
                ])
                .select();
                
            if (error) {
                throw error;
            }
            
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
        
        this.messageSubscription = this.supabase
            .channel('public:messages')
            .on('postgres_changes', 
                { event: 'INSERT', schema: 'public', table: 'messages' }, 
                payload => {
                    const message = payload.new;
                    callback(message);
                }
            )
            .subscribe();
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

/**
 * Configuration file for the Conference Chat application
 * Contains API keys and other configuration settings
 */

const CONFIG = {
    // Supabase configuration
    SUPABASE_URL: 'https://veudhigojdukbqfgjeyh.supabase.co',
    SUPABASE_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZldWRoaWdvamR1a2JxZmdqZXloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUzODgwNjIsImV4cCI6MjA2MDk2NDA2Mn0.Vh0TUArZacAuRiLeoxml26u9GJxSOrziUhC3vURJVao',
    
    // Google Cloud Translation API (for future use)
    GOOGLE_TRANSLATE_API_KEY: 'AIzaSyC8ugZVxiEk26iwvUnIQCzNcTUiYpxkigs',
    
    // Chat settings
    CHAT: {
        MAX_MESSAGES: 100,            // Maximum number of messages to load initially
        MESSAGE_THROTTLE: 500,        // Minimum time between messages in ms
        DEFAULT_LANGUAGE: 'ko',       // Default language
        TRANSLATION_CACHE_EXPIRY: 86400000, // 24 hours in milliseconds
    },
    
    // User roles
    ROLES: {
        ATTENDEE: 'attendee',
        SPEAKER: 'speaker',
        MODERATOR: 'moderator',
        ADMIN: 'admin'
    }
};

// Prevent modification of the configuration
Object.freeze(CONFIG);

/**
 * Main application file for the Conference Chat
 */

// Check if service worker is supported and register it for offline functionality
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('service-worker.js').then(registration => {
            console.log('ServiceWorker registration successful with scope: ', registration.scope);
        }).catch(error => {
            console.log('ServiceWorker registration failed: ', error);
        });
    });
}

// Initialize the chat application when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize the chat manager
    chatManager.init();
    console.log('Conference Chat application initialized');
    
    // Setup visibility change handling for better real-time reliability
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
            console.log('Page became visible, refreshing message subscription');
            // Page became visible again, refresh the message subscription
            if (supabaseClient.currentUser) {
                supabaseClient.unsubscribeFromMessages();
                supabaseClient.subscribeToMessages(chatManager.boundHandleNewMessage);
                chatManager.loadMessages(); // Reload messages to ensure we didn't miss any
            }
        }
    });
    
    // Force reconnect after losing connection
    window.addEventListener('offline', () => {
        console.log('Network connection lost');
        chatUI.showError('Network connection lost. Waiting to reconnect...');
    });
});


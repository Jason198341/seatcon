# Conference Chat Application

A real-time chat application designed for conference participants to communicate during events. Built with HTML, CSS, JavaScript, and Supabase for backend services.

## Features

- Real-time messaging
- User authentication (name, email, role)
- Role-based user interface (attendee, speaker, moderator)
- Message history persistence
- Responsive design for desktop and mobile

## Getting Started

### Prerequisites

- Modern web browser
- Internet connection
- Python or Node.js (for running the local server)

### Installation

1. Clone the repository:
   ```
   git clone <repository-url>
   ```

2. Open the project folder:
   ```
   cd conference-chat
   ```

3. Start the local development server:

   **Using Python (recommended):**
   ```
   start_server.bat
   ```
   or manually:
   ```
   python -m http.server 8000
   ```
   Then open http://localhost:8000 in your browser.

   **Using Node.js:**
   ```
   start_node_server.bat
   ```
   or manually:
   ```
   npx serve
   ```
   Then open the URL shown in the console.

### Debugging

The application includes a built-in debug console to help troubleshoot issues:

1. After loading the application in your browser, click the 'Debug' button in the bottom right corner.
2. A debug console will appear showing all console logs, warnings, and errors.
3. This can help diagnose connection issues with Supabase or other problems.

For more advanced debugging, you can also use your browser's Developer Tools (F12).

## Project Structure

```
conference-chat/
├── index.html              # Main HTML file
├── css/
│   └── styles.css          # Main stylesheet
├── js/
│   ├── config.js           # Configuration and API keys
│   ├── app.js              # Main application logic
│   ├── chat.js             # Chat functionality
│   ├── supabase-client.js  # Supabase connection and data handling
│   └── ui.js               # UI-related functions
└── README.md               # Project documentation
```

## Database Schema (Supabase)

The application uses a simple database schema:

```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_name TEXT NOT NULL,
  user_email TEXT,
  user_role TEXT,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Future Enhancements

- Multi-language support using Google Cloud Translation API
- Message reactions/likes
- Private messaging
- File/image sharing
- Admin panel for moderators

## License

This project is licensed under the MIT License - see the LICENSE file for details.

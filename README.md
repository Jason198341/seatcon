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

### Installation

1. Clone the repository:
   ```
   git clone <repository-url>
   ```

2. Open the project folder:
   ```
   cd conference-chat
   ```

3. Open `index.html` in a web browser, or serve the files using a local development server.

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

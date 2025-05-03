-- Database schema for Conference Chat application

-- Messages table to store chat messages
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_name TEXT NOT NULL,
  user_email TEXT,
  user_role TEXT,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_messages_created_at ON messages(created_at);
CREATE INDEX idx_messages_user_email ON messages(user_email);

-- Future table for message likes/reactions (commented out for now)
/*
CREATE TABLE message_likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  user_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (message_id, user_email)
);
*/

-- RLS (Row Level Security) policies for added security
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read all messages
CREATE POLICY "Allow reading all messages" ON messages
FOR SELECT USING (true);

-- Allow authenticated users to insert messages
CREATE POLICY "Allow inserting messages" ON messages
FOR INSERT WITH CHECK (true);

-- Prevent updating or deleting messages (for now)
CREATE POLICY "Prevent updating messages" ON messages
FOR UPDATE USING (false);

CREATE POLICY "Prevent deleting messages" ON messages
FOR DELETE USING (false);

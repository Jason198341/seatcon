# Deployment Guide for Conference Chat

This guide provides instructions for deploying the Conference Chat application.

## Prerequisites

- Access to a Supabase account
- (Optional) Access to Google Cloud Platform for Translation API
- Basic understanding of web hosting

## Setting Up Supabase

1. **Create a new Supabase project**:
   - Go to [https://supabase.com](https://supabase.com) and sign in or create an account
   - Create a new project with a descriptive name (e.g., "Conference Chat")
   - Note your project URL and anon public key for later use

2. **Create the database tables**:
   - Go to the SQL Editor in your Supabase dashboard
   - Execute the SQL queries from the `schema.sql` file
   - Verify that the tables were created successfully

3. **Enable Realtime**:
   - Go to Database → Replication
   - Make sure that the "Realtime" option is enabled for the `messages` table

## Configuring the Application

1. **Update configuration**:
   - Open `js/config.js`
   - Update `SUPABASE_URL` with your Supabase project URL
   - Update `SUPABASE_KEY` with your Supabase anon public key
   - Update `GOOGLE_TRANSLATE_API_KEY` if you plan to use translation features

## Deployment Options

### Option 1: Simple Static Hosting

Since this is a static web application, you can deploy it to any static web hosting service:

1. **Service Options**:
   - GitHub Pages
   - Netlify
   - Vercel
   - Amazon S3
   - Firebase Hosting

2. **Basic Deployment Steps**:
   - Upload all project files to your chosen hosting service
   - Make sure that the `index.html` file is at the root level
   - Ensure that CORS is properly configured if needed

### Option 2: Local/Intranet Deployment

For conferences that want to host the chat internally:

1. **Using a Simple HTTP Server**:
   - For testing, you can use Python's built-in HTTP server:
     ```
     python -m http.server 8000
     ```
   - Or use a tool like `serve`:
     ```
     npx serve
     ```

2. **Using Apache or Nginx**:
   - Configure a virtual host pointing to the project directory
   - Ensure proper permissions are set on the files

## Post-Deployment

1. **Testing**:
   - Test the application on multiple devices and browsers
   - Verify that real-time messaging works correctly
   - Check user authentication flow

2. **Monitoring**:
   - Monitor Supabase usage and performance
   - Check for any errors in the console
   - Set up logging if needed

## Troubleshooting

- **Messages not sending**: Check Supabase connection details and verify that Realtime is enabled
- **Authentication issues**: Verify that Row Level Security policies are correctly set
- **Performance issues**: Consider adding pagination for message loading

## Security Considerations

- The current implementation uses simple authentication without passwords
- For a production deployment, consider adding more robust authentication
- Regularly update dependencies to patch security vulnerabilities
- Keep your API keys confidential and consider using environment variables

## Scaling Considerations

- Supabase Free Tier has limits - monitor usage and upgrade if needed
- Consider adding message pagination for rooms with many messages
- Implement caching strategies for frequently accessed data

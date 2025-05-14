# Campus Companion

A supportive mental health chatbot designed specifically for students, providing guidance and coping strategies for academic stress and other challenges.

## Current Features

- Voice-activated chat interface
- Integration with HuggingFace AI models via the Inference API
- Student mental health dataset analysis for personalized responses
- Real-time communication using Socket.io
- Natural-sounding responses with appropriate Gen Z terminology

## Project Structure

- `index.js`: Express server and AI response handling
- `views/index.html`: Simple web interface
- `public/script.js`: Client-side functionality including speech recognition
- `mental_health_dataset.csv`: Dataset for student mental health insights

## Setup Instructions

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env` file with your HuggingFace API key:
   ```
   HUGGINGFACE_API_KEY=your_api_key_here
   ```
4. Start the server:
   ```
   node index.js
   ```
5. Visit `http://localhost:3000` in your browser

## Planned Enhancements

- **Improved UI**: Update the interface with a modern, user-friendly design
- **Enhanced Dataset**: Expand the mental health dataset with more student-specific data
- **Text-to-Speech**: Add voice output for bot responses
- **Text Input Option**: Allow students to type messages in addition to voice input

## Technologies Used

- Node.js and Express
- Socket.io for real-time communication
- HuggingFace Inference API
- Web Speech API for speech recognition

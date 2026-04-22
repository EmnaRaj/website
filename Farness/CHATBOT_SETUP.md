# Farness Chat Bot - Setup Guide

## Overview
The Farness Chat Bot is now powered by Groq's LLM (llama-3.3-70b-versatile) for intelligent, context-aware conversations. It can answer questions about Farness services and schedule demos.

## Setup Instructions

### 1. Get Your Groq API Key

1. Go to [Groq Console](https://console.groq.com/)
2. Sign in (or create an account - it's free)
3. Navigate to "Keys" or "API Keys"
4. Create a new API key
5. Copy the API key

### 2. Configure Environment Variables

Create a `.env.local` file in the project root with your Groq API key:

```bash
# .env.local
VITE_GROQ_API_KEY=your_actual_api_key_here
```

**Note**: Do NOT commit `.env.local` to GitHub. The `.gitignore` file is already set up to prevent this.

### 3. Start the Development Server

```bash
npm run dev
```

The chat bot will now use the Groq LLM for intelligent responses.

## Features

### Intelligent Conversations
- Powered by Groq's `llama-3.3-70b-versatile` model
- Understands context and nuance
- Grounded with comprehensive Farness knowledge
- Natural, conversational tone

### Knowledge Base
The bot can discuss:
- **What Farness Does**: Autonomous drone platform for industrial inspections
- **Technology**: AI mission planning, edge processing, computer vision, LiDAR, photogrammetry
- **Industries**: Mining, Energy & Utilities, Infrastructure, Industrial Facilities
- **Use Cases**: Pipeline inspection, stockpile analysis, bridge inspection, facility monitoring
- **Benefits**: Cost savings, safety improvements, accuracy specs
- **Deployment**: Cloud, self-hosted, hybrid options
- **Support**: Training, onboarding, technical support

### Demo Scheduling
Users can ask to schedule a demo, and the bot will:
1. Collect their name
2. Collect their email
3. Collect their company
4. Collect their phone number
5. Confirm the information
6. Note that the Farness team will contact them

## API Details

- **Provider**: Groq
- **Model**: `llama-3.3-70b-versatile`
- **API Endpoint**: `https://api.groq.com/openai/v1/chat/completions`
- **Temperature**: 0.7 (balanced responses)
- **Max Tokens**: 1024

## Customization

### To Add More Knowledge
Edit `src/utils/farnessContext.ts` and update the `FARNESS_SYSTEM_PROMPT` with additional information.

### To Change Bot Behavior
- Modify the system prompt in `farnessContext.ts`
- Adjust temperature (0.0-2.0) for more/less creative responses
- Change max tokens for shorter/longer responses

### To Modify UI/UX
Edit `src/components/ChatBot.tsx` to:
- Change colors and styling
- Modify chat widget position
- Add new quick questions
- Customize messages

## Troubleshooting

### "API Key not found"
Make sure your `.env.local` file:
- Exists in the project root
- Has the correct variable name: `VITE_GROQ_API_KEY`
- Contains your actual Groq API key

### "Bot not responding"
- Check your API key is valid at [Groq Console](https://console.groq.com/)
- Check browser console for error messages
- Make sure you have internet connection
- Verify the API endpoint is accessible

### Rate Limiting
Groq has rate limits. If you see errors:
- Wait a few seconds before sending another message
- Check your Groq API usage at the console

## Production Deployment

For production, consider:
1. **Backend Integration**: Don't expose API key in frontend code
   - Create a backend endpoint that calls Groq API
   - Have frontend call your backend instead
2. **Environment Variables**: Use your hosting platform's secrets management
3. **Error Handling**: Add more robust error recovery
4. **Monitoring**: Log conversations for quality assurance
5. **Rate Limiting**: Implement on your backend

## Security Notes

- ⚠️ The API key in this setup is exposed in the browser
- ✅ The code is open source, so this is intentional for demo purposes
- 🔒 For production: Move API calls to a backend server
- 🔐 Never commit API keys to version control

## Need Help?

- Groq Documentation: https://console.groq.com/docs
- Groq API Reference: https://console.groq.com/docs/api-reference
- Farness Team: hello@farness.com or +1 (555) 123-4567

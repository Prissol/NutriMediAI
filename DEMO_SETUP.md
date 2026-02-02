Fast Demo Setup for NutriMedAI

PROBLEM
Local CPU inference is too slow (5+ minutes) for prototype presentations.

SOLUTION
Use cloud API version for fast responses (5-10 seconds).

SETUP INSTRUCTIONS

Option 1: OpenAI GPT-4 Vision (Recommended)

1. Get API Key:
   - Go to platform.openai.com
   - Sign up/login
   - Go to API Keys section
   - Create new secret key
   - Copy the key

2. Install OpenAI library:
   pip install openai

3. Run fast demo:
   python -m streamlit run app_fast_demo.py

4. Select "OpenAI GPT-4 Vision"
5. Paste your API key
6. Upload image and analyze

Cost: ~$0.01-0.03 per image analysis

Option 2: Google Gemini Vision (Free Tier Available)

1. Get API Key:
   - Go to aistudio.google.com
   - Sign up/login
   - Go to Get API Key
   - Create API key
   - Copy the key

2. Install Gemini library:
   pip install google-generativeai

3. Run fast demo:
   python -m streamlit run app_fast_demo.py

4. Select "Google Gemini Vision"
5. Paste your API key
6. Upload image and analyze

Cost: Free tier available (60 requests/minute)

COMPARISON

Local SmolVLM (Current):
- Speed: 5+ minutes
- Cost: Free
- Internet: Not required
- Good for: Development, privacy

Cloud API (Fast Demo):
- Speed: 5-10 seconds
- Cost: Low (~$0.01-0.03 per image)
- Internet: Required
- Good for: Presentations, demos, production

RECOMMENDATION FOR PRESENTATION

Use app_fast_demo.py with Google Gemini (free tier):
1. Fast response time
2. Free for demos
3. Professional results
4. No waiting for audience

After presentation, you can mention:
- Local version available for privacy-sensitive use cases
- Cloud version for production scalability
- Hybrid approach possible

QUICK START

1. Install: pip install google-generativeai
2. Get free API key from aistudio.google.com
3. Run: python -m streamlit run app_fast_demo.py
4. Select Gemini, paste key, analyze!

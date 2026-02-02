Gemini Model Name Fix

PROBLEM
Error: "gemini-pro-vision is not found"

SOLUTION
The code now automatically detects available models and uses the correct one.

HOW IT WORKS
1. Lists all available Gemini models
2. Tries models in this order:
   - gemini-1.5-pro
   - gemini-1.5-flash
   - gemini-pro
   - gemini-pro-vision
3. Uses first available model that works

IF STILL NOT WORKING

Check your API key:
1. Go to https://aistudio.google.com
2. Make sure API key is active
3. Check if you have access to Gemini models

Alternative: Use OpenAI GPT-4 Vision
- Select "OpenAI GPT-4 Vision" instead
- Requires OpenAI API key (platform.openai.com)
- More reliable for demos

QUICK FIX
The updated code should automatically work now. Just refresh browser and try again!

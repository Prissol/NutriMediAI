Moondream Setup Guide

Moondream is a fast, lightweight vision-language model perfect for food analysis!

ADVANTAGES
- Fast on CPU (30-60 seconds vs 5+ minutes)
- Small model size (~1.5GB)
- No API keys needed
- Local processing (privacy)
- Great for demos

INSTALLATION

1. Install dependencies (already done):
   pip install transformers torch pillow streamlit

2. Run Moondream app:
   python -m streamlit run app_moondream.py

   Or use:
   run_moondream.bat

HOW IT WORKS

1. Model loads automatically (~1-2 minutes first time)
2. Upload food image
3. Click "Analyze Food"
4. Get results in 30-60 seconds (CPU) or 5-10 seconds (GPU)

SPEED COMPARISON

SmolVLM: 5+ minutes (CPU) / 10-30 seconds (GPU)
Moondream: 30-60 seconds (CPU) / 5-10 seconds (GPU)

Perfect for demos and presentations!

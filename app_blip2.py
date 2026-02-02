"""
NutriMedAI - BLIP-2 Model Version
Fast and reliable vision-language model for food analysis
BLIP-2 is well-supported and works great on CPU
"""

import streamlit as st
from PIL import Image
import torch
from transformers import Blip2Processor, Blip2ForConditionalGeneration
import gc

# Page Configuration
st.set_page_config(
    page_title="NutriMedAI MVP - BLIP-2",
    page_icon="🥗",
    layout="centered"
)

st.title("🥗 NutriMedAI: Food Analyzer")
st.markdown("### Powered by BLIP-2 - Fast & Reliable")
st.info("⚡ BLIP-2 is optimized for speed and works great on CPU!")

st.markdown("---")

# Load Model and Processor (Cached)
@st.cache_resource
def load_model():
    """Load BLIP-2 model"""
    try:
        st.info("🔄 Loading BLIP-2 model... This may take 2-3 minutes on first run.")
        
        # Use smaller BLIP-2 model for faster loading
        model_id = "Salesforce/blip2-opt-2.7b"
        
        # Load processor
        processor = Blip2Processor.from_pretrained(model_id)
        
        # Load model
        model = Blip2ForConditionalGeneration.from_pretrained(
            model_id,
            torch_dtype=torch.float16 if torch.cuda.is_available() else torch.float32,
            device_map="auto" if torch.cuda.is_available() else None
        )
        
        # Move to CPU if no GPU
        if not torch.cuda.is_available():
            model = model.to("cpu")
        
        model.eval()
        
        gc.collect()
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
        
        st.success("✅ BLIP-2 model loaded successfully!")
        return processor, model
    except Exception as e:
        st.error(f"❌ Error loading model: {str(e)}")
        st.warning("💡 Tip: Make sure you have enough RAM (8GB+ recommended)")
        return None, None

# Initialize model
processor, model = load_model()

if processor is None or model is None:
    st.stop()

# Check device
device = "cuda" if torch.cuda.is_available() else "cpu"
if device == "cuda":
    st.success(f"⚡ GPU Mode: {torch.cuda.get_device_name(0)} - Fast inference!")
else:
    st.info("💻 CPU Mode: Analysis will take 1-2 minutes (faster than SmolVLM)")

# User Input Section
st.subheader("📤 Upload Food Image")
uploaded_file = st.file_uploader(
    "Choose a food image...",
    type=["jpg", "jpeg", "png", "webp"],
    help="Upload an image of food to analyze"
)

# Default prompt
st.subheader("💬 Analysis Prompt")
default_prompt = """Analyze this food image and provide a detailed nutritional assessment:

HEALTH ASSESSMENT:
- Is this food healthy? (Yes/No/Moderate)
- Health score: Rate from 1-10 (1=unhealthy, 10=very healthy)
- Overall health verdict: Brief explanation

OIL/GREASE LEVEL:
- Oil content: Low/Medium/High
- Visible grease/oil: Describe what you see
- Estimated oil/fat from cooking method

NUTRITIONAL BREAKDOWN (Estimated):
- Calories: [estimated range, e.g., 400-500 kcal]
- Protein: [estimated grams, e.g., 25-30g]
- Carbohydrates: [estimated grams, e.g., 45-55g]
- Fats: [estimated grams, e.g., 15-20g]
- Fiber: [if visible/applicable]
- Sodium: [High/Medium/Low - if applicable]

FOOD IDENTIFICATION:
- Main ingredients visible
- Portion size estimate (Small/Medium/Large)
- Cooking method observed

HEALTH INSIGHTS:
- Positive aspects (nutrients, benefits)
- Concerns (high fat, high sodium, processed, etc.)
- Recommendations for healthier alternatives or modifications

ALLERGENS & DIETARY CONCERNS:
- Potential allergens
- Suitable for: Vegetarian/Vegan/Keto/Diabetic/etc.

Be specific with numbers and estimates based on what you can see in the image."""

user_prompt = st.text_area(
    "Customize your analysis prompt:",
    value=default_prompt,
    height=120,
    help="Modify the prompt to get specific insights about the food"
)

# Analyze button
if uploaded_file is not None:
    image = Image.open(uploaded_file).convert("RGB")
    
    # Resize if too large
    max_size = 512
    if max(image.size) > max_size:
        image.thumbnail((max_size, max_size), Image.Resampling.LANCZOS)
        st.info(f"ℹ️ Image resized to {image.size} for optimal processing")
    
    st.image(image, caption="Uploaded Image")
    
    if st.button("🔍 Analyze Food", type="primary", use_container_width=True):
        progress_bar = st.progress(0)
        status_text = st.empty()
        
        try:
            status_text.text("🔄 Processing image...")
            progress_bar.progress(20)
            
            # Prepare inputs for BLIP-2
            status_text.text("🤖 Analyzing with BLIP-2...")
            progress_bar.progress(40)
            
            # Process image and prompt
            inputs = processor(images=image, text=user_prompt, return_tensors="pt").to(device)
            
            progress_bar.progress(60)
            status_text.text("📝 Generating analysis...")
            
            # Generate response
            with torch.no_grad():
                generated_ids = model.generate(
                    **inputs,
                    max_new_tokens=500,
                    num_beams=3,
                    do_sample=False
                )
            
            # Decode response
            generated_text = processor.batch_decode(generated_ids, skip_special_tokens=True)[0].strip()
            
            # Extract just the answer (remove prompt if present)
            if user_prompt in generated_text:
                response = generated_text.split(user_prompt)[-1].strip()
            else:
                response = generated_text
            
            progress_bar.progress(100)
            status_text.text("✅ Analysis complete!")
            
            # Display results
            st.markdown("---")
            st.subheader("📊 Nutritional Insights")
            st.markdown("### Analysis Results:")
            st.info(response)
            
            # Download option
            st.download_button(
                label="💾 Download Analysis",
                data=response,
                file_name="food_analysis.txt",
                mime="text/plain"
            )
            
            progress_bar.empty()
            status_text.empty()
            
        except Exception as e:
            progress_bar.empty()
            status_text.empty()
            st.error(f"❌ Error during analysis: {str(e)}")
            with st.expander("Technical Details"):
                st.exception(e)
            st.warning("💡 Tip: Make sure the image is clear and try again.")

else:
    st.info("👆 Please upload a food image to get started")

# Footer
st.markdown("---")
st.markdown(
    "<div style='text-align: center; color: gray;'>"
    "NutriMedAI MVP - Powered by BLIP-2 | Fast & Reliable"
    "</div>",
    unsafe_allow_html=True
)

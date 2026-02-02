"""
NutriMedAI - Moondream Model Version
Fast and efficient vision-language model for food analysis
"""

import streamlit as st
from PIL import Image
import torch
from transformers import AutoModelForCausalLM, AutoTokenizer
import gc

# Page Configuration
st.set_page_config(
    page_title="NutriMedAI MVP - Moondream",
    page_icon="🥗",
    layout="centered"
)

st.title("🥗 NutriMedAI: Food Analyzer")
st.markdown("### Powered by Moondream - Fast & Efficient")
st.info("⚡ Moondream is optimized for speed and works great on CPU!")

st.markdown("---")

# Load Model and Processor (Cached)
@st.cache_resource
def load_model():
    """Load Moondream model"""
    try:
        st.info("🔄 Loading Moondream model... This may take a minute on first run.")
        
        model_id = "vikhyatk/moondream2"
        revision = "2024-08-26"
        
        # Load Moondream model - use AutoModelForCausalLM with trust_remote_code
        # Moondream requires trust_remote_code=True to load custom architecture
        
        # Load tokenizer
        tokenizer = AutoTokenizer.from_pretrained(model_id, revision=revision, trust_remote_code=True)
        
        # Load model - Moondream uses custom architecture
        model = AutoModelForCausalLM.from_pretrained(
            model_id,
            trust_remote_code=True,
            revision=revision,
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
        
        st.success("✅ Moondream model loaded successfully!")
        return model, tokenizer
    except Exception as e:
        st.error(f"❌ Error loading model: {str(e)}")
        return None, None

# Initialize model
model, tokenizer = load_model()

if model is None or tokenizer is None:
    st.stop()

# Check device
device = "cuda" if torch.cuda.is_available() else "cpu"
if device == "cuda":
    st.success(f"⚡ GPU Mode: {torch.cuda.get_device_name(0)} - Fast inference!")
else:
    st.info("💻 CPU Mode: Analysis will take 30-60 seconds (much faster than SmolVLM)")

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
    image = Image.open(uploaded_file)
    
    # Resize if too large (Moondream works best with smaller images)
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
            
            # Moondream uses encode_image and answer_question methods
            status_text.text("🤖 Analyzing with Moondream...")
            progress_bar.progress(50)
            
            # Encode image
            enc_image = model.encode_image(image)
            
            progress_bar.progress(70)
            status_text.text("📝 Generating analysis...")
            
            # Generate response
            with torch.no_grad():
                response = model.answer_question(enc_image, user_prompt, tokenizer)
            
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
    "NutriMedAI MVP - Powered by Moondream | Fast & Efficient"
    "</div>",
    unsafe_allow_html=True
)

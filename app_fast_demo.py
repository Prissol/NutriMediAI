"""
NutriMedAI - Fast Demo Version using Cloud API
For prototype presentations - Fast response time (5-10 seconds)
"""

import streamlit as st
from PIL import Image
import io
import os
import base64

# ========== API KEY CONFIG (optional) ==========
# Paste your keys below to avoid entering them in the UI. Leave "" to use UI or env vars.
# Do not commit real keys to git.
OPENAI_API_KEY = ""   # e.g. "sk-..."
GEMINI_API_KEY = ""  # e.g. "AIza..."

# Page Configuration
st.set_page_config(
    page_title="NutriMedAI MVP - Fast Demo",
    page_icon="🥗",
    layout="centered"
)

st.title("🥗 NutriMedAI: Food Analyzer")
st.markdown("### Fast Demo Version - Cloud API Powered")
st.info("⚡ This version uses cloud API for fast responses (5-10 seconds) - Perfect for demos!")

st.markdown("---")

# API Selection
api_choice = st.radio(
    "Choose API Provider:",
    ["OpenAI GPT-4 Vision", "Google Gemini Vision"],
    horizontal=True
)

# API Key: use config, then env, then UI
if api_choice == "OpenAI GPT-4 Vision":
    api_key = (OPENAI_API_KEY or os.environ.get("OPENAI_API_KEY", "")).strip()
    if not api_key:
        api_key = st.text_input("OpenAI API Key", type="password", help="Get your key from platform.openai.com")
    if not api_key:
        st.warning("⚠️ Enter your OpenAI API Key to use this feature")
        st.info("💡 Or paste your key in app_fast_demo.py (OPENAI_API_KEY) to hide this field.")
        st.stop()
    try:
        from openai import OpenAI
        client = OpenAI(api_key=api_key)
    except ImportError:
        st.error("❌ OpenAI library not installed. Run: pip install openai")
        st.stop()

elif api_choice == "Google Gemini Vision":
    api_key = (GEMINI_API_KEY or os.environ.get("GEMINI_API_KEY", "")).strip()
    if not api_key:
        api_key = st.text_input("Google Gemini API Key", type="password", help="Get your key from aistudio.google.com")
    if not api_key:
        st.warning("⚠️ Enter your Gemini API Key to use this feature")
        st.info("💡 Or paste your key in app_fast_demo.py (GEMINI_API_KEY) to hide this field.")
        st.stop()
    try:
        import google.generativeai as genai
        genai.configure(api_key=api_key)
    except ImportError:
        st.error("❌ Google Generative AI library not installed. Run: pip install google-generativeai")
        st.stop()

# Medical Profile Section - Condition-based insights
st.subheader("🏥 Your Medical Profile")
st.caption("Insights will be tailored to your current conditions and concerns. You can have no current conditions.")

CONDITION_OPTIONS = [
    "Diabetes",
    "Hypertension (High BP)",
    "Heart disease",
    "Kidney disease",
    "Obesity / Weight management",
    "Celiac disease",
    "Lactose intolerance",
    "GERD / Acid reflux",
    "High cholesterol",
    "Thyroid disorder",
    "None / No current conditions",
]

col1, col2 = st.columns(2)
with col1:
    current_conditions = st.multiselect(
        "Current conditions (diseases you have)",
        options=CONDITION_OPTIONS,
        default=[],
        help="Select conditions you currently have. Leave empty or select 'None' if you have no diseases.",
    )
with col2:
    concerned_conditions = st.multiselect(
        "Concerned conditions (conditions you want to prevent or monitor)",
        options=[c for c in CONDITION_OPTIONS if c != "None / No current conditions"],
        default=[],
        help="Select conditions you are at risk for or want to prevent.",
    )

if "None / No current conditions" in current_conditions:
    current_conditions_display = "No current medical conditions"
else:
    current_conditions_display = ", ".join(current_conditions) if current_conditions else "No current medical conditions"
concerned_display = ", ".join(concerned_conditions) if concerned_conditions else "None specified"

st.markdown("---")

# User Input Section
st.subheader("📤 Upload Food Image")
uploaded_file = st.file_uploader(
    "Choose a food image...",
    type=["jpg", "jpeg", "png", "webp"],
    help="Upload an image of food to analyze"
)

# Build prompt with medical context - two types of insights
st.subheader("💬 Analysis")
user_prompt = f"""You are a nutrition expert. Analyze this food image and provide a nutritional assessment. First give basic food and nutrition info, then give TWO types of condition-based insights as below.

USER'S MEDICAL PROFILE:
- Current conditions (diseases they have): {current_conditions_display}
- Concerned conditions (conditions they want to prevent or monitor): {concerned_display}

Provide your response in this EXACT structure:

---
BASIC NUTRITIONAL INFO:
- Food identification and portion size
- Estimated calories, protein, carbs, fats, fiber, sodium
- Oil/grease level (Low/Medium/High)
- Health score 1-10 and brief verdict
---

1) CURRENT CONDITION INSIGHTS:
{'- Give insights specific to the user\'s current conditions listed above. How does this food affect each condition? Is it safe/suitable? What to limit or avoid?' if current_conditions and "None / No current conditions" not in current_conditions else '- User has no current medical conditions. Give general health insights: benefits, moderation tips, and any general recommendations.'}
- Be specific (e.g., sodium for BP, sugar for diabetes, potassium for kidney).
- If multiple conditions, address each briefly.

---
2) CONCERNED CONDITION INSIGHTS:
{'- Give insights for the conditions they are concerned about (prevention/risk). How does this food impact risk for each? What to watch or reduce?' if concerned_conditions else '- No specific concerns listed. Give brief preventive tips (heart health, weight, blood sugar) based on the food.'}
- Focus on what to limit or improve to reduce future risk.
- If no concerns listed, keep this section short with general prevention tips.

---
Be specific with numbers and estimates based on what you can see in the image. Use clear, simple language."""

# Analyze button
if uploaded_file is not None:
    image = Image.open(uploaded_file)
    
    # Resize if too large
    max_size = 1024
    if max(image.size) > max_size:
        image.thumbnail((max_size, max_size), Image.Resampling.LANCZOS)
    
    st.image(image, caption="Uploaded Image")
    
    # User can describe the food or ask a question about the image
    st.subheader("✏️ Describe or ask (optional)")
    user_food_description = st.text_area(
        "Define the food, describe the image, or ask what you want to know",
        placeholder="e.g. This is chicken biryani. Is it okay for my diabetes? / What are the calories? / This is my lunch – how much protein does it have?",
        height=80,
        help="Optional: Tell what the food is, or ask a specific question. Helps get better insights.",
    )
    
    if st.button("🔍 Analyze Food", type="primary", use_container_width=True):
        progress_bar = st.progress(0)
        status_text = st.empty()
        
        try:
            status_text.text("🔄 Processing with cloud API...")
            progress_bar.progress(20)
            
            # Add user's description/question to prompt if provided
            prompt_for_api = user_prompt
            if user_food_description and user_food_description.strip():
                prompt_for_api = f"""USER'S DESCRIPTION OR QUESTION (what they said about the image or what they want to know):
"{user_food_description.strip()}"

---
Use the above to tailor your analysis. Then provide the full assessment below.

{user_prompt}"""
            
            result = None  # Initialize result variable
            
            if api_choice == "OpenAI GPT-4 Vision":
                # Convert image to base64
                img_byte_arr = io.BytesIO()
                image.save(img_byte_arr, format='PNG')
                img_base64 = base64.b64encode(img_byte_arr.getvalue()).decode()
                
                progress_bar.progress(40)
                status_text.text("🤖 Analyzing with GPT-4 Vision...")
                
                response = client.chat.completions.create(
                    model="gpt-4o",
                    messages=[
                        {
                            "role": "user",
                            "content": [
                                {"type": "text", "text": prompt_for_api},
                                {
                                    "type": "image_url",
                                    "image_url": {
                                        "url": f"data:image/png;base64,{img_base64}"
                                    }
                                }
                            ]
                        }
                    ],
                    max_tokens=1000
                )
                
                result = response.choices[0].message.content
                
            else:  # Google Gemini
                progress_bar.progress(40)
                status_text.text("🤖 Analyzing with Gemini Vision...")
                
                # Find available models that support vision
                available_models = []
                for m in genai.list_models():
                    if 'generateContent' in m.supported_generation_methods:
                        available_models.append(m.name)
                
                # Try models in order of preference
                model_names_to_try = [
                    'gemini-1.5-pro',
                    'gemini-1.5-flash', 
                    'gemini-pro',
                    'gemini-pro-vision'
                ]
                
                model_used = None
                for model_name in model_names_to_try:
                    # Check if model name matches any available model
                    matching_models = [m for m in available_models if model_name in m.lower()]
                    if matching_models:
                        try:
                            model_used = matching_models[0]
                            model = genai.GenerativeModel(model_used)
                            response = model.generate_content([prompt_for_api, image])
                            result = response.text
                            break
                        except Exception as e:
                            continue
                
                if model_used is None:
                    # If no model worked, try the first available model
                    if available_models:
                        model_used = available_models[0]
                        model = genai.GenerativeModel(model_used)
                        response = model.generate_content([prompt_for_api, image])
                        result = response.text
                    else:
                        raise Exception(f"No Gemini models available. Please check your API key and access.")
            
            progress_bar.progress(100)
            status_text.text("✅ Analysis complete!")
            
            # Check if result was generated
            if result is None:
                raise Exception("No result generated. Please try again or check your API key.")
            
            # Display results
            st.markdown("---")
            st.subheader("📊 Nutritional Insights")
            st.markdown("### Analysis Results:")
            st.info(result)
            
            # Download option
            st.download_button(
                label="💾 Download Analysis",
                data=result,
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

else:
    st.info("👆 Please upload a food image to get started")

# Footer
st.markdown("---")
st.markdown(
    "<div style='text-align: center; color: gray;'>"
    "NutriMedAI MVP - Fast Demo Version | Cloud API Powered"
    "</div>",
    unsafe_allow_html=True
)

"""
NutriMedAI - OpenAI GPT-4 Vision API Version
Fast and reliable for demos - 5-10 seconds response time
"""

import streamlit as st
from PIL import Image
import io
import base64
import os

# ========== API KEY CONFIG (optional) ==========
# Paste your OpenAI API key below to avoid entering it every time in the UI.
# Leave empty ("") to use the UI input or the OPENAI_API_KEY environment variable.
# Do not commit real keys to git.
OPENAI_API_KEY = ""  # e.g. "sk-..." or leave ""

# Page Configuration
st.set_page_config(
    page_title="NutriMedAI MVP - OpenAI",
    page_icon="🥗",
    layout="centered"
)

st.title("🥗 NutriMedAI: Food Analyzer")
st.markdown("### Powered by OpenAI GPT-4 Vision - Fast & Reliable")
st.success("⚡ Fast responses (5-10 seconds) - Perfect for demos!")

st.markdown("---")

# Use key from config, then env, then UI (only show UI if not set)
api_key = OPENAI_API_KEY.strip() or os.environ.get("OPENAI_API_KEY", "").strip()
if not api_key:
    api_key = st.text_input(
        "OpenAI API Key",
        type="password",
        help="Get your API key from https://platform.openai.com/api-keys",
        placeholder="sk-..."
    )
    if not api_key:
        st.warning("⚠️ Enter your OpenAI API Key to continue")
        st.info("💡 Or paste your key in app_openai.py (OPENAI_API_KEY) to hide this field.")
        st.stop()

# Initialize OpenAI client
try:
    from openai import OpenAI
    client = OpenAI(api_key=api_key)
except ImportError:
    st.error("❌ OpenAI library not installed. Run: pip install openai")
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

# If "None" selected in current, clear others
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

# Build prompt - condition-based summary only, plain text, no markdown
st.subheader("💬 Analysis")
current_ins = (
    "Write a short condition-based summary: how does this food affect the user's current conditions? Is it safe or should they limit/avoid? Be specific (e.g. sodium for hypertension, sugar for diabetes)."
    if current_conditions and "None / No current conditions" not in current_conditions
    else "User has no current conditions. Write 1–2 sentences of general health advice for this food."
)
concerned_ins = (
    "Write a short condition-based summary: for each condition they are concerned about, what should they watch or reduce with this food? Prevention-focused."
    if concerned_conditions
    else "No specific concerns. Write 1–2 sentences of brief preventive tips for this food."
)
user_prompt = f"""You are a nutrition expert. Analyze this food image and give a condition-based summary only.

IMPORTANT: Use plain text only. Do not use markdown, asterisks, or bold. No bullet labels like **Protein:**. Write in clear, short paragraphs.

USER'S MEDICAL PROFILE:
- Current conditions: {current_conditions_display}
- Concerned conditions: {concerned_display}

Respond with exactly these two sections. Use the exact headers below.

---
CURRENT CONDITION SUMMARY:
{current_ins}
Write 2–4 short sentences. No asterisks, no bold.

---
CONCERNED CONDITION SUMMARY:
{concerned_ins}
Write 2–4 short sentences. No asterisks, no bold.

---
Optional: one line only for "Health score: X/10" if you want. Then only the two condition summaries above."""

# Analyze button
if uploaded_file is not None:
    image = Image.open(uploaded_file).convert("RGB")
    
    # Resize if too large (OpenAI works best with reasonable sizes)
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
            status_text.text("🔄 Processing image...")
            progress_bar.progress(20)
            
            # Convert image to base64
            img_byte_arr = io.BytesIO()
            image.save(img_byte_arr, format='PNG')
            img_base64 = base64.b64encode(img_byte_arr.getvalue()).decode()
            
            progress_bar.progress(40)
            status_text.text("🤖 Analyzing with GPT-4 Vision... (~5-10 seconds)")
            
            # Add user's description/question to prompt if provided
            prompt_for_api = user_prompt
            if user_food_description and user_food_description.strip():
                prompt_for_api = f"""USER'S DESCRIPTION OR QUESTION (what they said about the image or what they want to know):
"{user_food_description.strip()}"

---
Use the above to tailor your analysis. Then provide the full assessment below.

{user_prompt}"""
            
            # Call OpenAI API
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
                max_tokens=1500
            )
            
            result = response.choices[0].message.content
            
            progress_bar.progress(100)
            status_text.text("✅ Analysis complete!")
            
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
            error_msg = str(e)
            
            if "api_key" in error_msg.lower() or "authentication" in error_msg.lower():
                st.error("❌ Invalid API Key. Please check your OpenAI API key.")
            elif "rate limit" in error_msg.lower():
                st.error("❌ Rate limit exceeded. Please wait a moment and try again.")
            elif "insufficient_quota" in error_msg.lower():
                st.error("❌ Insufficient quota. Please check your OpenAI account billing.")
            else:
                st.error(f"❌ Error during analysis: {error_msg}")
            
            with st.expander("Technical Details"):
                st.exception(e)

else:
    st.info("👆 Please upload a food image to get started")

# Footer
st.markdown("---")
st.markdown(
    "<div style='text-align: center; color: gray;'>"
    "NutriMedAI MVP - Powered by OpenAI GPT-4 Vision | Fast & Reliable"
    "</div>",
    unsafe_allow_html=True
)

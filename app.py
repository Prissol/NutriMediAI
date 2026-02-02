import streamlit as st
from PIL import Image
import torch
from transformers import AutoProcessor
# Try new class first, fallback to old if needed
try:
    from transformers import AutoModelForImageTextToText
except ImportError:
    from transformers import AutoModelForVision2Seq as AutoModelForImageTextToText
import io
import gc

# Page Configuration
st.set_page_config(
    page_title="NutriMedAI MVP",
    page_icon="🥗",
    layout="centered"
)

st.title("🥗 NutriMedAI: Food Analyzer")
st.markdown("### Upload a food image and get AI-powered nutritional insights")
st.markdown("---")

# Load Model and Processor (Cached to avoid reloading)
@st.cache_resource
def load_model():
    """Load SmolVLM model and processor with speed optimization"""
    try:
        # Check for GPU
        has_gpu = torch.cuda.is_available()
        device = "cuda" if has_gpu else "cpu"
        
        if has_gpu:
            st.info(f"🔄 Loading SmolVLM on GPU ({torch.cuda.get_device_name(0)})... This will be fast!")
        else:
            st.warning("⚠️ No GPU detected. Using CPU (will be slower). For faster results, use GPU or cloud API.")
        
        model_id = "HuggingFaceTB/SmolVLM-Instruct"
        
        # Clear cache before loading
        if has_gpu:
            torch.cuda.empty_cache()
        
        processor = AutoProcessor.from_pretrained(model_id)
        
        import gc
        gc.collect()
        
        # Load model with device optimization
        if has_gpu:
            # GPU: Use bfloat16 for best performance
            try:
                model = AutoModelForImageTextToText.from_pretrained(
                    model_id,
                    torch_dtype=torch.bfloat16,
                    device_map="auto",  # Auto device mapping for GPU
                    low_cpu_mem_usage=True
                )
                st.success("✅ Model loaded on GPU - Fast inference enabled!")
            except Exception as e:
                st.warning(f"⚠️ GPU loading failed, falling back to CPU: {str(e)}")
                device = "cpu"
                model = AutoModelForImageTextToText.from_pretrained(
                    model_id,
                    torch_dtype=torch.float16,
                    device_map="cpu",
                    low_cpu_mem_usage=True
                )
        else:
            # CPU: Use float16 and optimize
            try:
                model = AutoModelForImageTextToText.from_pretrained(
                    model_id,
                    torch_dtype=torch.float16,
                    device_map="cpu",
                    low_cpu_mem_usage=True,
                    max_memory={"cpu": "6GiB"}
                )
            except (TypeError, ValueError):
                model = AutoModelForImageTextToText.from_pretrained(
                    model_id,
                    torch_dtype=torch.float16,
                    device_map="cpu",
                    low_cpu_mem_usage=True
                )
        
        # Ensure model is on correct device
        if hasattr(model, 'to') and not has_gpu:
            model = model.to("cpu")
        
        model.eval()  # Set to evaluation mode
        
        # Try to compile model for faster inference (PyTorch 2.0+)
        try:
            if hasattr(torch, 'compile') and has_gpu:
                model = torch.compile(model, mode="reduce-overhead")
                st.info("⚡ Model compiled for faster inference!")
        except Exception:
            pass  # Compilation not critical
        
        gc.collect()
        if has_gpu:
            torch.cuda.empty_cache()
        
        if not has_gpu:
            st.warning("💡 CPU mode detected. Analysis will take 2-5 minutes. For faster results, use GPU or see app_fast_demo.py for cloud API option.")
        
        return processor, model, device
    except Exception as e:
        error_msg = str(e)
        st.error(f"❌ Error loading model: {error_msg}")
        
        # Specific guidance for paging file error
        if "paging file" in error_msg.lower() or "1455" in error_msg:
            st.error("""
            **Memory Issue Detected:**
            
            Your system doesn't have enough virtual memory to load SmolVLM locally.
            
            **Quick Solutions:**
            
            1. **For Demo/Presentation (Recommended):**
               - Use `app_fast_demo.py` with cloud API (5-10 seconds)
               - Run: `python -m streamlit run app_fast_demo.py`
               - Uses Google Gemini (free tier) or OpenAI
               - Fast and reliable for presentations
            
            2. **Fix Local Version:**
               - Increase Windows page file size (see MEMORY_FIX.md)
               - Close all other applications
               - Restart computer
               - Try again
            
            3. **Alternative:**
               - Use a machine with more RAM (16GB+ recommended)
               - Or use GPU-enabled system
            """)
        else:
            st.warning("💡 Tip: Close other applications to free up memory, or increase Windows page file size.")
            st.info("💡 For fast demo, try: `python -m streamlit run app_fast_demo.py`")
        
        return None, None, None

# Initialize model
processor, model, device = load_model()

if processor is None or model is None:
    st.stop()

# Display device info
if device == "cuda":
    st.success(f"⚡ GPU Mode: {torch.cuda.get_device_name(0)} - Fast inference enabled!")
else:
    st.warning("⚠️ CPU Mode: Analysis will take 2-5 minutes. GPU recommended for faster results.")

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
    # Display uploaded image
    image = Image.open(uploaded_file)
    
    # Resize image if too large (faster processing)
    max_size = 512
    if max(image.size) > max_size:
        image.thumbnail((max_size, max_size), Image.Resampling.LANCZOS)
        st.info(f"ℹ️ Image resized to {image.size} for faster processing")
    
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
            progress_bar.progress(10)
            
            # Add user's description/question to prompt if provided
            prompt_for_model = user_prompt
            if user_food_description and user_food_description.strip():
                prompt_for_model = f"""USER'S DESCRIPTION OR QUESTION (what they said about the image or what they want to know):
"{user_food_description.strip()}"

---
Use the above to tailor your analysis. Then provide the full assessment below.

{user_prompt}"""
            
            # Prepare messages for the model
            messages = [
                {
                    "role": "user",
                    "content": [
                        {"type": "image"},
                        {"type": "text", "text": prompt_for_model}
                    ]
                }
            ]
            
            status_text.text("🔄 Preparing model inputs...")
            progress_bar.progress(30)
            
            # Format the prompt using processor
            prompt = processor.apply_chat_template(messages, add_generation_prompt=True)
            inputs = processor(text=prompt, images=[image], return_tensors="pt")
            
            # Move inputs to correct device
            inputs = {k: v.to(device) for k, v in inputs.items()}
            
            if device == "cuda":
                status_text.text("🤖 Generating analysis on GPU... (~10-30 seconds)")
            else:
                status_text.text("🤖 Generating analysis on CPU... This may take 2-5 minutes...")
            progress_bar.progress(50)
            
            # Generate response with optimized parameters
            with torch.no_grad():
                if device == "cuda":
                    # GPU: Use better quality settings
                    generated_ids = model.generate(
                        **inputs,
                        max_new_tokens=500,
                        do_sample=True,
                        temperature=0.7,
                        top_p=0.9,
                        pad_token_id=processor.tokenizer.pad_token_id if processor.tokenizer.pad_token_id else processor.tokenizer.eos_token_id,
                        eos_token_id=processor.tokenizer.eos_token_id,
                    )
                else:
                    # CPU: Use faster settings (greedy decoding)
                    generated_ids = model.generate(
                        **inputs,
                        max_new_tokens=400,  # Slightly reduced for CPU
                        do_sample=False,  # Greedy is faster on CPU
                        num_beams=1,
                        pad_token_id=processor.tokenizer.pad_token_id if processor.tokenizer.pad_token_id else processor.tokenizer.eos_token_id,
                        eos_token_id=processor.tokenizer.eos_token_id,
                    )
            
            status_text.text("📝 Decoding response...")
            progress_bar.progress(80)
            
            # Decode the response
            generated_texts = processor.batch_decode(generated_ids, skip_special_tokens=True)
            
            # Extract the assistant's response
            response = generated_texts[0]
            if "assistant" in response.lower():
                response = response.split("assistant")[-1].strip()
            elif "<|assistant|>" in response:
                response = response.split("<|assistant|>")[-1].strip()
            elif len(response) > 0:
                # If no clear separator, use the full response
                response = response.strip()
            
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
            
        except torch.cuda.OutOfMemoryError:
            st.error("❌ Out of memory! Please close other applications and try again.")
        except Exception as e:
            progress_bar.empty()
            status_text.empty()
            st.error(f"❌ Error during analysis: {str(e)}")
            st.warning("💡 Tip: Analysis on CPU can take 1-2 minutes. Please wait or try with a smaller image.")
            with st.expander("Technical Details"):
                st.exception(e)

else:
    st.info("👆 Please upload a food image to get started")

# Footer
st.markdown("---")
st.markdown(
    "<div style='text-align: center; color: gray;'>"
    "NutriMedAI MVP - Powered by SmolVLM | Hosted Locally"
    "</div>",
    unsafe_allow_html=True
)

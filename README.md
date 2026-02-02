# NutriMedAI MVP - Food Analysis with SmolVLM

A locally-hosted MVP for analyzing food images using the SmolVLM vision-language model. Upload a food image, provide a prompt, and get AI-powered nutritional insights.

## Features

- 🖼️ **Image Upload**: Upload food images (JPG, PNG, WebP)
- 🤖 **AI Analysis**: Powered by SmolVLM-Instruct model
- 💬 **Custom Prompts**: Define what you want to analyze
- 📊 **Nutritional Insights**: Get detailed food analysis
- 💾 **Export Results**: Download analysis as text file
- 🏠 **Local Hosting**: Everything runs on your machine

## Installation

1. **Clone or navigate to this directory**
   ```bash
   cd NutriMedAI
   ```

2. **Create a virtual environment (recommended)**
   ```bash
   python -m venv venv
   
   # On Windows:
   venv\Scripts\activate
   
   # On Mac/Linux:
   source venv/bin/activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

## Usage

1. **Start the application**
   ```bash
   streamlit run app.py
   ```

2. **Open your browser**
   - The app will automatically open at `http://localhost:8501`
   - If not, navigate to the URL shown in the terminal

3. **Use the app**
   - Upload a food image
   - Customize the analysis prompt (optional)
   - Click "Analyze Food"
   - View the insights

## System Requirements

- **Python**: 3.8 or higher
- **RAM**: Minimum 8GB (16GB recommended)
- **GPU**: Optional but recommended for faster processing
- **Disk Space**: ~5GB for model download (first run)

## Model Information

- **Model**: SmolVLM-Instruct (HuggingFaceTB/SmolVLM-Instruct)
- **Type**: Vision-Language Model
- **Size**: ~2-3GB
- **First Run**: Model will be downloaded automatically (may take time)

## Troubleshooting

### Model download is slow
- The model downloads on first run (~2-3GB)
- Be patient, it only downloads once
- Check your internet connection

### Out of memory errors
- Close other applications
- Use CPU mode (slower but uses less memory)
- Consider using a smaller model variant

### CUDA/GPU issues
- The app will automatically use CPU if GPU is not available
- For GPU support, ensure PyTorch with CUDA is installed

## Next Steps

This MVP includes the core feature. Future enhancements could include:
- User profile (medical conditions, dietary preferences)
- Meal history tracking
- Integration with wearable devices
- Recipe generation from ingredients
- Multi-language support

## License

This is an MVP for NutriMedAI project development.

## Contact

For questions or issues, refer to the main NutriMedAI documentation.

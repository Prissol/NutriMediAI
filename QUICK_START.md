# Quick Start Guide - NutriMedAI MVP

## ✅ Installation Complete!

All dependencies have been installed successfully.

## 🚀 Running the App

### Option 1: Using the batch file (Windows)
Double-click `run.bat` or run in terminal:
```bash
run.bat
```

### Option 2: Using Python directly
```bash
python -m streamlit run app.py
```

### Option 3: Using streamlit command (if in PATH)
```bash
streamlit run app.py
```

## 📝 Important Notes

### First Run
- The SmolVLM model will download automatically (~2-3GB)
- This may take 5-10 minutes depending on your internet speed
- The model only downloads once

### System Requirements
- **RAM**: Minimum 8GB (16GB recommended)
- **GPU**: Optional but recommended for faster processing
- **Disk Space**: ~5GB for model storage

### Troubleshooting

**If `streamlit` command not found:**
- Always use: `python -m streamlit run app.py`
- This uses Python's module system directly

**If pip command fails:**
- Use: `python -m pip install <package>`
- This ensures you're using the correct Python installation

**If model download is slow:**
- Be patient, it's a large download
- Check your internet connection
- The model caches locally after first download

## 🎯 Using the App

1. **Start the app** using one of the methods above
2. **Browser opens automatically** at `http://localhost:8501`
3. **Upload a food image** (JPG, PNG, WebP)
4. **Customize prompt** (optional) or use default
5. **Click "Analyze Food"**
6. **View insights** - wait 10-30 seconds for analysis
7. **Download results** if needed

## 📞 Need Help?

Check the main `README.md` for more detailed information.

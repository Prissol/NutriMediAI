# Memory/Paging File Error Fix Guide

## Error: "The paging file is too small for this operation to complete"

This error occurs when Windows doesn't have enough virtual memory (RAM + page file) to load the model.

## ✅ Solution 1: Code Updated (Already Done)

The code has been updated to:
- Use CPU mode (avoids GPU memory issues)
- Use float16 precision (reduces memory by ~50%)
- Enable low_cpu_mem_usage optimization
- Force garbage collection

**Just refresh your browser and try again!**

## 🔧 Solution 2: Increase Windows Page File Size

If the error persists, increase Windows page file:

1. **Open System Properties:**
   - Press `Win + Pause` or right-click "This PC" → Properties
   - Click "Advanced system settings"

2. **Open Virtual Memory Settings:**
   - Click "Settings" under Performance
   - Go to "Advanced" tab
   - Click "Change" under Virtual memory

3. **Increase Page File:**
   - Uncheck "Automatically manage paging file size"
   - Select your C: drive
   - Select "Custom size"
   - Set Initial size: `8192` (8GB)
   - Set Maximum size: `16384` (16GB)
   - Click "Set" then "OK"
   - **Restart your computer**

## 💡 Solution 3: Free Up Memory

Before running the app:
- Close other applications (browsers, games, etc.)
- Close unnecessary background programs
- Restart your computer to clear memory

## 📊 Minimum Requirements

- **RAM:** 8GB minimum (16GB recommended)
- **Free Disk Space:** 10GB+ for page file
- **Page File:** 8-16GB recommended

## 🚀 After Fixing

1. Restart your computer (if you changed page file)
2. Close unnecessary applications
3. Run: `python -m streamlit run app.py`
4. Refresh browser

The model should now load successfully!

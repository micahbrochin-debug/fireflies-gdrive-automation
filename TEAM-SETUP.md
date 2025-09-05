# Team Setup Guide - Fireflies to Google Drive Automation

## 🚀 Quick Start for Team Members

### Prerequisites
- Node.js installed on your computer
- Fireflies.ai account with API access
- Google Drive desktop app installed and syncing

### Installation Steps

1. **Clone the repository:**
   ```bash
   git clone https://github.com/micahbrochin-debug/fireflies-gdrive-automation.git
   cd fireflies-gdrive-automation
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Get your Fireflies API key:**
   - Go to [Fireflies.ai](https://fireflies.ai) → Settings → Integrations
   - Search for "Fireflies API" 
   - Copy your API key

4. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env file and add your API key:
   # FIREFLIES_API_KEY=your_actual_api_key_here
   ```

5. **Run setup wizard:**
   ```bash
   npm run setup
   ```

6. **Test it:**
   ```bash
   npm start
   ```

## 🔄 Usage Options

### One-time Processing
```bash
npm start                    # Process last 24 hours
node index.js --hours 48     # Process last 48 hours
```

### Automatic Processing
```bash
npm run auto                 # Every 15 minutes
```

### Background Processing
```bash
# Start in background
nohup npm run auto > automation.log 2>&1 &

# Check logs
tail -f automation.log

# Stop background process
pkill -f "scheduler.js"
```

## 📄 Output

PDFs are saved to your Google Drive in format:
`company_name_mm-dd-yy_hh:MM_AM_PM.pdf`

Examples:
- `Salesforce_09-05-25_02:30_PM.pdf`
- `Microsoft_09-04-25_10:15_AM.pdf`

## 🛠️ Customization

Edit these files to customize:
- `services/fileName.js` - Change naming format
- `.env` - Change folder location
- `scheduler.js` - Change automation schedule

## 🆘 Troubleshooting

### "Invalid Fireflies API key"
- Check your API key in Fireflies settings
- Make sure there are no spaces in the .env file

### "Google Drive folder not found"
- Make sure Google Drive desktop app is installed
- Check that Google Drive is syncing properly

### Need Help?
Contact the automation creator or check the GitHub issues.
const fs = require('fs');
const path = require('path');
const { PDFGeneratorService } = require('./pdfGenerator');

class LocalGoogleDriveService {
  constructor(config) {
    this.basePath = config.localPath || this.findGoogleDrivePath();
    this.targetFolder = config.targetFolder;
    
    // If targetFolder is empty or undefined, save directly to basePath
    if (!this.targetFolder || this.targetFolder.trim() === '') {
      this.fullPath = this.basePath;
    } else {
      this.fullPath = path.join(this.basePath, this.targetFolder);
      this.ensureDirectoryExists(this.fullPath);
    }
    
    this.pdfGenerator = new PDFGeneratorService();
  }

  findGoogleDrivePath() {
    // Common Google Drive paths on different systems
    const possiblePaths = [
      path.join(process.env.HOME || process.env.USERPROFILE, 'Google Drive'),
      path.join(process.env.HOME || process.env.USERPROFILE, 'GoogleDrive'),
      '/Users/' + process.env.USER + '/Google Drive',
      'C:\\Users\\' + process.env.USERNAME + '\\Google Drive',
      '/home/' + process.env.USER + '/Google Drive'
    ];

    for (const possiblePath of possiblePaths) {
      if (fs.existsSync(possiblePath)) {
        console.log(`Found Google Drive at: ${possiblePath}`);
        return possiblePath;
      }
    }

    // Fallback to current directory
    console.warn('Google Drive folder not found automatically. Using current directory.');
    return process.cwd();
  }

  ensureDirectoryExists(dirPath) {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      console.log(`Created directory: ${dirPath}`);
    }
  }

  async uploadTranscript(fileName, content, transcript) {
    try {
      // Save directly to the target path without year/month subfolders
      const filePath = path.join(this.fullPath, fileName);
      
      // Generate PDF instead of text file
      await this.pdfGenerator.generateTranscriptPDF(transcript, fileName, filePath);
      
      console.log(`✅ PDF transcript saved to Google Drive: ${filePath}`);
      console.log(`📤 Will sync to cloud automatically`);
      
      return {
        id: fileName,
        name: fileName,
        webViewLink: `file://${filePath}`,
        localPath: filePath,
        googleDriveSync: true,
        format: 'PDF'
      };

    } catch (error) {
      console.error('Error saving PDF transcript to local Google Drive:', error.message);
      throw error;
    }
  }

  async listFiles(yearMonth = null) {
    try {
      let searchPath = this.fullPath;
      
      if (yearMonth) {
        const [year, month] = yearMonth.split('-');
        searchPath = path.join(this.fullPath, year, month);
      }
      
      if (!fs.existsSync(searchPath)) {
        return [];
      }
      
      const files = [];
      
      // Recursively find all .txt files
      const findFiles = (dir) => {
        const items = fs.readdirSync(dir, { withFileTypes: true });
        
        for (const item of items) {
          const itemPath = path.join(dir, item.name);
          
          if (item.isDirectory()) {
            findFiles(itemPath);
          } else if (item.isFile() && item.name.endsWith('.pdf')) {
            const stats = fs.statSync(itemPath);
            files.push({
              id: item.name,
              name: item.name,
              createdTime: stats.birthtime.toISOString(),
              modifiedTime: stats.mtime.toISOString(),
              localPath: itemPath,
              relativePath: path.relative(this.fullPath, itemPath)
            });
          }
        }
      };
      
      findFiles(searchPath);
      
      return files.sort((a, b) => new Date(b.createdTime) - new Date(a.createdTime));

    } catch (error) {
      console.error('Error listing local Google Drive files:', error.message);
      throw error;
    }
  }

  async testConnection() {
    try {
      // Test if we can write to the Google Drive folder
      const testFile = path.join(this.fullPath, 'test_fireflies_automation.txt');
      fs.writeFileSync(testFile, `Test file created at ${new Date().toISOString()}`, 'utf8');
      
      // Clean up test file
      setTimeout(() => {
        try {
          fs.unlinkSync(testFile);
        } catch (e) {
          // Ignore cleanup errors
        }
      }, 1000);
      
      console.log('✅ Local Google Drive connection successful');
      console.log(`📁 Storage path: ${this.fullPath}`);
      console.log(`📤 Files will sync to Google Drive automatically`);
      
      return true;

    } catch (error) {
      console.error('❌ Local Google Drive test failed:', error.message);
      console.error('Make sure you have write access to the Google Drive folder');
      return false;
    }
  }

  getStoragePath() {
    return this.fullPath;
  }

  getGoogleDriveBasePath() {
    return this.basePath;
  }

  // Method to check if Google Drive is actively syncing
  checkSyncStatus() {
    try {
      // Look for Google Drive sync indicators
      const syncIndicators = [
        path.join(this.basePath, '.tmp.driveupload'),
        path.join(this.basePath, '.tmp.drivedownload'),
        path.join(this.basePath, 'desktop.ini') // Windows
      ];

      const isActive = syncIndicators.some(indicator => fs.existsSync(indicator));
      
      if (isActive) {
        console.log('📤 Google Drive sync appears to be active');
      } else {
        console.log('📁 Google Drive folder found (sync status unknown)');
      }

      return {
        googleDriveFound: true,
        syncActive: isActive,
        basePath: this.basePath,
        targetPath: this.fullPath
      };

    } catch (error) {
      console.error('Error checking sync status:', error.message);
      return {
        googleDriveFound: false,
        syncActive: false,
        error: error.message
      };
    }
  }
}

module.exports = { LocalGoogleDriveService };
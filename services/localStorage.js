const fs = require('fs');
const path = require('path');

class LocalStorageService {
  constructor(config) {
    this.basePath = config.basePath || path.join(process.cwd(), 'transcripts');
    this.ensureDirectoryExists(this.basePath);
  }

  ensureDirectoryExists(dirPath) {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      console.log(`Created directory: ${dirPath}`);
    }
  }

  async uploadTranscript(fileName, content, transcript) {
    try {
      // Create year/month subdirectories for organization
      const date = new Date(transcript.dateString);
      const year = date.getFullYear().toString();
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      
      const yearPath = path.join(this.basePath, year);
      const monthPath = path.join(yearPath, month);
      
      this.ensureDirectoryExists(yearPath);
      this.ensureDirectoryExists(monthPath);
      
      // Full file path
      const filePath = path.join(monthPath, fileName);
      
      // Write file
      fs.writeFileSync(filePath, content, 'utf8');
      
      console.log(`Transcript saved: ${filePath}`);
      
      return {
        id: fileName,
        name: fileName,
        webViewLink: `file://${filePath}`,
        localPath: filePath
      };

    } catch (error) {
      console.error('Error saving transcript locally:', error.message);
      throw error;
    }
  }

  async listFiles(yearMonth = null) {
    try {
      let searchPath = this.basePath;
      
      if (yearMonth) {
        const [year, month] = yearMonth.split('-');
        searchPath = path.join(this.basePath, year, month);
      }
      
      if (!fs.existsSync(searchPath)) {
        return [];
      }
      
      const files = fs.readdirSync(searchPath, { withFileTypes: true })
        .filter(dirent => dirent.isFile() && dirent.name.endsWith('.txt'))
        .map(dirent => {
          const filePath = path.join(searchPath, dirent.name);
          const stats = fs.statSync(filePath);
          
          return {
            id: dirent.name,
            name: dirent.name,
            createdTime: stats.birthtime.toISOString(),
            modifiedTime: stats.mtime.toISOString(),
            localPath: filePath
          };
        });
      
      return files.sort((a, b) => new Date(b.createdTime) - new Date(a.createdTime));

    } catch (error) {
      console.error('Error listing local files:', error.message);
      throw error;
    }
  }

  async testConnection() {
    try {
      const testFile = path.join(this.basePath, 'test.txt');
      fs.writeFileSync(testFile, 'Test file', 'utf8');
      fs.unlinkSync(testFile);
      
      console.log('Local storage connection successful');
      console.log('Storage path:', this.basePath);
      return true;

    } catch (error) {
      console.error('Local storage test failed:', error.message);
      return false;
    }
  }

  getStoragePath() {
    return this.basePath;
  }
}

module.exports = { LocalStorageService };
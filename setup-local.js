require('dotenv').config();
const { LocalGoogleDriveService } = require('./services/localGoogleDrive');
const { FirefliesService } = require('./services/fireflies');
const readline = require('readline');
const path = require('path');

class LocalSetupWizard {
  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  async run() {
    console.log('🚀 Fireflies to Local Google Drive Setup Wizard');
    console.log('===============================================\n');

    try {
      await this.checkEnvironmentVariables();
      await this.testFirefliesConnection();
      await this.setupGoogleDriveFolder();
      await this.testLocalGoogleDriveConnection();
      
      console.log('\n✅ Setup completed successfully!');
      console.log('\n📁 Your transcripts will be saved to your local Google Drive folder');
      console.log('📤 Google Drive will automatically sync them to the cloud');
      console.log('\nNext steps:');
      console.log('1. Run "npm start" to process recent transcripts');
      console.log('2. Run "npm run webhook" to start the webhook server');
      console.log('3. Run "node scheduler.js" to start automated processing');
      
    } catch (error) {
      console.error('\n❌ Setup failed:', error.message);
    } finally {
      this.rl.close();
    }
  }

  async checkEnvironmentVariables() {
    console.log('🔍 Checking environment variables...');
    
    const required = ['FIREFLIES_API_KEY'];
    const missing = required.filter(key => !process.env[key]);
    
    if (missing.length > 0) {
      console.log('❌ Missing required environment variables:');
      missing.forEach(key => console.log(`   - ${key}`));
      console.log('\nPlease copy .env.example to .env and fill in your Fireflies API key.');
      throw new Error('Missing environment variables');
    }

    console.log('✅ Required environment variables found');

    if (!process.env.GOOGLE_DRIVE_LOCAL_PATH) {
      console.log('ℹ️  GOOGLE_DRIVE_LOCAL_PATH not set - will auto-detect Google Drive folder');
    }

    if (!process.env.GOOGLE_DRIVE_TARGET_FOLDER) {
      console.log('ℹ️  GOOGLE_DRIVE_TARGET_FOLDER not set - will use "Fireflies Transcripts"');
    }
  }

  async testFirefliesConnection() {
    console.log('\n🔗 Testing Fireflies API connection...');
    
    try {
      const fireflies = new FirefliesService(process.env.FIREFLIES_API_KEY);
      
      // Test with a basic query
      const query = `
        query GetUser {
          user {
            name
            email
          }
        }
      `;

      const response = await fireflies.client.post('', { query });
      
      if (response.data.errors) {
        throw new Error(`API Error: ${JSON.stringify(response.data.errors)}`);
      }

      if (response.data.data && response.data.data.user) {
        console.log('✅ Fireflies API connection successful');
        console.log(`   Connected as: ${response.data.data.user.name || response.data.data.user.email}`);
      } else {
        console.log('✅ Fireflies API connection successful (basic auth)');
      }

    } catch (error) {
      console.log('❌ Fireflies API connection failed');
      
      if (error.response && error.response.status === 401) {
        throw new Error('Invalid Fireflies API key. Please check your FIREFLIES_API_KEY in .env');
      } else if (error.response && error.response.status === 403) {
        throw new Error('Fireflies API key does not have required permissions');
      } else {
        throw new Error(`Fireflies API error: ${error.message}`);
      }
    }
  }

  async setupGoogleDriveFolder() {
    console.log('\n📁 Setting up local Google Drive folder...');
    
    const gdrive = new LocalGoogleDriveService({
      localPath: process.env.GOOGLE_DRIVE_LOCAL_PATH,
      targetFolder: process.env.GOOGLE_DRIVE_TARGET_FOLDER
    });

    // Check sync status
    const syncStatus = gdrive.checkSyncStatus();
    
    if (!syncStatus.googleDriveFound) {
      console.log('⚠️  Could not auto-detect Google Drive folder');
      const customPath = await this.askQuestion('Enter the path to your Google Drive folder: ');
      
      if (customPath && customPath.trim()) {
        console.log(`\n📝 Add this to your .env file:`);
        console.log(`GOOGLE_DRIVE_LOCAL_PATH=${customPath.trim()}`);
        console.log('\nThen run this setup again.');
        return;
      }
    } else {
      console.log(`✅ Google Drive found at: ${syncStatus.basePath}`);
      console.log(`📁 Target folder: ${syncStatus.targetPath}`);
      
      if (syncStatus.syncActive) {
        console.log('📤 Sync appears to be active');
      }
    }
  }

  async testLocalGoogleDriveConnection() {
    console.log('\n💾 Testing local Google Drive connection...');
    
    try {
      const gdrive = new LocalGoogleDriveService({
        localPath: process.env.GOOGLE_DRIVE_LOCAL_PATH,
        targetFolder: process.env.GOOGLE_DRIVE_TARGET_FOLDER
      });

      const success = await gdrive.testConnection();
      
      if (!success) {
        throw new Error('Local Google Drive connection test failed');
      }

    } catch (error) {
      console.log('❌ Local Google Drive connection failed');
      
      if (error.message.includes('ENOENT')) {
        throw new Error('Google Drive folder not found. Make sure Google Drive is installed and synced to your computer.');
      } else if (error.message.includes('EACCES')) {
        throw new Error('Permission denied. Make sure you have write access to the Google Drive folder.');
      } else {
        throw new Error(`Local Google Drive error: ${error.message}`);
      }
    }
  }

  askQuestion(question) {
    return new Promise(resolve => {
      this.rl.question(question, answer => {
        resolve(answer);
      });
    });
  }
}

// Run setup if this file is executed directly
if (require.main === module) {
  const setup = new LocalSetupWizard();
  setup.run();
}

module.exports = { LocalSetupWizard };
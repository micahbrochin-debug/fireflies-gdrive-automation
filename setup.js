require('dotenv').config();
const { GoogleDriveService } = require('./services/googleDrive');
const { FirefliesService } = require('./services/fireflies');
const readline = require('readline');

class SetupWizard {
  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  async run() {
    console.log('🚀 Fireflies to Google Drive Setup Wizard');
    console.log('==========================================\n');

    try {
      await this.checkEnvironmentVariables();
      await this.testFirefliesConnection();
      await this.testGoogleDriveConnection();
      await this.setupGoogleDriveFolder();
      
      console.log('\n✅ Setup completed successfully!');
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
    
    const required = [
      'FIREFLIES_API_KEY',
      'GOOGLE_CLIENT_EMAIL', 
      'GOOGLE_CLIENT_ID',
      'GOOGLE_PRIVATE_KEY'
    ];

    const missing = required.filter(key => !process.env[key]);
    
    if (missing.length > 0) {
      console.log('❌ Missing required environment variables:');
      missing.forEach(key => console.log(`   - ${key}`));
      console.log('\nPlease copy .env.example to .env and fill in your values.');
      throw new Error('Missing environment variables');
    }

    console.log('✅ All required environment variables found');

    if (!process.env.GOOGLE_DRIVE_FOLDER_ID) {
      console.log('⚠️  GOOGLE_DRIVE_FOLDER_ID not set - files will be uploaded to root');
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

  async testGoogleDriveConnection() {
    console.log('\n💾 Testing Google Drive API connection...');
    
    try {
      const gdrive = new GoogleDriveService({
        clientEmail: process.env.GOOGLE_CLIENT_EMAIL,
        clientId: process.env.GOOGLE_CLIENT_ID,
        privateKey: process.env.GOOGLE_PRIVATE_KEY,
        folderId: process.env.GOOGLE_DRIVE_FOLDER_ID
      });

      const success = await gdrive.testConnection();
      
      if (!success) {
        throw new Error('Google Drive connection test failed');
      }

      console.log('✅ Google Drive API connection successful');

    } catch (error) {
      console.log('❌ Google Drive API connection failed');
      
      if (error.message.includes('invalid_grant')) {
        throw new Error('Invalid Google service account credentials. Please check your service account JSON file.');
      } else if (error.message.includes('access_denied')) {
        throw new Error('Google service account does not have Drive API access enabled.');
      } else {
        throw new Error(`Google Drive API error: ${error.message}`);
      }
    }
  }

  async setupGoogleDriveFolder() {
    if (!process.env.GOOGLE_DRIVE_FOLDER_ID) {
      console.log('\n📁 Setting up Google Drive folder...');
      
      const createFolder = await this.askQuestion('Would you like to create a folder for transcripts? (y/n): ');
      
      if (createFolder.toLowerCase() === 'y' || createFolder.toLowerCase() === 'yes') {
        const folderName = await this.askQuestion('Enter folder name (default: "Fireflies Transcripts"): ') || 'Fireflies Transcripts';
        
        try {
          const gdrive = new GoogleDriveService({
            clientEmail: process.env.GOOGLE_CLIENT_EMAIL,
            clientId: process.env.GOOGLE_CLIENT_ID,
            privateKey: process.env.GOOGLE_PRIVATE_KEY
          });

          const folder = await gdrive.createFolder(folderName);
          
          console.log(`✅ Created folder: ${folder.name} (${folder.id})`);
          console.log(`\n📝 Add this to your .env file:`);
          console.log(`GOOGLE_DRIVE_FOLDER_ID=${folder.id}`);
          
        } catch (error) {
          console.log('❌ Failed to create folder:', error.message);
        }
      }
    } else {
      console.log('\n📁 Verifying Google Drive folder...');
      
      try {
        const gdrive = new GoogleDriveService({
          clientEmail: process.env.GOOGLE_CLIENT_EMAIL,
          clientId: process.env.GOOGLE_CLIENT_ID,
          privateKey: process.env.GOOGLE_PRIVATE_KEY,
          folderId: process.env.GOOGLE_DRIVE_FOLDER_ID
        });

        const folderInfo = await gdrive.getFolderInfo(process.env.GOOGLE_DRIVE_FOLDER_ID);
        console.log(`✅ Target folder verified: ${folderInfo.name}`);
        
      } catch (error) {
        console.log('❌ Failed to access target folder:', error.message);
        console.log('Please check your GOOGLE_DRIVE_FOLDER_ID in .env');
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
  const setup = new SetupWizard();
  setup.run();
}

module.exports = { SetupWizard };
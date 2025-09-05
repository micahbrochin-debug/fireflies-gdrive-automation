const axios = require('axios');

class DropboxService {
  constructor(config) {
    this.accessToken = config.accessToken;
    this.folderPath = config.folderPath || '/Fireflies Transcripts';
    
    this.client = axios.create({
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/octet-stream'
      }
    });
  }

  async uploadTranscript(fileName, content, transcript) {
    try {
      // Create folder path with year/month organization
      const date = new Date(transcript.dateString);
      const year = date.getFullYear().toString();
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      
      const fullPath = `${this.folderPath}/${year}/${month}/${fileName}`;
      
      // Upload file
      const response = await axios.post('https://content.dropboxapi.com/2/files/upload', content, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/octet-stream',
          'Dropbox-API-Arg': JSON.stringify({
            path: fullPath,
            mode: 'add',
            autorename: true
          })
        }
      });

      console.log(`File uploaded to Dropbox: ${response.data.name}`);
      
      // Get sharing link
      try {
        const linkResponse = await axios.post('https://api.dropboxapi.com/2/sharing/create_shared_link_with_settings', {
          path: fullPath,
          settings: {
            requested_visibility: 'public'
          }
        }, {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        });
        
        return {
          id: response.data.id,
          name: response.data.name,
          webViewLink: linkResponse.data.url,
          path: fullPath
        };
      } catch (linkError) {
        // If sharing link fails, still return file info
        return {
          id: response.data.id,
          name: response.data.name,
          path: fullPath
        };
      }

    } catch (error) {
      console.error('Error uploading to Dropbox:', error.message);
      throw error;
    }
  }

  async testConnection() {
    try {
      const response = await axios.post('https://api.dropboxapi.com/2/users/get_current_account', {}, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Dropbox connection successful');
      console.log('Connected user:', response.data.name.display_name);
      return true;

    } catch (error) {
      console.error('Dropbox connection failed:', error.message);
      
      if (error.response && error.response.status === 401) {
        console.error('Invalid Dropbox access token');
      }
      
      return false;
    }
  }

  async listFiles(folderPath = null) {
    try {
      const searchPath = folderPath || this.folderPath;
      
      const response = await axios.post('https://api.dropboxapi.com/2/files/list_folder', {
        path: searchPath,
        recursive: true
      }, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      const files = response.data.entries
        .filter(entry => entry['.tag'] === 'file' && entry.name.endsWith('.txt'))
        .map(entry => ({
          id: entry.id,
          name: entry.name,
          path: entry.path_display,
          modifiedTime: entry.server_modified
        }));

      return files.sort((a, b) => new Date(b.modifiedTime) - new Date(a.modifiedTime));

    } catch (error) {
      console.error('Error listing Dropbox files:', error.message);
      throw error;
    }
  }
}

module.exports = { DropboxService };
class FileNameService {
  constructor() {
    // Company domain mappings for common email domains
    this.companyMappings = {
      'gmail.com': 'Personal',
      'yahoo.com': 'Personal', 
      'hotmail.com': 'Personal',
      'outlook.com': 'Personal'
    };
  }

  generateFileName(dateString, meetingTitle, participants) {
    try {
      // Extract company name from participants or meeting title
      const companyName = this.extractCompanyName(meetingTitle, participants);
      
      // Parse date and format it as mm-dd-yy_hh:MM_AM/PM
      const formattedDateTime = this.formatDateTime(dateString);
      
      // Create filename: company_name_mm-dd-yy_hh:MM_AM_PM.pdf
      const fileName = `${companyName}_${formattedDateTime}.pdf`;
      
      return fileName;
    } catch (error) {
      console.error('Error generating filename:', error);
      // Fallback filename
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
      return `transcript_${timestamp}.pdf`;
    }
  }

  formatDateTime(dateString) {
    try {
      let date;
      
      // Try to parse various date formats
      if (dateString.includes('T')) {
        // ISO format
        date = new Date(dateString);
      } else if (dateString.includes('/')) {
        // MM/DD/YYYY format
        date = new Date(dateString);
      } else if (dateString.includes('-')) {
        // YYYY-MM-DD format
        date = new Date(dateString);
      } else {
        // Fallback to current date
        date = new Date();
      }
      
      if (isNaN(date.getTime())) {
        date = new Date();
      }
      
      // Format as mm-dd-yy_hh-MM AM-PM (using dashes to avoid filesystem issues)
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      const year = date.getFullYear().toString().slice(-2); // Last 2 digits of year
      
      // Convert to 12-hour format
      let hours = date.getHours();
      const minutes = date.getMinutes().toString().padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12; // 0 should be 12
      const formattedHours = hours.toString().padStart(2, '0');
      
      return `${month}-${day}-${year}_${formattedHours}-${minutes} ${ampm}`;
    } catch (error) {
      console.error('Error formatting date:', error);
      const now = new Date();
      const month = (now.getMonth() + 1).toString().padStart(2, '0');
      const day = now.getDate().toString().padStart(2, '0');
      const year = now.getFullYear().toString().slice(-2);
      return `${month}-${day}-${year}_12:00_PM`;
    }
  }

  formatDate(dateString) {
    try {
      let date;
      
      // Try to parse various date formats
      if (dateString.includes('T')) {
        // ISO format
        date = new Date(dateString);
      } else if (dateString.includes('/')) {
        // MM/DD/YYYY format
        date = new Date(dateString);
      } else if (dateString.includes('-')) {
        // YYYY-MM-DD format
        date = new Date(dateString);
      } else {
        // Fallback to current date
        date = new Date();
      }
      
      if (isNaN(date.getTime())) {
        date = new Date();
      }
      
      // Format as YYYY-MM-DD_HHMM
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      
      return `${year}-${month}-${day}_${hours}${minutes}`;
    } catch (error) {
      console.error('Error formatting date:', error);
      const now = new Date();
      return now.toISOString().slice(0, 16).replace(/[:-]/g, '').replace('T', '_');
    }
  }

  extractCompanyName(meetingTitle, participants) {
    try {
      // First, try to extract company from meeting title
      let companyFromTitle = this.extractCompanyFromTitle(meetingTitle);
      if (companyFromTitle && companyFromTitle !== 'Meeting') {
        return companyFromTitle;
      }
      
      // Extract company names from participant emails
      const companies = new Set();
      
      if (Array.isArray(participants)) {
        participants.forEach(participant => {
          if (typeof participant === 'string' && participant.includes('@')) {
            const domain = participant.split('@')[1];
            const companyName = this.domainToCompanyName(domain);
            if (companyName && companyName !== 'Personal') {
              companies.add(companyName);
            }
          }
        });
      }
      
      // If we found company names from emails, use the first one
      if (companies.size > 0) {
        return Array.from(companies)[0];
      }
      
      // Fallback
      return companyFromTitle || 'Meeting';
    } catch (error) {
      console.error('Error extracting company name:', error);
      return 'Meeting';
    }
  }

  extractCompanyFromTitle(title) {
    if (!title || typeof title !== 'string') {
      return 'Meeting';
    }
    
    // Common patterns in meeting titles that might indicate company
    const companyPatterns = [
      /(?:with|@|\-)\s*([A-Z][a-zA-Z\s&]+?)(?:\s|$|meeting|call|sync|standup)/i,
      /([A-Z][a-zA-Z\s&]+?)\s+(?:meeting|call|sync|standup|discussion)/i,
      /^([A-Z][a-zA-Z\s&]+?)\s*[\-:]/i
    ];
    
    for (const pattern of companyPatterns) {
      const match = title.match(pattern);
      if (match && match[1]) {
        const company = match[1].trim();
        // Filter out common words that aren't company names
        if (!this.isCommonWord(company) && company.length > 1) {
          return this.cleanCompanyName(company);
        }
      }
    }
    
    return 'Meeting';
  }

  domainToCompanyName(domain) {
    if (!domain) return 'Unknown';
    
    // Check if it's a mapped personal domain
    if (this.companyMappings[domain.toLowerCase()]) {
      return this.companyMappings[domain.toLowerCase()];
    }
    
    // Extract company name from domain
    const parts = domain.toLowerCase().split('.');
    const mainPart = parts[0];
    
    // Capitalize first letter and remove common suffixes
    let companyName = mainPart.charAt(0).toUpperCase() + mainPart.slice(1);
    
    // Handle common domain patterns
    if (companyName.length <= 3) {
      // For short domains, might be abbreviations
      return companyName.toUpperCase();
    }
    
    return companyName;
  }

  isCommonWord(word) {
    const commonWords = [
      'meeting', 'call', 'sync', 'standup', 'discussion', 'chat', 'talk',
      'weekly', 'daily', 'monthly', 'team', 'one', 'on', 'check', 'in',
      'follow', 'up', 'review', 'planning', 'session', 'the', 'and', 'or',
      'with', 'for', 'about', 'regarding', 'quick', 'brief'
    ];
    
    return commonWords.includes(word.toLowerCase());
  }

  cleanCompanyName(companyName) {
    // Remove unwanted characters and limit length
    return companyName
      .replace(/[^a-zA-Z0-9\s&]/g, '')
      .replace(/\s+/g, '')
      .slice(0, 20);
  }

  cleanTitleForFilename(title) {
    if (!title || typeof title !== 'string') {
      return 'transcript';
    }
    
    // Remove or replace characters not allowed in filenames
    return title
      .replace(/[<>:"/\\|?*]/g, '')
      .replace(/\s+/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '')
      .slice(0, 50)
      .toLowerCase() || 'transcript';
  }
}

module.exports = { FileNameService };
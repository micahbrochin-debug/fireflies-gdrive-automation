const axios = require('axios');

class FirefliesService {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://api.fireflies.ai/graphql';
    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
  }

  async getTranscript(transcriptId) {
    const query = `
      query GetTranscript($transcriptId: String!) {
        transcript(id: $transcriptId) {
          id
          title
          dateString
          duration
          host_email
          organizer_email
          participants
          transcript_url
          audio_url
          video_url
          sentences {
            index
            speaker_name
            speaker_id
            text
            start_time
            end_time
          }
          summary {
            keywords
            action_items
            overview
          }
          analytics {
            sentiments {
              negative_pct
              neutral_pct
              positive_pct
            }
            speakers {
              speaker_id
              name
              duration
              word_count
            }
          }
        }
      }
    `;

    try {
      const response = await this.client.post('', {
        query,
        variables: { transcriptId }
      });

      if (response.data.errors) {
        throw new Error(`GraphQL errors: ${JSON.stringify(response.data.errors)}`);
      }

      return response.data.data.transcript;
    } catch (error) {
      console.error('Error fetching transcript:', error.message);
      throw error;
    }
  }

  async getRecentTranscripts(hours = 24) {
    const fromDate = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
    
    const query = `
      query GetRecentTranscripts($fromDate: DateTime, $limit: Int) {
        transcripts(fromDate: $fromDate, limit: $limit, mine: true) {
          id
          title
          dateString
          duration
          host_email
          organizer_email
          participants
        }
      }
    `;

    try {
      const response = await this.client.post('', {
        query,
        variables: {
          fromDate: fromDate,
          limit: 50
        }
      });

      if (response.data.errors) {
        throw new Error(`GraphQL errors: ${JSON.stringify(response.data.errors)}`);
      }

      const transcripts = response.data.data.transcripts || [];
      console.log(`Found ${transcripts.length} transcripts from the last ${hours} hours`);
      
      return transcripts;
    } catch (error) {
      console.error('Error fetching recent transcripts:', error.message);
      throw error;
    }
  }

  async downloadTranscriptContent(transcript) {
    // Create formatted transcript content
    const content = this.formatTranscript(transcript);
    
    // If there's a transcript_url, we could also download the raw file
    // For now, we'll return the formatted content
    return Buffer.from(content, 'utf-8');
  }

  formatTranscript(transcript) {
    let content = '';
    
    // Header information
    content += `Meeting: ${transcript.title}\n`;
    content += `Date: ${transcript.dateString}\n`;
    content += `Duration: ${transcript.duration} minutes\n`;
    content += `Host: ${transcript.host_email}\n`;
    content += `Organizer: ${transcript.organizer_email}\n`;
    content += `Participants: ${transcript.participants.join(', ')}\n`;
    content += `\n${'='.repeat(80)}\n\n`;
    
    // Summary section
    if (transcript.summary) {
      content += 'SUMMARY\n';
      content += `${'-'.repeat(40)}\n`;
      if (transcript.summary.overview) {
        content += `Overview: ${transcript.summary.overview}\n\n`;
      }
      if (transcript.summary.action_items) {
        content += 'Action Items:\n';
        if (Array.isArray(transcript.summary.action_items)) {
          transcript.summary.action_items.forEach((item, index) => {
            content += `${index + 1}. ${item}\n`;
          });
        } else {
          content += `${transcript.summary.action_items}\n`;
        }
        content += '\n';
      }
      if (transcript.summary.keywords) {
        if (Array.isArray(transcript.summary.keywords) && transcript.summary.keywords.length > 0) {
          content += `Keywords: ${transcript.summary.keywords.join(', ')}\n\n`;
        } else if (typeof transcript.summary.keywords === 'string') {
          content += `Keywords: ${transcript.summary.keywords}\n\n`;
        }
      }
      content += `${'='.repeat(80)}\n\n`;
    }
    
    // Transcript section
    content += 'TRANSCRIPT\n';
    content += `${'-'.repeat(40)}\n`;
    
    if (transcript.sentences && transcript.sentences.length > 0) {
      transcript.sentences.forEach(sentence => {
        const timestamp = this.formatTime(sentence.start_time);
        content += `[${timestamp}] ${sentence.speaker_name}: ${sentence.text}\n`;
      });
    }
    
    // Analytics section
    if (transcript.analytics) {
      content += `\n${'='.repeat(80)}\n\n`;
      content += 'ANALYTICS\n';
      content += `${'-'.repeat(40)}\n`;
      
      if (transcript.analytics.speakers) {
        content += 'Speaker Statistics:\n';
        transcript.analytics.speakers.forEach(speaker => {
          content += `- ${speaker.name}: ${Math.round(speaker.duration)} minutes, ${speaker.word_count} words\n`;
        });
      }
      
      if (transcript.analytics.sentiments) {
        const sentiments = transcript.analytics.sentiments;
        content += `\nSentiment Analysis:\n`;
        content += `- Positive: ${Math.round(sentiments.positive_pct)}%\n`;
        content += `- Neutral: ${Math.round(sentiments.neutral_pct)}%\n`;
        content += `- Negative: ${Math.round(sentiments.negative_pct)}%\n`;
      }
    }
    
    return content;
  }

  formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
}

module.exports = { FirefliesService };
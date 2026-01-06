/**
 * Sample Data Generator for Onboarding
 * Creates realistic demo contacts for users to explore
 */

const SAMPLE_CONTACTS = [
  {
    email: 'sarah.johnson@techcorp.com',
    firstName: 'Sarah',
    lastName: 'Johnson',
    company: 'TechCorp Solutions',
    title: 'VP of Sales',
    phone: '+1 (555) 123-4567',
    source: 'gmail',
    status: 'approved',
    tags: ['Hot Lead', 'Enterprise'],
    outboundCount: 5,
    inboundCount: 3,
    threadStatus: 'replied'
  },
  {
    email: 'michael.chen@startuphub.io',
    firstName: 'Michael',
    lastName: 'Chen',
    company: 'StartupHub.io',
    title: 'Co-Founder & CEO',
    phone: '+1 (555) 234-5678',
    source: 'gmail',
    status: 'approved',
    tags: ['Founder', 'SaaS'],
    outboundCount: 3,
    inboundCount: 2,
    threadStatus: 'replied'
  },
  {
    email: 'emma.davis@growthagency.com',
    firstName: 'Emma',
    lastName: 'Davis',
    company: 'Growth Agency Co',
    title: 'Marketing Director',
    phone: '+1 (555) 345-6789',
    source: 'hubspot',
    status: 'approved',
    tags: ['Marketing', 'Agency'],
    outboundCount: 2,
    inboundCount: 1,
    threadStatus: 'replied'
  },
  {
    email: 'james.wilson@cloudservices.net',
    firstName: 'James',
    lastName: 'Wilson',
    company: 'Cloud Services Inc',
    title: 'CTO',
    phone: '+1 (555) 456-7890',
    source: 'salesforce',
    status: 'approved',
    tags: ['Technical', 'Enterprise'],
    outboundCount: 4,
    inboundCount: 4,
    threadStatus: 'replied'
  },
  {
    email: 'olivia.martinez@designstudio.com',
    firstName: 'Olivia',
    lastName: 'Martinez',
    company: 'Design Studio Pro',
    title: 'Creative Director',
    phone: '+1 (555) 567-8901',
    source: 'gmail',
    status: 'pending',
    tags: ['Creative', 'New'],
    outboundCount: 1,
    inboundCount: 0,
    threadStatus: 'no_reply'
  }
];

/**
 * Generate sample contacts for demo purposes
 */
async function generateSampleData() {
  try {
    logger.log('📦 Generating sample data...');
    
    const now = new Date();
    const sampleContacts = SAMPLE_CONTACTS.map((contact, index) => {
      // Create timestamps - spread over last 7 days
      const daysAgo = Math.floor(index * 1.5);
      const createdAt = new Date(now - daysAgo * 24 * 60 * 60 * 1000);
      const lastContactAt = new Date(createdAt.getTime() + Math.random() * 2 * 24 * 60 * 60 * 1000);
      
      return {
        ...contact,
        id: `sample_${Date.now()}_${index}`,
        createdAt: createdAt.toISOString(),
        dateAdded: createdAt.toISOString(),
        firstContactAt: createdAt.toISOString(),
        lastContactAt: lastContactAt.toISOString(),
        lastUpdated: now.toISOString(),
        messages: [
          {
            direction: 'outbound',
            subject: `Re: ${contact.company} Partnership Opportunity`,
            timestamp: createdAt.toISOString()
          }
        ]
      };
    });
    
    // Get existing contacts
    const { contacts = [] } = await chrome.storage.local.get(['contacts']);
    
    // Filter out any existing sample data
    const nonSampleContacts = contacts.filter(c => !c.id?.startsWith('sample_'));
    
    // Combine with new sample data
    const updatedContacts = [...nonSampleContacts, ...sampleContacts];
    
    // Save to storage
    await chrome.storage.local.set({ 
      contacts: updatedContacts,
      hasSampleData: true
    });
    
    logger.log(`✅ Generated ${sampleContacts.length} sample contacts`);
    return { success: true, count: sampleContacts.length };
    
  } catch (error) {
    logger.error('Error generating sample data:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Clear sample data
 */
async function clearSampleData() {
  try {
    logger.log('🗑️ Clearing sample data...');
    
    const { contacts = [] } = await chrome.storage.local.get(['contacts']);
    
    // Remove sample contacts
    const realContacts = contacts.filter(c => !c.id?.startsWith('sample_'));
    
    await chrome.storage.local.set({ 
      contacts: realContacts,
      hasSampleData: false
    });
    
    logger.log('✅ Sample data cleared');
    return { success: true };
    
  } catch (error) {
    logger.error('Error clearing sample data:', error);
    return { success: false, error: error.message };
  }
}

// Make functions available globally
if (typeof window !== 'undefined') {
  window.generateSampleData = generateSampleData;
  window.clearSampleData = clearSampleData;
}

// Listen for messages from onboarding
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'generateSampleData') {
    generateSampleData().then(sendResponse);
    return true; // Async response
  }
  
  if (request.action === 'clearSampleData') {
    clearSampleData().then(sendResponse);
    return true; // Async response
  }
});

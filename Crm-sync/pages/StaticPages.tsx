import React from 'react';
import { SectionHeader } from '../components/Shared';

interface PageContent {
  title: string;
  subtitle: string;
  content: React.ReactNode;
}

const PAGES: Record<string, PageContent> = {
  docs: {
    title: "Documentation",
    subtitle: "Learn how to get the most out of CRMSYNC",
    content: (
      <div className="space-y-6 text-gray-600">
        <h3 className="text-xl font-bold text-dark">Getting Started</h3>
        <p>1. Install the Extension from the Chrome Web Store.</p>
        <p>2. Pin the extension to your toolbar.</p>
        <p>3. Open Gmail and click the CRMSYNC icon in the sidebar.</p>
        <h3 className="text-xl font-bold text-dark mt-8">Configuration</h3>
        <p>Navigate to Settings to connect your CRM account (HubSpot, Salesforce) or configure your CSV export preferences.</p>
      </div>
    )
  },
  about: {
    title: "About Us",
    subtitle: "Building the future of relationship management",
    content: (
      <div className="space-y-6 text-gray-600">
        <p>CRMSYNC was born out of frustration. Salespeople spend 20% of their time on data entry. We believe that time should be spent building relationships, not updating spreadsheets.</p>
        <p>Founded in 2024, we help thousands of professionals automate their workflow directly within Gmail.</p>
      </div>
    )
  },
  careers: {
    title: "Careers",
    subtitle: "Join our mission",
    content: (
      <div className="space-y-6 text-gray-600">
        <p>We are always looking for talented engineers and designers.</p>
        <p>Current openings:</p>
        <ul className="list-disc ml-5 space-y-2">
          <li>Senior React Engineer</li>
          <li>Backend Developer (Node.js)</li>
          <li>Product Designer</li>
        </ul>
        <p className="mt-4">Send your resume to careers@crmsync.com</p>
      </div>
    )
  },
  terms: {
    title: "Terms of Service",
    subtitle: "Last updated: December 2024",
    content: (
      <div className="space-y-6 text-sm text-gray-600">
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
          <p className="text-blue-800 font-medium">Summary: Use CRMSYNC responsibly and legally. You own your data. We provide the service "as is". You can cancel anytime.</p>
        </div>

        <h4 className="font-bold text-gray-900 text-base">1. Acceptance of Terms</h4>
        <p>By using CRMSYNC ("the Service"), you agree to be bound by these Terms. If you don't agree, don't use the Service.</p>

        <h4 className="font-bold text-gray-900 text-base">2. Description of Service</h4>
        <p>CRMSYNC is a Chrome extension and web service that:</p>
        <ul className="list-disc ml-5 space-y-1">
          <li>Extracts contact information from emails you view in Gmail</li>
          <li>Stores contacts locally and/or in the cloud</li>
          <li>Syncs contacts to third-party CRM platforms</li>
          <li>Provides contact management features</li>
        </ul>

        <h4 className="font-bold text-gray-900 text-base">3. Account Registration</h4>
        <p>To use certain features, you must create an account. You agree to:</p>
        <ul className="list-disc ml-5 space-y-1">
          <li>Provide accurate and complete information</li>
          <li>Maintain the security of your credentials</li>
          <li>Notify us of any unauthorized access</li>
          <li>Accept responsibility for all activities under your account</li>
        </ul>

        <h4 className="font-bold text-gray-900 text-base">4. Acceptable Use</h4>
        <p>You agree NOT to use CRMSYNC to:</p>
        <ul className="list-disc ml-5 space-y-1">
          <li>Collect contacts without proper consent or legal basis</li>
          <li>Send spam or unsolicited communications</li>
          <li>Violate any applicable laws or regulations</li>
          <li>Infringe on others' privacy or intellectual property</li>
          <li>Attempt to hack or compromise the Service</li>
          <li>Abuse API rate limits</li>
          <li>Share your account or resell access</li>
        </ul>
        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-r-lg">
          <p className="text-yellow-800">GDPR/CCPA Compliance: You are responsible for ensuring your use complies with data protection laws. Only collect contacts when you have a legal basis.</p>
        </div>

        <h4 className="font-bold text-gray-900 text-base">5. Subscription Plans & Payment</h4>
        <p><strong>Free Plan:</strong> Limited features and contact limit (50/month). May be modified with 30 days notice.</p>
        <p><strong>Paid Plans:</strong> Billed monthly or annually through Stripe. You authorize recurring charges until cancellation.</p>
        <p><strong>Cancellation:</strong> Cancel anytime from account settings. Takes effect at end of billing period. Refunds available within 14 days at our discretion.</p>

        <h4 className="font-bold text-gray-900 text-base">6. Intellectual Property</h4>
        <p>The Service (code, design, content) is owned by CRMSYNC. You may not copy, modify, or distribute the extension, use our trademarks without permission, or create derivative works.</p>

        <h4 className="font-bold text-gray-900 text-base">7. Third-Party Services</h4>
        <p>CRMSYNC integrates with HubSpot, Salesforce, and Stripe. Your use of these integrations is subject to their terms. We're not responsible for third-party service availability.</p>

        <h4 className="font-bold text-gray-900 text-base">8. Data and Privacy</h4>
        <p>See our <a href="#/privacy" className="text-blue-600 hover:underline">Privacy Policy</a> for details. Key points: You own your contact data. We process data only to provide the Service. You can export or delete your data anytime.</p>

        <h4 className="font-bold text-gray-900 text-base">9. Service Availability</h4>
        <p>We strive for high availability but don't guarantee uninterrupted service. We may perform scheduled maintenance, experience unplanned outages, or modify features.</p>

        <h4 className="font-bold text-gray-900 text-base">10. Limitation of Liability</h4>
        <div className="bg-gray-100 p-4 rounded-lg">
          <p className="text-gray-700">THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND. TO THE MAXIMUM EXTENT PERMITTED BY LAW, CRMSYNC SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES.</p>
        </div>
        <p>Our total liability shall not exceed the amount you paid us in the 12 months preceding the claim.</p>

        <h4 className="font-bold text-gray-900 text-base">11. Indemnification</h4>
        <p>You agree to indemnify CRMSYNC from any claims arising from your use of the Service, violation of these Terms, or violation of third-party rights.</p>

        <h4 className="font-bold text-gray-900 text-base">12. Termination</h4>
        <p>We may suspend or terminate your account if you violate these Terms, abuse the Service, or engage in fraudulent activity. Upon termination, your right to use the Service ends immediately.</p>

        <h4 className="font-bold text-gray-900 text-base">13. Dispute Resolution</h4>
        <p>Disputes shall be first attempted through informal negotiation, subject to binding arbitration if negotiation fails, and governed by the laws of Denmark.</p>

        <h4 className="font-bold text-gray-900 text-base">14. Changes to Terms</h4>
        <p>We may update these Terms. Continued use after changes constitutes acceptance. Material changes will be communicated via email.</p>

        <h4 className="font-bold text-gray-900 text-base">15. Contact</h4>
        <p>Questions? Email: <a href="mailto:legal@crm-sync.net" className="text-blue-600 hover:underline">legal@crm-sync.net</a></p>
      </div>
    )
  },
  privacy: {
    title: "Privacy Policy",
    subtitle: "Your privacy is our priority",
    content: (
      <div className="space-y-6 text-sm text-gray-600">
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
          <p className="text-blue-800 font-medium">Summary: We only collect data necessary to provide the service. We never sell your data. You can export or delete your data anytime. Email content is processed locally, never stored.</p>
        </div>

        <h4 className="font-bold text-gray-900 text-base">1. Information We Collect</h4>
        
        <p><strong>Account Information:</strong> When you create an account:</p>
        <ul className="list-disc ml-5 space-y-1">
          <li>Email address</li>
          <li>Name (if provided)</li>
          <li>Password (encrypted with bcrypt)</li>
        </ul>

        <p className="mt-4"><strong>Contact Data:</strong> When you use CRMSYNC, we process:</p>
        <ul className="list-disc ml-5 space-y-1">
          <li>Names from email headers/signatures</li>
          <li>Email addresses</li>
          <li>Phone numbers (if found in signatures)</li>
          <li>Company names (if detected)</li>
          <li>Job titles (if detected)</li>
        </ul>

        <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-r-lg">
          <p className="text-green-800">Important: We only process emails you actively view. We never scan your entire inbox or access emails you don't open.</p>
        </div>

        <p className="mt-4"><strong>Usage Data:</strong> Anonymous statistics to improve the service:</p>
        <ul className="list-disc ml-5 space-y-1">
          <li>Number of contacts saved</li>
          <li>Feature usage patterns</li>
          <li>Error logs (for debugging)</li>
        </ul>

        <p className="mt-4"><strong>Payment Information:</strong> Payments are processed by Stripe. We never store credit card numbers.</p>

        <h4 className="font-bold text-gray-900 text-base">2. How We Use Your Data</h4>
        <p>We use your information to:</p>
        <ul className="list-disc ml-5 space-y-1">
          <li>Provide the CRMSYNC service</li>
          <li>Sync contacts to your connected CRMs (HubSpot, Salesforce)</li>
          <li>Send important service updates</li>
          <li>Improve our product</li>
          <li>Provide customer support</li>
          <li>Process payments</li>
        </ul>

        <h4 className="font-bold text-gray-900 text-base">3. Data Sharing</h4>
        <p><strong>Third-Party Services:</strong></p>
        <ul className="list-disc ml-5 space-y-1">
          <li><strong>HubSpot/Salesforce:</strong> Contacts you choose to sync are sent to your CRM</li>
          <li><strong>Stripe:</strong> For payment processing</li>
          <li><strong>Cloud Infrastructure:</strong> Encrypted data storage</li>
        </ul>
        <p className="mt-4 font-semibold text-gray-900">We Never Sell Your Data. We do not sell, rent, or trade your personal information to any third parties.</p>

        <h4 className="font-bold text-gray-900 text-base">4. Data Security</h4>
        <p>We implement industry-standard security:</p>
        <ul className="list-disc ml-5 space-y-1">
          <li>All data transmitted over HTTPS (TLS 1.3)</li>
          <li>Passwords hashed with bcrypt</li>
          <li>JWT tokens with short expiration</li>
          <li>Database encryption at rest</li>
          <li>Regular security audits</li>
        </ul>

        <h4 className="font-bold text-gray-900 text-base">5. Data Retention</h4>
        <ul className="list-disc ml-5 space-y-1">
          <li><strong>Account data:</strong> Until you delete your account</li>
          <li><strong>Contact data:</strong> Until you delete contacts or account</li>
          <li><strong>Usage logs:</strong> 90 days</li>
          <li><strong>Payment records:</strong> As required by law (7 years)</li>
        </ul>

        <h4 className="font-bold text-gray-900 text-base">6. Your Rights</h4>
        <p>You have the right to:</p>
        <ul className="list-disc ml-5 space-y-1">
          <li><strong>Access:</strong> Request a copy of your data</li>
          <li><strong>Correction:</strong> Update inaccurate information</li>
          <li><strong>Deletion:</strong> Delete your account and all data</li>
          <li><strong>Export:</strong> Download contacts as CSV</li>
          <li><strong>Opt-out:</strong> Unsubscribe from marketing emails</li>
        </ul>

        <p className="mt-4"><strong>GDPR (European Users):</strong> If you're in the EEA, you have additional rights including data portability and the right to lodge a complaint with a supervisory authority.</p>

        <p><strong>CCPA (California Users):</strong> California residents can request to know what personal information is collected, request deletion, and opt-out of sale (we don't sell data).</p>

        <h4 className="font-bold text-gray-900 text-base">7. Cookies</h4>
        <p>We use essential cookies only:</p>
        <ul className="list-disc ml-5 space-y-1">
          <li>Authentication (keeping you logged in)</li>
          <li>Security (preventing CSRF attacks)</li>
        </ul>
        <p>We do NOT use advertising or tracking cookies.</p>

        <h4 className="font-bold text-gray-900 text-base">8. Children's Privacy</h4>
        <p>CRMSYNC is not intended for users under 16. We do not knowingly collect information from children.</p>

        <h4 className="font-bold text-gray-900 text-base">9. Changes to This Policy</h4>
        <p>We may update this policy from time to time. Significant changes will be communicated via email or in-app notification.</p>

        <h4 className="font-bold text-gray-900 text-base">10. Contact Us</h4>
        <p>Questions about privacy? Email: <a href="mailto:privacy@crm-sync.net" className="text-blue-600 hover:underline">privacy@crm-sync.net</a></p>
      </div>
    )
  },
  blog: {
    title: "Blog",
    subtitle: "Latest updates and tips",
    content: (
      <div className="grid gap-6">
        <div className="border border-gray-100 p-6 rounded-xl">
          <h3 className="font-bold text-lg">5 Tips for Better Email Management</h3>
          <p className="text-gray-500 text-sm mt-2">March 15, 2024</p>
          <p className="mt-4 text-gray-600">Learn how to hit Inbox Zero without losing your mind...</p>
        </div>
        <div className="border border-gray-100 p-6 rounded-xl">
          <h3 className="font-bold text-lg">Introducing Salesforce Integration</h3>
          <p className="text-gray-500 text-sm mt-2">February 28, 2024</p>
          <p className="mt-4 text-gray-600">You can now sync contacts directly to your Salesforce account...</p>
        </div>
      </div>
    )
  }
};

export const StaticPage: React.FC<{ pageKey: string }> = ({ pageKey }) => {
  const page = PAGES[pageKey] || PAGES['about'];

  return (
    <div className="min-h-screen bg-white py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader title={page.title} subtitle={page.subtitle} align="left" />
        <div className="mt-8 prose prose-blue max-w-none">
          {page.content}
        </div>
      </div>
    </div>
  );
};
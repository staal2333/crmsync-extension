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
    subtitle: "Last updated: March 2024",
    content: (
      <div className="space-y-4 text-sm text-gray-600">
        <p>By using CRMSYNC, you agree to these terms.</p>
        <h4 className="font-bold">1. License</h4>
        <p>We grant you a limited, non-exclusive license to use the software.</p>
        <h4 className="font-bold">2. Data</h4>
        <p>You retain all rights to your data. We do not sell your contact data to third parties.</p>
      </div>
    )
  },
  privacy: {
    title: "Privacy Policy",
    subtitle: "Your privacy is our priority",
    content: (
      <div className="space-y-4 text-sm text-gray-600">
        <p>We only collect data necessary to provide the service.</p>
        <h4 className="font-bold">Information We Collect</h4>
        <p>Email metadata (sender, recipient) is processed locally to extract contact info. Only synced contacts are stored on our servers if cloud sync is enabled.</p>
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
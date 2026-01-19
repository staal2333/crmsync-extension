import React, { useEffect } from 'react';
import { SectionHeader } from '../components/Shared';

interface PageContent {
  title: string;
  subtitle: string;
  metaDescription?: string;
  content: React.ReactNode;
}

const PAGES: Record<string, PageContent> = {
  docs: {
    title: "Documentation",
    subtitle: "Everything you need to get started and make the most of CRMSYNC",
    content: (
      <div className="space-y-8 text-gray-600">
        {/* Table of Contents */}
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">📖 Table of Contents</h3>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <li><a href="#getting-started" className="text-blue-600 hover:underline">1. Getting Started</a></li>
            <li><a href="#gmail-integration" className="text-blue-600 hover:underline">2. Gmail Integration</a></li>
            <li><a href="#hubspot-setup" className="text-blue-600 hover:underline">3. HubSpot Setup</a></li>
            <li><a href="#salesforce-setup" className="text-blue-600 hover:underline">4. Salesforce Setup</a></li>
            <li><a href="#contact-management" className="text-blue-600 hover:underline">5. Contact Management</a></li>
            <li><a href="#inbox-sync" className="text-blue-600 hover:underline">6. Inbox Sync</a></li>
            <li><a href="#export-options" className="text-blue-600 hover:underline">7. Export Options</a></li>
            <li><a href="#troubleshooting" className="text-blue-600 hover:underline">8. Troubleshooting</a></li>
            <li><a href="#faq" className="text-blue-600 hover:underline">9. FAQ</a></li>
            <li><a href="#keyboard-shortcuts" className="text-blue-600 hover:underline">10. Keyboard Shortcuts</a></li>
          </ul>
        </div>

        {/* Section 1: Getting Started */}
        <section id="getting-started">
          <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <span className="bg-blue-100 text-blue-600 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">1</span>
            Getting Started
          </h3>
          <div className="mt-4 space-y-4">
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
              <p className="text-blue-800 font-medium">Get up and running in under 2 minutes!</p>
            </div>
            
            <h4 className="font-semibold text-gray-900 mt-6">Step 1: Install the Extension</h4>
            <ol className="list-decimal ml-5 space-y-2">
              <li>Visit the <a href="https://chrome.google.com/webstore" className="text-blue-600 hover:underline">Chrome Web Store</a></li>
              <li>Search for "CRMSYNC" or use our direct link</li>
              <li>Click <strong>"Add to Chrome"</strong></li>
              <li>Confirm by clicking <strong>"Add extension"</strong></li>
            </ol>

            <h4 className="font-semibold text-gray-900 mt-6">Step 2: Pin the Extension</h4>
            <ol className="list-decimal ml-5 space-y-2">
              <li>Click the puzzle piece icon (🧩) in Chrome's toolbar</li>
              <li>Find CRMSYNC in the list</li>
              <li>Click the pin icon (📌) to keep it visible</li>
            </ol>

            <h4 className="font-semibold text-gray-900 mt-6">Step 3: Create Your Account</h4>
            <ol className="list-decimal ml-5 space-y-2">
              <li>Click the CRMSYNC icon in your toolbar</li>
              <li>Click <strong>"Sign Up"</strong> or <strong>"Continue with Google"</strong></li>
              <li>Verify your email address</li>
              <li>You're ready to start capturing contacts!</li>
            </ol>

            <h4 className="font-semibold text-gray-900 mt-6">Step 4: Open Gmail and Start Capturing</h4>
            <ol className="list-decimal ml-5 space-y-2">
              <li>Navigate to <a href="https://mail.google.com" className="text-blue-600 hover:underline">Gmail</a></li>
              <li>Open any email conversation</li>
              <li>CRMSYNC automatically detects contacts from the email</li>
              <li>Click "Save" to add contacts to your list</li>
            </ol>
          </div>
        </section>

        {/* Section 2: Gmail Integration */}
        <section id="gmail-integration" className="border-t border-gray-200 pt-8">
          <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <span className="bg-blue-100 text-blue-600 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">2</span>
            Gmail Integration
          </h3>
          <div className="mt-4 space-y-4">
            <p>CRMSYNC works seamlessly within Gmail to extract contact information from emails you view.</p>
            
            <h4 className="font-semibold text-gray-900 mt-6">How Contact Detection Works</h4>
            <ul className="list-disc ml-5 space-y-2">
              <li><strong>Email Headers:</strong> We extract sender and recipient information (name, email)</li>
              <li><strong>Email Signatures:</strong> Phone numbers, job titles, and company names are parsed from signatures</li>
              <li><strong>Real-time Processing:</strong> Contacts appear instantly as you open emails</li>
              <li><strong>Local Processing:</strong> Email content is processed on your device, never sent to our servers</li>
            </ul>

            <h4 className="font-semibold text-gray-900 mt-6">Sidebar Panel</h4>
            <p>When viewing an email, you'll see the CRMSYNC sidebar showing:</p>
            <ul className="list-disc ml-5 space-y-2">
              <li>Detected contacts with extracted information</li>
              <li>Quick action buttons (Save, Edit, Sync to CRM)</li>
              <li>Confidence indicators for extracted data</li>
            </ul>

            <h4 className="font-semibold text-gray-900 mt-6">Exclusion Settings</h4>
            <p>Prevent certain contacts from being captured:</p>
            <ul className="list-disc ml-5 space-y-2">
              <li><strong>Exclude Your Domain:</strong> Skip emails from @yourcompany.com</li>
              <li><strong>Exclude Specific Emails:</strong> Add individual addresses to the exclusion list</li>
              <li><strong>Exclude Patterns:</strong> Skip noreply@, support@, etc.</li>
            </ul>
            <p className="mt-2">Configure exclusions in <strong>Extension Popup → Settings → Exclusions</strong></p>
          </div>
        </section>

        {/* Section 3: HubSpot Setup */}
        <section id="hubspot-setup" className="border-t border-gray-200 pt-8">
          <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <span className="bg-orange-100 text-orange-600 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">3</span>
            HubSpot Integration
          </h3>
          <div className="mt-4 space-y-4">
            <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded-r-lg">
              <p className="text-orange-800 font-medium">Requires Pro or Business subscription</p>
            </div>

            <h4 className="font-semibold text-gray-900 mt-6">Connecting Your HubSpot Account</h4>
            <ol className="list-decimal ml-5 space-y-2">
              <li>Open the CRMSYNC popup and go to <strong>Settings</strong></li>
              <li>Click <strong>"Connect HubSpot"</strong></li>
              <li>Log in to your HubSpot account when prompted</li>
              <li>Grant CRMSYNC permission to access your contacts</li>
              <li>You'll see "HubSpot Connected ✓" when successful</li>
            </ol>

            <h4 className="font-semibold text-gray-900 mt-6">Syncing Contacts to HubSpot</h4>
            <ul className="list-disc ml-5 space-y-2">
              <li><strong>Manual Sync:</strong> Click the HubSpot button next to any contact</li>
              <li><strong>Bulk Sync:</strong> Select multiple contacts and click "Sync to HubSpot"</li>
              <li><strong>Auto-Sync (Business):</strong> New contacts sync automatically in the background</li>
            </ul>

            <h4 className="font-semibold text-gray-900 mt-6">Field Mapping</h4>
            <table className="w-full mt-4 text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="text-left p-2 rounded-tl-lg">CRMSYNC Field</th>
                  <th className="text-left p-2 rounded-tr-lg">HubSpot Property</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr><td className="p-2">Name</td><td className="p-2">firstname, lastname</td></tr>
                <tr><td className="p-2">Email</td><td className="p-2">email</td></tr>
                <tr><td className="p-2">Phone</td><td className="p-2">phone</td></tr>
                <tr><td className="p-2">Company</td><td className="p-2">company</td></tr>
                <tr><td className="p-2">Title</td><td className="p-2">jobtitle</td></tr>
              </tbody>
            </table>

            <h4 className="font-semibold text-gray-900 mt-6">Duplicate Handling</h4>
            <p>When syncing a contact that already exists in HubSpot:</p>
            <ul className="list-disc ml-5 space-y-2">
              <li>Existing contacts are matched by email address</li>
              <li>You can choose to <strong>update existing</strong> or <strong>skip duplicates</strong></li>
              <li>New fields are merged without overwriting existing data</li>
            </ul>
          </div>
        </section>

        {/* Section 4: Salesforce Setup */}
        <section id="salesforce-setup" className="border-t border-gray-200 pt-8">
          <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <span className="bg-blue-100 text-blue-600 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">4</span>
            Salesforce Integration
          </h3>
          <div className="mt-4 space-y-4">
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
              <p className="text-blue-800 font-medium">Requires Pro or Business subscription</p>
            </div>

            <h4 className="font-semibold text-gray-900 mt-6">Connecting Your Salesforce Account</h4>
            <ol className="list-decimal ml-5 space-y-2">
              <li>Open the CRMSYNC popup and go to <strong>Settings</strong></li>
              <li>Click <strong>"Connect Salesforce"</strong></li>
              <li>Log in to your Salesforce org</li>
              <li>Approve the OAuth request</li>
              <li>Select your default record type if prompted</li>
            </ol>

            <h4 className="font-semibold text-gray-900 mt-6">Creating Contacts vs Leads</h4>
            <p>You can configure whether contacts sync as:</p>
            <ul className="list-disc ml-5 space-y-2">
              <li><strong>Contacts:</strong> Standard Salesforce Contact records</li>
              <li><strong>Leads:</strong> New prospect records for your sales pipeline</li>
            </ul>
            <p className="mt-2">Configure this in <strong>Settings → Salesforce → Record Type</strong></p>

            <h4 className="font-semibold text-gray-900 mt-6">Account Association</h4>
            <p>When the company name is detected, CRMSYNC can:</p>
            <ul className="list-disc ml-5 space-y-2">
              <li>Find an existing Account by name and link the Contact</li>
              <li>Create a new Account if none exists</li>
              <li>Leave the Contact unassociated (your choice)</li>
            </ul>
          </div>
        </section>

        {/* Section 5: Contact Management */}
        <section id="contact-management" className="border-t border-gray-200 pt-8">
          <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <span className="bg-green-100 text-green-600 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">5</span>
            Contact Management
          </h3>
          <div className="mt-4 space-y-4">
            <h4 className="font-semibold text-gray-900">Viewing Your Contacts</h4>
            <p>Click the CRMSYNC popup to see all your saved contacts:</p>
            <ul className="list-disc ml-5 space-y-2">
              <li><strong>Contacts Tab:</strong> View, search, and manage all contacts</li>
              <li><strong>Search:</strong> Filter by name, email, company, or any field</li>
              <li><strong>Sort:</strong> Order by name, date added, or company</li>
            </ul>

            <h4 className="font-semibold text-gray-900 mt-6">Editing Contacts</h4>
            <p>Click on any contact to edit their information:</p>
            <ul className="list-disc ml-5 space-y-2">
              <li>Update name, email, phone, company, or title</li>
              <li>Add custom notes</li>
              <li>Changes sync across devices (Pro/Business)</li>
            </ul>

            <h4 className="font-semibold text-gray-900 mt-6">Bulk Actions</h4>
            <p>Select multiple contacts using checkboxes, then:</p>
            <ul className="list-disc ml-5 space-y-2">
              <li><strong>Bulk Delete:</strong> Remove multiple contacts at once</li>
              <li><strong>Bulk Export:</strong> Download selected contacts as CSV</li>
              <li><strong>Bulk Sync:</strong> Push all selected to your CRM</li>
            </ul>

            <h4 className="font-semibold text-gray-900 mt-6">Merge Duplicates</h4>
            <p>When saving a contact that already exists:</p>
            <ul className="list-disc ml-5 space-y-2">
              <li>A merge dialog shows both versions side-by-side</li>
              <li>Choose which fields to keep from each version</li>
              <li>Click "Merge" to combine into one contact</li>
            </ul>
          </div>
        </section>

        {/* Section 6: Inbox Sync */}
        <section id="inbox-sync" className="border-t border-gray-200 pt-8">
          <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <span className="bg-purple-100 text-purple-600 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">6</span>
            Inbox Sync (Pro/Business)
          </h3>
          <div className="mt-4 space-y-4">
            <p>Inbox Sync automatically processes your Gmail inbox to find contacts you may have missed.</p>

            <h4 className="font-semibold text-gray-900 mt-6">How It Works</h4>
            <ol className="list-decimal ml-5 space-y-2">
              <li>CRMSYNC scans your recent emails (last 30 days by default)</li>
              <li>Contacts are extracted from email headers and signatures</li>
              <li>New contacts are queued for your review</li>
              <li>Approve or dismiss each contact before adding</li>
            </ol>

            <h4 className="font-semibold text-gray-900 mt-6">Configuring Inbox Sync</h4>
            <ul className="list-disc ml-5 space-y-2">
              <li><strong>Sync Period:</strong> Choose 7, 14, 30, or 90 days</li>
              <li><strong>Labels/Folders:</strong> Only sync from specific Gmail labels</li>
              <li><strong>Exclusions:</strong> Skip newsletters, notifications, etc.</li>
            </ul>
          </div>
        </section>

        {/* Section 7: Export Options */}
        <section id="export-options" className="border-t border-gray-200 pt-8">
          <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <span className="bg-teal-100 text-teal-600 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">7</span>
            Export Options
          </h3>
          <div className="mt-4 space-y-4">
            <h4 className="font-semibold text-gray-900">CSV Export</h4>
            <p>Download your contacts as a CSV file:</p>
            <ol className="list-decimal ml-5 space-y-2">
              <li>Click the <strong>Export</strong> button in the popup (or press <code className="bg-gray-100 px-2 py-1 rounded">Ctrl/Cmd + E</code>)</li>
              <li>Choose which contacts to include (all or selected)</li>
              <li>Select fields to export</li>
              <li>Download the CSV file</li>
            </ol>

            <h4 className="font-semibold text-gray-900 mt-6">CSV Format</h4>
            <p>The exported CSV includes these columns:</p>
            <ul className="list-disc ml-5 space-y-1">
              <li>Name, First Name, Last Name</li>
              <li>Email</li>
              <li>Phone</li>
              <li>Company</li>
              <li>Title</li>
              <li>Notes</li>
              <li>Date Added</li>
              <li>Source (email subject)</li>
            </ul>
          </div>
        </section>

        {/* Section 8: Troubleshooting */}
        <section id="troubleshooting" className="border-t border-gray-200 pt-8">
          <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <span className="bg-red-100 text-red-600 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">8</span>
            Troubleshooting
          </h3>
          <div className="mt-4 space-y-4">
            <h4 className="font-semibold text-gray-900">Contact Not Detected</h4>
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <p><strong>Problem:</strong> A contact isn't appearing in the sidebar</p>
              <p><strong>Solutions:</strong></p>
              <ul className="list-disc ml-5 space-y-1">
                <li>Refresh the Gmail page</li>
                <li>Make sure the email contains a valid email address</li>
                <li>Check if the domain is in your exclusion list</li>
                <li>The email may be from a generic address (noreply@, etc.)</li>
              </ul>
            </div>

            <h4 className="font-semibold text-gray-900 mt-6">Phone Number Not Extracted</h4>
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <p><strong>Problem:</strong> Phone number in signature not detected</p>
              <p><strong>Solutions:</strong></p>
              <ul className="list-disc ml-5 space-y-1">
                <li>Phone must be in a common format (e.g., +1 555-123-4567)</li>
                <li>Numbers in images cannot be extracted</li>
                <li>Try scrolling down to fully load the email signature</li>
              </ul>
            </div>

            <h4 className="font-semibold text-gray-900 mt-6">CRM Sync Failed</h4>
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <p><strong>Problem:</strong> Contact won't sync to HubSpot/Salesforce</p>
              <p><strong>Solutions:</strong></p>
              <ul className="list-disc ml-5 space-y-1">
                <li>Check that your CRM is still connected in Settings</li>
                <li>Reconnect your CRM by clicking "Disconnect" then "Connect" again</li>
                <li>Ensure the contact has a valid email address</li>
                <li>Check your CRM for API limits or permission issues</li>
              </ul>
            </div>

            <h4 className="font-semibold text-gray-900 mt-6">"Contact Limit Reached"</h4>
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <p><strong>Problem:</strong> You've hit the free tier limit</p>
              <p><strong>Solutions:</strong></p>
              <ul className="list-disc ml-5 space-y-1">
                <li>Free accounts are limited to 50 contacts/month</li>
                <li>Upgrade to Pro for unlimited contacts</li>
                <li>Your limit resets on the 1st of each month</li>
              </ul>
            </div>

            <h4 className="font-semibold text-gray-900 mt-6">Extension Not Working</h4>
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <p><strong>Problem:</strong> CRMSYNC isn't working at all</p>
              <p><strong>Solutions:</strong></p>
              <ul className="list-disc ml-5 space-y-1">
                <li>Make sure you're on mail.google.com (not inbox.google.com)</li>
                <li>Disable other Gmail extensions that might conflict</li>
                <li>Clear browser cache and reload</li>
                <li>Try disabling and re-enabling the extension</li>
                <li>Reinstall the extension if issues persist</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Section 9: FAQ */}
        <section id="faq" className="border-t border-gray-200 pt-8">
          <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <span className="bg-yellow-100 text-yellow-600 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">9</span>
            Frequently Asked Questions
          </h3>
          <div className="mt-4 space-y-4">
            <div className="border-b border-gray-200 pb-4">
              <h4 className="font-semibold text-gray-900">Is my email content secure?</h4>
              <p className="mt-2">Yes! Email content is processed locally in your browser. We never see, store, or transmit the content of your emails. Only the contact information you choose to save is stored.</p>
            </div>

            <div className="border-b border-gray-200 pb-4">
              <h4 className="font-semibold text-gray-900">Can I use CRMSYNC with multiple Gmail accounts?</h4>
              <p className="mt-2">Yes! CRMSYNC works with whichever Gmail account is currently active in your browser. Your saved contacts are linked to your CRMSYNC account, not your Gmail account.</p>
            </div>

            <div className="border-b border-gray-200 pb-4">
              <h4 className="font-semibold text-gray-900">How do I exclude my company's emails?</h4>
              <p className="mt-2">Go to Settings → Exclusions and add your company domain (e.g., @yourcompany.com). All emails from that domain will be ignored.</p>
            </div>

            <div className="border-b border-gray-200 pb-4">
              <h4 className="font-semibold text-gray-900">Can I sync to both HubSpot and Salesforce?</h4>
              <p className="mt-2">Yes! Pro and Business users can connect multiple CRMs. You choose which CRM to sync each contact to, or sync to all connected CRMs at once.</p>
            </div>

            <div className="border-b border-gray-200 pb-4">
              <h4 className="font-semibold text-gray-900">What happens if I cancel my subscription?</h4>
              <p className="mt-2">Your contacts remain accessible. You'll be downgraded to the Free tier (50 contacts/month limit). Existing contacts are preserved but you won't be able to add new ones until you upgrade or the next month begins.</p>
            </div>

            <div className="border-b border-gray-200 pb-4">
              <h4 className="font-semibold text-gray-900">Is there a mobile app?</h4>
              <p className="mt-2">CRMSYNC is currently a Chrome extension for desktop. A mobile companion app is on our roadmap for future development.</p>
            </div>

            <div className="border-b border-gray-200 pb-4">
              <h4 className="font-semibold text-gray-900">Can I import existing contacts?</h4>
              <p className="mt-2">Currently, CRMSYNC focuses on capturing new contacts from emails. CSV import functionality is planned for a future release.</p>
            </div>
          </div>
        </section>

        {/* Section 10: Keyboard Shortcuts */}
        <section id="keyboard-shortcuts" className="border-t border-gray-200 pt-8">
          <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <span className="bg-gray-100 text-gray-600 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">10</span>
            Keyboard Shortcuts
          </h3>
          <div className="mt-4">
            <table className="w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="text-left p-3 rounded-tl-lg">Shortcut</th>
                  <th className="text-left p-3 rounded-tr-lg">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr>
                  <td className="p-3"><code className="bg-gray-100 px-2 py-1 rounded">Ctrl/Cmd + F</code></td>
                  <td className="p-3">Focus search box</td>
                </tr>
                <tr>
                  <td className="p-3"><code className="bg-gray-100 px-2 py-1 rounded">Escape</code></td>
                  <td className="p-3">Clear search / Close modal</td>
                </tr>
                <tr>
                  <td className="p-3"><code className="bg-gray-100 px-2 py-1 rounded">Ctrl/Cmd + E</code></td>
                  <td className="p-3">Export contacts to CSV</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Support CTA */}
        <section className="border-t border-gray-200 pt-8">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-xl text-center">
            <h3 className="text-xl font-bold">Still Need Help?</h3>
            <p className="mt-2 text-blue-100">Our support team is here to assist you.</p>
            <div className="mt-4 flex flex-col sm:flex-row gap-4 justify-center">
              <a href="mailto:support@crm-sync.net" className="inline-block bg-white text-blue-600 font-semibold px-6 py-2 rounded-lg hover:bg-blue-50 transition">
                Email Support
              </a>
              <a href="#/faq" className="inline-block border border-white text-white font-semibold px-6 py-2 rounded-lg hover:bg-white/10 transition">
                View All FAQs
              </a>
            </div>
          </div>
        </section>
      </div>
    )
  },
  about: {
    title: "About CRMSYNC",
    subtitle: "Building the future of relationship management",
    content: (
      <div className="space-y-8 text-gray-600">
        {/* Mission Statement */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-8 rounded-xl">
          <h3 className="text-2xl font-bold">Our Mission</h3>
          <p className="mt-3 text-lg text-blue-100">
            To eliminate busywork so professionals can focus on what matters most: building meaningful relationships.
          </p>
        </div>

        {/* Story */}
        <section>
          <h3 className="text-xl font-bold text-gray-900 mb-4">Our Story</h3>
          <div className="space-y-4">
            <p>
              CRMSYNC was born out of frustration. As salespeople ourselves, we spent countless hours copying contact information from emails into our CRM. Name, email, phone, company, title — over and over again.
            </p>
            <p>
              We calculated that sales professionals spend up to <strong>20% of their time on data entry</strong>. That's one full day every week not spent talking to customers, closing deals, or building relationships.
            </p>
            <p>
              We built CRMSYNC to solve this problem. Our Chrome extension lives right inside Gmail, automatically extracting contact information from every email you read and syncing it to your CRM with a single click.
            </p>
            <p>
              Founded in 2024, we now help thousands of sales professionals, recruiters, and business owners save hours every week.
            </p>
          </div>
        </section>

        {/* Stats */}
        <section>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 rounded-xl p-6 text-center">
              <div className="text-3xl font-bold text-blue-600">10K+</div>
              <div className="text-sm text-gray-500 mt-1">Users</div>
            </div>
            <div className="bg-gray-50 rounded-xl p-6 text-center">
              <div className="text-3xl font-bold text-blue-600">500K+</div>
              <div className="text-sm text-gray-500 mt-1">Contacts Synced</div>
            </div>
            <div className="bg-gray-50 rounded-xl p-6 text-center">
              <div className="text-3xl font-bold text-blue-600">5hrs</div>
              <div className="text-sm text-gray-500 mt-1">Saved Per Week</div>
            </div>
            <div className="bg-gray-50 rounded-xl p-6 text-center">
              <div className="text-3xl font-bold text-blue-600">4.8★</div>
              <div className="text-sm text-gray-500 mt-1">User Rating</div>
            </div>
          </div>
        </section>

        {/* Values */}
        <section>
          <h3 className="text-xl font-bold text-gray-900 mb-4">Our Values</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-2xl">🔒</div>
              <div>
                <h4 className="font-semibold text-gray-900">Privacy First</h4>
                <p className="text-sm mt-1">Your data belongs to you. We process emails locally and never sell your information.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-2xl">⚡</div>
              <div>
                <h4 className="font-semibold text-gray-900">Simplicity</h4>
                <p className="text-sm mt-1">Complex tools don't get used. We build simple, focused solutions that just work.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center text-2xl">🤝</div>
              <div>
                <h4 className="font-semibold text-gray-900">User-Centric</h4>
                <p className="text-sm mt-1">Every feature we build starts with a real user problem. We listen before we code.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center text-2xl">🚀</div>
              <div>
                <h4 className="font-semibold text-gray-900">Continuous Improvement</h4>
                <p className="text-sm mt-1">We ship updates weekly and constantly improve based on user feedback.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Integrations */}
        <section>
          <h3 className="text-xl font-bold text-gray-900 mb-4">Trusted Integrations</h3>
          <p className="mb-4">CRMSYNC integrates with the tools you already use:</p>
          <div className="flex flex-wrap gap-4">
            <div className="bg-gray-50 px-6 py-3 rounded-lg font-medium text-gray-700">Gmail</div>
            <div className="bg-gray-50 px-6 py-3 rounded-lg font-medium text-gray-700">HubSpot</div>
            <div className="bg-gray-50 px-6 py-3 rounded-lg font-medium text-gray-700">Salesforce</div>
            <div className="bg-gray-50 px-6 py-3 rounded-lg font-medium text-gray-700">Stripe</div>
            <div className="bg-gray-50 px-6 py-3 rounded-lg font-medium text-gray-700">Google OAuth</div>
          </div>
        </section>

        {/* Contact */}
        <section>
          <h3 className="text-xl font-bold text-gray-900 mb-4">Get in Touch</h3>
          <div className="bg-gray-50 rounded-xl p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="font-medium text-gray-900">General Inquiries</p>
                <a href="mailto:hello@crm-sync.net" className="text-blue-600 hover:underline">hello@crm-sync.net</a>
              </div>
              <div>
                <p className="font-medium text-gray-900">Support</p>
                <a href="mailto:support@crm-sync.net" className="text-blue-600 hover:underline">support@crm-sync.net</a>
              </div>
              <div>
                <p className="font-medium text-gray-900">Press</p>
                <a href="mailto:press@crm-sync.net" className="text-blue-600 hover:underline">press@crm-sync.net</a>
              </div>
              <div>
                <p className="font-medium text-gray-900">Partnerships</p>
                <a href="mailto:partners@crm-sync.net" className="text-blue-600 hover:underline">partners@crm-sync.net</a>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-8 rounded-xl text-center">
          <h3 className="text-xl font-bold">Ready to save time?</h3>
          <p className="mt-2 text-blue-100">Join thousands of professionals who've eliminated manual data entry.</p>
          <div className="mt-6 flex flex-col sm:flex-row gap-4 justify-center">
            <a href="#/register" className="inline-block bg-white text-blue-600 font-semibold px-8 py-3 rounded-lg hover:bg-blue-50 transition">
              Get Started Free
            </a>
            <a href="#/docs" className="inline-block border border-white text-white font-semibold px-8 py-3 rounded-lg hover:bg-white/10 transition">
              Read the Docs
            </a>
          </div>
        </div>
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
  },
  security: {
    title: "Security",
    subtitle: "How we protect your data",
    content: (
      <div className="space-y-8 text-gray-600">
        {/* Overview */}
        <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-r-lg">
          <p className="text-green-800 font-medium">
            Your security is our top priority. CRMSYNC is built with enterprise-grade security practices to keep your data safe.
          </p>
        </div>

        {/* Security Highlights */}
        <section>
          <h3 className="text-xl font-bold text-gray-900 mb-4">🔐 Security Highlights</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                <span className="text-green-500">✓</span> Local Processing
              </h4>
              <p className="text-sm mt-2">Email content is processed entirely in your browser. We never see or store your email content.</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                <span className="text-green-500">✓</span> Encrypted Storage
              </h4>
              <p className="text-sm mt-2">All data is encrypted at rest using AES-256 and in transit using TLS 1.3.</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                <span className="text-green-500">✓</span> Secure Authentication
              </h4>
              <p className="text-sm mt-2">Passwords are hashed with bcrypt. JWT tokens expire quickly with secure refresh.</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                <span className="text-green-500">✓</span> Minimal Permissions
              </h4>
              <p className="text-sm mt-2">We request only the permissions necessary to function. No broad access to your data.</p>
            </div>
          </div>
        </section>

        {/* Data Protection */}
        <section>
          <h3 className="text-xl font-bold text-gray-900 mb-4">🛡️ Data Protection</h3>
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-900">What We Protect</h4>
            <ul className="list-disc ml-5 space-y-2">
              <li><strong>Account Credentials:</strong> Passwords are never stored in plain text. We use bcrypt with salt rounds for secure hashing.</li>
              <li><strong>Contact Data:</strong> Your contacts are encrypted at rest in our database using industry-standard encryption.</li>
              <li><strong>API Keys:</strong> CRM integration tokens are encrypted and stored securely, never exposed to client-side code.</li>
              <li><strong>Session Data:</strong> JWT tokens have short expiration times (15 minutes) with secure refresh token rotation.</li>
            </ul>

            <h4 className="font-semibold text-gray-900 mt-6">What We Never Store</h4>
            <ul className="list-disc ml-5 space-y-2">
              <li>Email message content or body text</li>
              <li>Email attachments</li>
              <li>Your Gmail password or credentials</li>
              <li>Credit card numbers (handled by Stripe)</li>
            </ul>
          </div>
        </section>

        {/* Infrastructure Security */}
        <section>
          <h3 className="text-xl font-bold text-gray-900 mb-4">🏗️ Infrastructure Security</h3>
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-900">Secure Hosting</h4>
              <ul className="list-disc ml-5 mt-2 space-y-1 text-sm">
                <li>Hosted on enterprise-grade cloud infrastructure</li>
                <li>Regular security patches and updates</li>
                <li>DDoS protection and rate limiting</li>
                <li>Automated backups with encryption</li>
              </ul>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-900">API Security</h4>
              <ul className="list-disc ml-5 mt-2 space-y-1 text-sm">
                <li>All API endpoints require authentication</li>
                <li>Rate limiting prevents abuse</li>
                <li>Input validation and sanitization</li>
                <li>CORS restrictions to prevent unauthorized access</li>
              </ul>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-900">Extension Security</h4>
              <ul className="list-disc ml-5 mt-2 space-y-1 text-sm">
                <li>Content Security Policy (CSP) prevents XSS attacks</li>
                <li>All user input is sanitized before display</li>
                <li>No remote code execution or eval()</li>
                <li>Minimal host permissions (only mail.google.com)</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Third-Party Integrations */}
        <section>
          <h3 className="text-xl font-bold text-gray-900 mb-4">🔗 Third-Party Security</h3>
          <div className="space-y-4">
            <p>We carefully vet all third-party services we integrate with:</p>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="text-left p-3">Service</th>
                    <th className="text-left p-3">Purpose</th>
                    <th className="text-left p-3">Security</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <tr>
                    <td className="p-3 font-medium">Stripe</td>
                    <td className="p-3">Payment processing</td>
                    <td className="p-3">PCI-DSS Level 1 certified</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-medium">HubSpot</td>
                    <td className="p-3">CRM sync</td>
                    <td className="p-3">SOC 2 Type II certified</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-medium">Salesforce</td>
                    <td className="p-3">CRM sync</td>
                    <td className="p-3">ISO 27001 certified</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-medium">Google OAuth</td>
                    <td className="p-3">Authentication</td>
                    <td className="p-3">Industry-leading security</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Compliance */}
        <section>
          <h3 className="text-xl font-bold text-gray-900 mb-4">📋 Compliance</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-gray-200 rounded-xl p-4">
              <h4 className="font-semibold text-gray-900">GDPR Compliant</h4>
              <p className="text-sm mt-2">We provide data export, deletion, and full transparency for EU users.</p>
            </div>
            <div className="border border-gray-200 rounded-xl p-4">
              <h4 className="font-semibold text-gray-900">CCPA Compliant</h4>
              <p className="text-sm mt-2">California residents can request access and deletion of their data.</p>
            </div>
            <div className="border border-gray-200 rounded-xl p-4">
              <h4 className="font-semibold text-gray-900">Chrome Web Store</h4>
              <p className="text-sm mt-2">We follow all Chrome Web Store security policies and best practices.</p>
            </div>
            <div className="border border-gray-200 rounded-xl p-4">
              <h4 className="font-semibold text-gray-900">Regular Audits</h4>
              <p className="text-sm mt-2">We conduct regular security reviews and update dependencies.</p>
            </div>
          </div>
        </section>

        {/* Your Controls */}
        <section>
          <h3 className="text-xl font-bold text-gray-900 mb-4">🎛️ Your Security Controls</h3>
          <div className="space-y-4">
            <p>You have full control over your data:</p>
            <ul className="list-disc ml-5 space-y-2">
              <li><strong>Export Data:</strong> Download all your contacts as CSV anytime</li>
              <li><strong>Delete Data:</strong> Permanently delete individual contacts or your entire account</li>
              <li><strong>Disconnect CRMs:</strong> Revoke access to connected CRM platforms anytime</li>
              <li><strong>Session Management:</strong> Log out from all devices via account settings</li>
              <li><strong>Exclusions:</strong> Prevent specific domains or emails from being captured</li>
            </ul>
          </div>
        </section>

        {/* Reporting */}
        <section>
          <h3 className="text-xl font-bold text-gray-900 mb-4">🚨 Security Reporting</h3>
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
            <h4 className="font-semibold text-gray-900">Found a Security Issue?</h4>
            <p className="mt-2">We take security vulnerabilities seriously. If you discover a security issue, please report it responsibly:</p>
            <div className="mt-4">
              <a href="mailto:security@crm-sync.net" className="inline-block bg-blue-600 text-white font-semibold px-6 py-2 rounded-lg hover:bg-blue-700 transition">
                Report to security@crm-sync.net
              </a>
            </div>
            <p className="text-sm mt-4 text-blue-700">We aim to respond within 24 hours and will work with you to address any valid security concerns.</p>
          </div>
        </section>

        {/* Last Updated */}
        <div className="text-center text-sm text-gray-500 pt-4 border-t border-gray-200">
          Last updated: December 2024
        </div>
      </div>
    )
  },
  // Integration Pages
  'integration-hubspot': {
    title: "HubSpot Integration Guide",
    subtitle: "Connect CRMSYNC to HubSpot and sync contacts automatically",
    content: (
      <div className="space-y-8 text-gray-600">
        {/* Hero */}
        <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white p-6 rounded-xl">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 p-3 rounded-lg">
              <span className="text-3xl">🟠</span>
            </div>
            <div>
              <h3 className="text-xl font-bold">HubSpot + CRMSYNC</h3>
              <p className="text-orange-100">Automatically sync Gmail contacts to your HubSpot CRM</p>
            </div>
          </div>
        </div>

        {/* Benefits */}
        <section>
          <h3 className="text-xl font-bold text-gray-900 mb-4">Why Connect HubSpot?</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border border-gray-200 rounded-xl p-4 text-center">
              <div className="text-3xl mb-2">⏱️</div>
              <h4 className="font-semibold text-gray-900">Save Time</h4>
              <p className="text-sm mt-1">No more manual data entry. Contacts sync with one click.</p>
            </div>
            <div className="border border-gray-200 rounded-xl p-4 text-center">
              <div className="text-3xl mb-2">🔄</div>
              <h4 className="font-semibold text-gray-900">Stay Updated</h4>
              <p className="text-sm mt-1">Contact info updates automatically when details change.</p>
            </div>
            <div className="border border-gray-200 rounded-xl p-4 text-center">
              <div className="text-3xl mb-2">✅</div>
              <h4 className="font-semibold text-gray-900">No Duplicates</h4>
              <p className="text-sm mt-1">Smart matching prevents duplicate contacts.</p>
            </div>
          </div>
        </section>

        {/* Setup Steps */}
        <section>
          <h3 className="text-xl font-bold text-gray-900 mb-4">Setup Guide</h3>
          
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center font-bold">1</div>
              <div>
                <h4 className="font-semibold text-gray-900">Open CRMSYNC Settings</h4>
                <p className="mt-1">Click the CRMSYNC icon in your Chrome toolbar, then navigate to the Settings tab.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center font-bold">2</div>
              <div>
                <h4 className="font-semibold text-gray-900">Click "Connect HubSpot"</h4>
                <p className="mt-1">In the CRM Integrations section, click the orange "Connect HubSpot" button.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center font-bold">3</div>
              <div>
                <h4 className="font-semibold text-gray-900">Authorize Access</h4>
                <p className="mt-1">Log in to your HubSpot account and grant CRMSYNC permission to manage contacts.</p>
                <div className="mt-2 bg-yellow-50 border-l-4 border-yellow-500 p-3 rounded-r-lg text-sm">
                  <p className="text-yellow-800">You'll need to be a HubSpot admin or have permission to install integrations.</p>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center font-bold">4</div>
              <div>
                <h4 className="font-semibold text-gray-900">Start Syncing!</h4>
                <p className="mt-1">You'll see "HubSpot Connected ✓" in your settings. Now you can sync contacts with one click.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Field Mapping */}
        <section>
          <h3 className="text-xl font-bold text-gray-900 mb-4">Field Mapping</h3>
          <p className="mb-4">CRMSYNC automatically maps contact fields to HubSpot properties:</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-orange-50">
                <tr>
                  <th className="text-left p-3">CRMSYNC Field</th>
                  <th className="text-left p-3">HubSpot Property</th>
                  <th className="text-left p-3">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr><td className="p-3">First Name</td><td className="p-3">firstname</td><td className="p-3">Parsed from full name</td></tr>
                <tr><td className="p-3">Last Name</td><td className="p-3">lastname</td><td className="p-3">Parsed from full name</td></tr>
                <tr><td className="p-3">Email</td><td className="p-3">email</td><td className="p-3">Primary identifier</td></tr>
                <tr><td className="p-3">Phone</td><td className="p-3">phone</td><td className="p-3">From signature</td></tr>
                <tr><td className="p-3">Company</td><td className="p-3">company</td><td className="p-3">From signature/domain</td></tr>
                <tr><td className="p-3">Job Title</td><td className="p-3">jobtitle</td><td className="p-3">From signature</td></tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Syncing Options */}
        <section>
          <h3 className="text-xl font-bold text-gray-900 mb-4">Syncing Options</h3>
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-900">Manual Sync (All Plans)</h4>
              <p className="text-sm mt-1">Click the HubSpot icon next to any contact to sync it immediately.</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-900">Bulk Sync (Pro/Business)</h4>
              <p className="text-sm mt-1">Select multiple contacts and click "Sync to HubSpot" to sync them all at once.</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-900">Auto-Sync (Business)</h4>
              <p className="text-sm mt-1">New contacts are automatically synced to HubSpot in the background.</p>
            </div>
          </div>
        </section>

        {/* Troubleshooting */}
        <section>
          <h3 className="text-xl font-bold text-gray-900 mb-4">Troubleshooting</h3>
          <div className="space-y-4">
            <div className="border-l-4 border-red-500 pl-4">
              <h4 className="font-semibold text-gray-900">"Connection Failed" Error</h4>
              <p className="text-sm mt-1">Try disconnecting and reconnecting HubSpot. Make sure pop-ups aren't blocked.</p>
            </div>
            <div className="border-l-4 border-red-500 pl-4">
              <h4 className="font-semibold text-gray-900">"Permission Denied" Error</h4>
              <p className="text-sm mt-1">You need admin access in HubSpot, or ask your admin to approve the integration.</p>
            </div>
            <div className="border-l-4 border-red-500 pl-4">
              <h4 className="font-semibold text-gray-900">Contact Not Appearing in HubSpot</h4>
              <p className="text-sm mt-1">Check that the contact has a valid email. HubSpot requires email as a unique identifier.</p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-6 text-center">
          <h3 className="text-lg font-bold text-gray-900">Ready to Connect?</h3>
          <p className="mt-2 text-gray-600">Start syncing your Gmail contacts to HubSpot today.</p>
          <a href="#/pricing" className="inline-block mt-4 bg-orange-500 text-white font-semibold px-6 py-2 rounded-lg hover:bg-orange-600 transition">
            Get Started
          </a>
        </div>
      </div>
    )
  },
  'integration-salesforce': {
    title: "Salesforce Integration Guide",
    subtitle: "Connect CRMSYNC to Salesforce and streamline your workflow",
    content: (
      <div className="space-y-8 text-gray-600">
        {/* Hero */}
        <div className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white p-6 rounded-xl">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 p-3 rounded-lg">
              <span className="text-3xl">☁️</span>
            </div>
            <div>
              <h3 className="text-xl font-bold">Salesforce + CRMSYNC</h3>
              <p className="text-blue-100">Automatically sync Gmail contacts to your Salesforce org</p>
            </div>
          </div>
        </div>

        {/* Benefits */}
        <section>
          <h3 className="text-xl font-bold text-gray-900 mb-4">Why Connect Salesforce?</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border border-gray-200 rounded-xl p-4 text-center">
              <div className="text-3xl mb-2">🎯</div>
              <h4 className="font-semibold text-gray-900">Accurate Data</h4>
              <p className="text-sm mt-1">Contact info captured directly from email signatures.</p>
            </div>
            <div className="border border-gray-200 rounded-xl p-4 text-center">
              <div className="text-3xl mb-2">🔗</div>
              <h4 className="font-semibold text-gray-900">Account Linking</h4>
              <p className="text-sm mt-1">Contacts automatically linked to existing Accounts.</p>
            </div>
            <div className="border border-gray-200 rounded-xl p-4 text-center">
              <div className="text-3xl mb-2">📊</div>
              <h4 className="font-semibold text-gray-900">Clean Pipeline</h4>
              <p className="text-sm mt-1">Create Leads or Contacts based on your workflow.</p>
            </div>
          </div>
        </section>

        {/* Setup Steps */}
        <section>
          <h3 className="text-xl font-bold text-gray-900 mb-4">Setup Guide</h3>
          
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">1</div>
              <div>
                <h4 className="font-semibold text-gray-900">Open CRMSYNC Settings</h4>
                <p className="mt-1">Click the CRMSYNC icon, then go to the Settings tab.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">2</div>
              <div>
                <h4 className="font-semibold text-gray-900">Click "Connect Salesforce"</h4>
                <p className="mt-1">In the CRM Integrations section, click the blue "Connect Salesforce" button.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">3</div>
              <div>
                <h4 className="font-semibold text-gray-900">Log in to Salesforce</h4>
                <p className="mt-1">Enter your Salesforce credentials and authorize CRMSYNC.</p>
                <div className="mt-2 bg-blue-50 border-l-4 border-blue-500 p-3 rounded-r-lg text-sm">
                  <p className="text-blue-800">Works with Salesforce Sales Cloud, Service Cloud, and Platform editions.</p>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">4</div>
              <div>
                <h4 className="font-semibold text-gray-900">Choose Record Type</h4>
                <p className="mt-1">Select whether to create Contacts or Leads when syncing.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">5</div>
              <div>
                <h4 className="font-semibold text-gray-900">Start Syncing!</h4>
                <p className="mt-1">You're connected! Click the Salesforce icon on any contact to sync.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Contact vs Lead */}
        <section>
          <h3 className="text-xl font-bold text-gray-900 mb-4">Contacts vs Leads</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-900">Create as Contact</h4>
              <ul className="list-disc ml-5 mt-2 text-sm space-y-1">
                <li>Best for known, qualified contacts</li>
                <li>Links to existing Account records</li>
                <li>Immediate access to contact record features</li>
              </ul>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-900">Create as Lead</h4>
              <ul className="list-disc ml-5 mt-2 text-sm space-y-1">
                <li>Best for new prospects</li>
                <li>Goes through your lead qualification process</li>
                <li>Convert to Contact/Account when qualified</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Field Mapping */}
        <section>
          <h3 className="text-xl font-bold text-gray-900 mb-4">Field Mapping</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-blue-50">
                <tr>
                  <th className="text-left p-3">CRMSYNC</th>
                  <th className="text-left p-3">Salesforce Contact</th>
                  <th className="text-left p-3">Salesforce Lead</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr><td className="p-3">First Name</td><td className="p-3">FirstName</td><td className="p-3">FirstName</td></tr>
                <tr><td className="p-3">Last Name</td><td className="p-3">LastName</td><td className="p-3">LastName</td></tr>
                <tr><td className="p-3">Email</td><td className="p-3">Email</td><td className="p-3">Email</td></tr>
                <tr><td className="p-3">Phone</td><td className="p-3">Phone</td><td className="p-3">Phone</td></tr>
                <tr><td className="p-3">Company</td><td className="p-3">Account.Name</td><td className="p-3">Company</td></tr>
                <tr><td className="p-3">Title</td><td className="p-3">Title</td><td className="p-3">Title</td></tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* CTA */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 text-center">
          <h3 className="text-lg font-bold text-gray-900">Ready to Connect?</h3>
          <p className="mt-2 text-gray-600">Start syncing your Gmail contacts to Salesforce today.</p>
          <a href="#/pricing" className="inline-block mt-4 bg-blue-500 text-white font-semibold px-6 py-2 rounded-lg hover:bg-blue-600 transition">
            Get Started
          </a>
        </div>
      </div>
    )
  },
  // Support Page
  support: {
    title: "Support",
    subtitle: "We're here to help you succeed",
    content: (
      <div className="space-y-8 text-gray-600">
        {/* Quick Help */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a href="#/docs" className="block border border-gray-200 rounded-xl p-6 hover:border-blue-500 hover:shadow-md transition text-center">
            <div className="text-3xl mb-3">📖</div>
            <h3 className="font-semibold text-gray-900">Documentation</h3>
            <p className="text-sm mt-2">Step-by-step guides and tutorials</p>
          </a>
          <a href="#/docs#faq" className="block border border-gray-200 rounded-xl p-6 hover:border-blue-500 hover:shadow-md transition text-center">
            <div className="text-3xl mb-3">❓</div>
            <h3 className="font-semibold text-gray-900">FAQ</h3>
            <p className="text-sm mt-2">Answers to common questions</p>
          </a>
          <a href="#/docs#troubleshooting" className="block border border-gray-200 rounded-xl p-6 hover:border-blue-500 hover:shadow-md transition text-center">
            <div className="text-3xl mb-3">🔧</div>
            <h3 className="font-semibold text-gray-900">Troubleshooting</h3>
            <p className="text-sm mt-2">Fix common issues quickly</p>
          </a>
        </div>

        {/* Contact Options */}
        <section>
          <h3 className="text-xl font-bold text-gray-900 mb-4">Contact Us</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50 rounded-xl p-6">
              <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                <span>📧</span> Email Support
              </h4>
              <p className="mt-2 text-sm">For general questions and help with your account.</p>
              <a href="mailto:support@crm-sync.net" className="inline-block mt-4 text-blue-600 font-medium hover:underline">
                support@crm-sync.net
              </a>
              <p className="text-xs text-gray-500 mt-2">Response time: Within 24 hours</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-6">
              <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                <span>🔒</span> Security Issues
              </h4>
              <p className="mt-2 text-sm">Report security vulnerabilities responsibly.</p>
              <a href="mailto:security@crm-sync.net" className="inline-block mt-4 text-blue-600 font-medium hover:underline">
                security@crm-sync.net
              </a>
              <p className="text-xs text-gray-500 mt-2">Response time: Within 24 hours</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-6">
              <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                <span>💼</span> Sales & Enterprise
              </h4>
              <p className="mt-2 text-sm">Team plans, custom integrations, and volume pricing.</p>
              <a href="mailto:sales@crm-sync.net" className="inline-block mt-4 text-blue-600 font-medium hover:underline">
                sales@crm-sync.net
              </a>
              <p className="text-xs text-gray-500 mt-2">Response time: Within 48 hours</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-6">
              <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                <span>💳</span> Billing
              </h4>
              <p className="mt-2 text-sm">Questions about invoices, refunds, or subscriptions.</p>
              <a href="mailto:billing@crm-sync.net" className="inline-block mt-4 text-blue-600 font-medium hover:underline">
                billing@crm-sync.net
              </a>
              <p className="text-xs text-gray-500 mt-2">Response time: Within 24 hours</p>
            </div>
          </div>
        </section>

        {/* Priority Support */}
        <section>
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold">Priority Support</h3>
                <p className="mt-1 text-purple-100">Pro and Business subscribers get faster response times and dedicated support.</p>
              </div>
              <a href="#/pricing" className="inline-block bg-white text-purple-600 font-semibold px-6 py-2 rounded-lg hover:bg-purple-50 transition text-center">
                Upgrade Now
              </a>
            </div>
          </div>
        </section>

        {/* Common Issues */}
        <section>
          <h3 className="text-xl font-bold text-gray-900 mb-4">Common Issues</h3>
          <div className="space-y-3">
            <details className="border border-gray-200 rounded-lg">
              <summary className="p-4 cursor-pointer font-medium text-gray-900 hover:bg-gray-50">
                How do I reset my password?
              </summary>
              <div className="p-4 pt-0 text-sm">
                Click "Forgot Password" on the login page, enter your email, and follow the instructions in the reset email.
              </div>
            </details>
            <details className="border border-gray-200 rounded-lg">
              <summary className="p-4 cursor-pointer font-medium text-gray-900 hover:bg-gray-50">
                How do I cancel my subscription?
              </summary>
              <div className="p-4 pt-0 text-sm">
                Go to Account Settings → Subscription → Cancel Plan. Your access continues until the end of the billing period.
              </div>
            </details>
            <details className="border border-gray-200 rounded-lg">
              <summary className="p-4 cursor-pointer font-medium text-gray-900 hover:bg-gray-50">
                How do I export my contacts?
              </summary>
              <div className="p-4 pt-0 text-sm">
                Open the CRMSYNC popup, go to the Contacts tab, and click the Export button (or press Ctrl/Cmd + E).
              </div>
            </details>
            <details className="border border-gray-200 rounded-lg">
              <summary className="p-4 cursor-pointer font-medium text-gray-900 hover:bg-gray-50">
                How do I delete my account?
              </summary>
              <div className="p-4 pt-0 text-sm">
                Email support@crm-sync.net with your request. We'll verify your identity and process the deletion within 48 hours.
              </div>
            </details>
          </div>
        </section>

        {/* Status */}
        <section>
          <h3 className="text-xl font-bold text-gray-900 mb-4">System Status</h3>
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span className="font-medium text-green-800">All systems operational</span>
          </div>
        </section>
      </div>
    )
  },
  // Comparison Pages
  'vs-manual': {
    title: "CRMSYNC vs Manual Data Entry",
    subtitle: "Why automate your contact management?",
    content: (
      <div className="space-y-8 text-gray-600">
        {/* Hero */}
        <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white p-6 rounded-xl">
          <h3 className="text-xl font-bold">Stop Wasting Time on Data Entry</h3>
          <p className="mt-2 text-red-100">Sales reps spend 5+ hours per week manually entering contacts. CRMSYNC eliminates this entirely.</p>
        </div>

        {/* Comparison Table */}
        <section>
          <h3 className="text-xl font-bold text-gray-900 mb-4">Side-by-Side Comparison</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="text-left p-4">Feature</th>
                  <th className="text-left p-4 bg-red-50 text-red-700">Manual Entry</th>
                  <th className="text-left p-4 bg-green-50 text-green-700">CRMSYNC</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr>
                  <td className="p-4 font-medium">Time per contact</td>
                  <td className="p-4 bg-red-50">2-3 minutes</td>
                  <td className="p-4 bg-green-50">2 seconds (one click)</td>
                </tr>
                <tr>
                  <td className="p-4 font-medium">Data accuracy</td>
                  <td className="p-4 bg-red-50">Prone to typos</td>
                  <td className="p-4 bg-green-50">Extracted directly from email</td>
                </tr>
                <tr>
                  <td className="p-4 font-medium">Phone numbers</td>
                  <td className="p-4 bg-red-50">Often missed</td>
                  <td className="p-4 bg-green-50">Auto-detected from signatures</td>
                </tr>
                <tr>
                  <td className="p-4 font-medium">Job titles</td>
                  <td className="p-4 bg-red-50">Manually searched</td>
                  <td className="p-4 bg-green-50">Auto-extracted</td>
                </tr>
                <tr>
                  <td className="p-4 font-medium">CRM sync</td>
                  <td className="p-4 bg-red-50">Copy-paste to HubSpot/Salesforce</td>
                  <td className="p-4 bg-green-50">One-click sync</td>
                </tr>
                <tr>
                  <td className="p-4 font-medium">Duplicates</td>
                  <td className="p-4 bg-red-50">Easy to create</td>
                  <td className="p-4 bg-green-50">Automatically detected</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Time Savings */}
        <section>
          <h3 className="text-xl font-bold text-gray-900 mb-4">Calculate Your Time Savings</h3>
          <div className="bg-blue-50 rounded-xl p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-3xl font-bold text-blue-600">50</div>
                <div className="text-sm text-gray-600">Contacts per week</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-blue-600">×3 min</div>
                <div className="text-sm text-gray-600">Manual entry time</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-green-600">=2.5 hrs</div>
                <div className="text-sm text-gray-600">Saved weekly</div>
              </div>
            </div>
            <p className="mt-4 text-center text-gray-700">That's <strong>130 hours per year</strong> you could spend closing deals instead!</p>
          </div>
        </section>

        {/* CTA */}
        <div className="text-center">
          <a href="#/register" className="inline-block bg-blue-600 text-white font-semibold px-8 py-3 rounded-lg hover:bg-blue-700 transition">
            Start Saving Time Today
          </a>
        </div>
      </div>
    )
  },
  'vs-competitors': {
    title: "CRMSYNC vs Other Tools",
    subtitle: "See how CRMSYNC compares to alternatives",
    content: (
      <div className="space-y-8 text-gray-600">
        {/* Why CRMSYNC */}
        <section>
          <h3 className="text-xl font-bold text-gray-900 mb-4">Why Choose CRMSYNC?</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <h4 className="font-semibold text-green-800 flex items-center gap-2">
                <span>✓</span> Gmail-Native
              </h4>
              <p className="text-sm mt-2">Works directly inside Gmail. No switching between apps or browser tabs.</p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <h4 className="font-semibold text-green-800 flex items-center gap-2">
                <span>✓</span> Privacy-First
              </h4>
              <p className="text-sm mt-2">Email content processed locally. We never see or store your emails.</p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <h4 className="font-semibold text-green-800 flex items-center gap-2">
                <span>✓</span> Affordable
              </h4>
              <p className="text-sm mt-2">Starting at $9/month. No per-seat pricing or expensive enterprise tiers.</p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <h4 className="font-semibold text-green-800 flex items-center gap-2">
                <span>✓</span> Simple Setup
              </h4>
              <p className="text-sm mt-2">Install, connect your CRM, done. No complex configuration needed.</p>
            </div>
          </div>
        </section>

        {/* Feature Comparison */}
        <section>
          <h3 className="text-xl font-bold text-gray-900 mb-4">Feature Comparison</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="text-left p-3">Feature</th>
                  <th className="text-center p-3 bg-blue-50">CRMSYNC</th>
                  <th className="text-center p-3">Basic Tools</th>
                  <th className="text-center p-3">Enterprise Solutions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr>
                  <td className="p-3">Gmail integration</td>
                  <td className="p-3 text-center bg-blue-50 text-green-600 font-bold">✓</td>
                  <td className="p-3 text-center text-green-600">✓</td>
                  <td className="p-3 text-center text-green-600">✓</td>
                </tr>
                <tr>
                  <td className="p-3">Signature parsing</td>
                  <td className="p-3 text-center bg-blue-50 text-green-600 font-bold">✓</td>
                  <td className="p-3 text-center text-red-600">✗</td>
                  <td className="p-3 text-center text-green-600">✓</td>
                </tr>
                <tr>
                  <td className="p-3">HubSpot sync</td>
                  <td className="p-3 text-center bg-blue-50 text-green-600 font-bold">✓</td>
                  <td className="p-3 text-center text-red-600">✗</td>
                  <td className="p-3 text-center text-green-600">✓</td>
                </tr>
                <tr>
                  <td className="p-3">Salesforce sync</td>
                  <td className="p-3 text-center bg-blue-50 text-green-600 font-bold">✓</td>
                  <td className="p-3 text-center text-red-600">✗</td>
                  <td className="p-3 text-center text-green-600">✓</td>
                </tr>
                <tr>
                  <td className="p-3">Local processing</td>
                  <td className="p-3 text-center bg-blue-50 text-green-600 font-bold">✓</td>
                  <td className="p-3 text-center text-red-600">✗</td>
                  <td className="p-3 text-center text-red-600">✗</td>
                </tr>
                <tr>
                  <td className="p-3">Free tier</td>
                  <td className="p-3 text-center bg-blue-50 text-green-600 font-bold">✓ (50/mo)</td>
                  <td className="p-3 text-center text-green-600">✓</td>
                  <td className="p-3 text-center text-red-600">✗</td>
                </tr>
                <tr>
                  <td className="p-3">Price</td>
                  <td className="p-3 text-center bg-blue-50 font-bold">$9/mo</td>
                  <td className="p-3 text-center">Free</td>
                  <td className="p-3 text-center">$50-200/mo</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Best For */}
        <section>
          <h3 className="text-xl font-bold text-gray-900 mb-4">Who Is CRMSYNC Best For?</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border border-gray-200 rounded-xl p-4 text-center">
              <div className="text-3xl mb-2">💼</div>
              <h4 className="font-semibold text-gray-900">Sales Professionals</h4>
              <p className="text-sm mt-2">Save hours on data entry and keep your CRM up to date.</p>
            </div>
            <div className="border border-gray-200 rounded-xl p-4 text-center">
              <div className="text-3xl mb-2">🎯</div>
              <h4 className="font-semibold text-gray-900">Recruiters</h4>
              <p className="text-sm mt-2">Capture candidate details instantly from emails.</p>
            </div>
            <div className="border border-gray-200 rounded-xl p-4 text-center">
              <div className="text-3xl mb-2">🏢</div>
              <h4 className="font-semibold text-gray-900">Small Businesses</h4>
              <p className="text-sm mt-2">Enterprise CRM features at a fraction of the cost.</p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-xl text-center">
          <h3 className="text-xl font-bold">Ready to Try CRMSYNC?</h3>
          <p className="mt-2 text-blue-100">Start free with 50 contacts/month. No credit card required.</p>
          <a href="#/register" className="inline-block mt-4 bg-white text-blue-600 font-semibold px-8 py-3 rounded-lg hover:bg-blue-50 transition">
            Get Started Free
          </a>
        </div>
      </div>
    )
  },
  'vs-spreadsheets': {
    title: "CRMSYNC vs Spreadsheets",
    subtitle: "Graduate from Excel and Google Sheets",
    content: (
      <div className="space-y-8 text-gray-600">
        {/* Hero */}
        <div className="bg-gradient-to-r from-green-500 to-teal-500 text-white p-6 rounded-xl">
          <h3 className="text-xl font-bold">Spreadsheets Don't Scale</h3>
          <p className="mt-2 text-green-100">Managing contacts in Excel or Google Sheets? Here's why it's time to upgrade.</p>
        </div>

        {/* Problems with Spreadsheets */}
        <section>
          <h3 className="text-xl font-bold text-gray-900 mb-4">The Problem with Spreadsheets</h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3 bg-red-50 p-4 rounded-lg">
              <span className="text-red-500 text-xl">✗</span>
              <div>
                <h4 className="font-semibold text-gray-900">Manual Everything</h4>
                <p className="text-sm">Copy, paste, format, repeat. For every single contact.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 bg-red-50 p-4 rounded-lg">
              <span className="text-red-500 text-xl">✗</span>
              <div>
                <h4 className="font-semibold text-gray-900">No CRM Sync</h4>
                <p className="text-sm">Spreadsheets don't talk to HubSpot or Salesforce.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 bg-red-50 p-4 rounded-lg">
              <span className="text-red-500 text-xl">✗</span>
              <div>
                <h4 className="font-semibold text-gray-900">Duplicate Chaos</h4>
                <p className="text-sm">No automatic duplicate detection. Data gets messy fast.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 bg-red-50 p-4 rounded-lg">
              <span className="text-red-500 text-xl">✗</span>
              <div>
                <h4 className="font-semibold text-gray-900">No Context</h4>
                <p className="text-sm">Lose track of where contacts came from or when you last talked.</p>
              </div>
            </div>
          </div>
        </section>

        {/* CRMSYNC Solution */}
        <section>
          <h3 className="text-xl font-bold text-gray-900 mb-4">The CRMSYNC Solution</h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3 bg-green-50 p-4 rounded-lg">
              <span className="text-green-500 text-xl">✓</span>
              <div>
                <h4 className="font-semibold text-gray-900">Automatic Capture</h4>
                <p className="text-sm">Contacts extracted from emails with one click.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 bg-green-50 p-4 rounded-lg">
              <span className="text-green-500 text-xl">✓</span>
              <div>
                <h4 className="font-semibold text-gray-900">CRM Integration</h4>
                <p className="text-sm">Sync directly to HubSpot and Salesforce.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 bg-green-50 p-4 rounded-lg">
              <span className="text-green-500 text-xl">✓</span>
              <div>
                <h4 className="font-semibold text-gray-900">Smart Deduplication</h4>
                <p className="text-sm">Automatically detects and merges duplicates.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 bg-green-50 p-4 rounded-lg">
              <span className="text-green-500 text-xl">✓</span>
              <div>
                <h4 className="font-semibold text-gray-900">Source Tracking</h4>
                <p className="text-sm">Know exactly which email each contact came from.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Still Need Spreadsheets? */}
        <section>
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
            <h3 className="text-lg font-bold text-gray-900">Still Need a Spreadsheet?</h3>
            <p className="mt-2">No problem! CRMSYNC lets you export all your contacts to CSV anytime. Use the best of both worlds.</p>
            <p className="mt-2 text-sm text-gray-500">Export includes: Name, Email, Phone, Company, Title, Date Added, Source</p>
          </div>
        </section>

        {/* CTA */}
        <div className="text-center">
          <a href="#/register" className="inline-block bg-green-600 text-white font-semibold px-8 py-3 rounded-lg hover:bg-green-700 transition">
            Upgrade from Spreadsheets
          </a>
        </div>
      </div>
    )
  }
};

// SEO meta descriptions for each page
const PAGE_META: Record<string, string> = {
  docs: "Complete CRMSYNC documentation - installation guide, Gmail integration, HubSpot and Salesforce setup, troubleshooting, and FAQ.",
  about: "Learn about CRMSYNC - our mission to eliminate busywork and help professionals focus on building meaningful relationships.",
  careers: "Join the CRMSYNC team - current job openings for engineers, designers, and more.",
  terms: "CRMSYNC Terms of Service - usage guidelines, subscription terms, and legal information.",
  privacy: "CRMSYNC Privacy Policy - how we protect your data, what we collect, and your rights.",
  security: "CRMSYNC Security - enterprise-grade protection for your data, GDPR/CCPA compliance, and security practices.",
  blog: "CRMSYNC Blog - tips for email management, sales productivity, and product updates.",
  support: "CRMSYNC Support - get help with installation, troubleshooting, billing, and more.",
  'integration-hubspot': "Connect CRMSYNC to HubSpot - step-by-step setup guide for syncing Gmail contacts to your HubSpot CRM.",
  'integration-salesforce': "Connect CRMSYNC to Salesforce - complete integration guide for syncing contacts from Gmail.",
  'vs-manual': "CRMSYNC vs Manual Data Entry - see how automation saves 5+ hours per week on contact management.",
  'vs-competitors': "CRMSYNC vs Other Tools - feature comparison showing why CRMSYNC is the best choice for Gmail users.",
  'vs-spreadsheets': "CRMSYNC vs Spreadsheets - why it's time to graduate from Excel for contact management."
};

export const StaticPage: React.FC<{ pageKey: string }> = ({ pageKey }) => {
  const page = PAGES[pageKey] || PAGES['about'];

  // Update document title and meta description for SEO
  useEffect(() => {
    // Set page title
    document.title = `${page.title} | CRMSYNC`;
    
    // Update meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', PAGE_META[pageKey] || page.subtitle);
    }

    // Update canonical URL
    let canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) {
      canonical.setAttribute('href', `https://crm-sync.net/#/${pageKey}`);
    }

    // Cleanup: restore default title on unmount
    return () => {
      document.title = 'CRMSYNC - Auto-Sync Gmail Contacts to HubSpot & Salesforce';
    };
  }, [pageKey, page.title, page.subtitle]);

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
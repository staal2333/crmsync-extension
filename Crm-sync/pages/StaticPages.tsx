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
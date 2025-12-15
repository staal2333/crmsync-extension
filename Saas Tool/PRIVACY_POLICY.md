# CRMSYNC Privacy Policy

**Last Updated: December 2024**

## Data Collection and Storage

CRMSYNC processes and stores all contact and email data **locally on your device** using Chrome's local extension storage (`chrome.storage.local`). 

### What We Store Locally:
- Contact information (name, email, company, title, phone, LinkedIn URLs)
- Email metadata (subject, timestamps, direction - sent/received)
- Email message history per contact
- User preferences (dark mode, auto-approve settings, reminder days, tracked labels)
- Tags and campaign information you assign to contacts

### What We Sync (Optional):
- User preferences only (dark mode, auto-approve, reminder days, tracked labels) are stored in `chrome.storage.sync` so your settings follow you across Chrome profiles
- **No contact data is ever stored in sync storage**
- **No email content is ever stored in sync storage**

## Data Transmission

**CRMSYNC does not transmit any data to external servers.** All processing happens locally in your browser. The extension:
- Does not call any external APIs
- Does not send data to third-party services
- Does not use analytics or tracking
- Does not collect usage statistics
- Does not share data with advertisers or other parties

## Permissions Explained

- **storage**: To save contact data and settings locally on your device
- **activeTab**: To access Gmail/Outlook tabs when you click the extension icon
- **scripting**: To inject content scripts for email detection and contact extraction
- **downloads**: To export CSV files containing your contact data to your computer
- **host_permissions** (Gmail/Outlook): To read email content for contact extraction (names, emails, signatures, etc.)

## How We Use Your Data

- **Contact Extraction**: We parse email content to extract contact information (names, emails, companies, titles, phone numbers) from emails you send and receive
- **Data Enrichment**: We automatically update contact records when new information is found in email signatures or replies
- **Follow-up Management**: We track email activity to help you manage follow-ups and identify contacts who haven't replied
- **Export**: You can export your contact data as CSV files at any time

## Your Rights

You have complete control over your data:

- **Delete All Data**: Uninstall the extension to delete all stored data
- **Export Your Data**: Export all contacts as CSV at any time via the extension popup
- **Review Stored Data**: Access stored data via Chrome DevTools (chrome://extensions → CRMSYNC → Details → Inspect views → Application → Storage)
- **Disable Features**: Turn off auto-approve, sidebar, or other features in settings

## Data Retention

- Data is stored locally on your device until you uninstall the extension
- There is no automatic data deletion
- You can manually delete individual contacts or export and clear data at any time

## Third-Party Services

CRMSYNC does not integrate with any third-party services. All data processing happens locally in your browser.

## Children's Privacy

CRMSYNC is not intended for users under the age of 13. We do not knowingly collect data from children.

## Changes to This Policy

We will notify users of any material changes to this privacy policy by updating the "Last Updated" date. Continued use of the extension after changes constitutes acceptance of the updated policy.

## Contact

For privacy questions or concerns, please contact us at: [your-email@example.com]

## Compliance

This extension complies with:
- Chrome Web Store Developer Program Policies
- General Data Protection Regulation (GDPR) principles (data stored locally, user control)
- California Consumer Privacy Act (CCPA) principles (no data sharing, user control)

---

**Summary**: CRMSYNC stores all data locally on your device. We don't send any data to external servers. You have full control over your data and can delete it at any time by uninstalling the extension.


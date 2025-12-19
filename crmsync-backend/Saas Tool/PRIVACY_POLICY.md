# Privacy Policy for CRMSYNC

**Last Updated:** December 15, 2025

## Overview

CRMSYNC is a Chrome extension designed to help you manage email contacts efficiently. We respect your privacy and are committed to protecting your personal information.

## Information We Collect

### Information You Provide
- **Account Information**: Email address, name (if you create an account)
- **Contact Data**: Names, email addresses, phone numbers, companies, and job titles extracted from your Gmail emails
- **Settings**: Your preferences and exclusion patterns

### Automatically Collected Information
- **Email Content** (Processed Locally): We analyze email content within your browser to extract contact information. This processing happens locally and is NOT sent to our servers unless you enable cloud sync.
- **Usage Data**: Error logs and sync timestamps (only if logged in)

## How We Use Your Information

### Local Storage (Guest Mode)
When you use CRMSYNC in **Guest Mode**:
- All contact data is stored **locally on your device** using Chrome's storage API
- **No data is sent to our servers**
- **No account is created**
- Data remains on your device only

### Cloud Sync (Logged-In Mode)
When you create an account and enable cloud sync:
- Contact data is encrypted and sent to our secure servers
- Data is synchronized across your devices
- We use this data solely to provide the synchronization service
- We **never sell, share, or use your data for advertising**

## Data Storage & Security

### Local Storage
- Contact data is stored using Chrome's `chrome.storage.local` API
- Settings are stored using Chrome's `chrome.storage.sync` API
- Data remains on your device and is not accessible to us

### Cloud Storage (If Enabled)
- Data is stored on secure servers (Render.com infrastructure)
- Communications are encrypted using TLS 1.3
- Passwords are hashed using bcrypt
- Access tokens expire after 24 hours

## Third-Party Services

### Google OAuth (Optional)
- If you choose to sign in with Google, we receive your email address and name
- We do not access your Gmail inbox or send emails on your behalf
- Google's Privacy Policy: https://policies.google.com/privacy

### Gmail Integration
- CRMSYNC requires permission to read email content **locally in your browser** to extract contact information
- We do NOT have backend access to your Gmail account
- Email content is processed locally and is not stored or transmitted (unless you enable cloud sync for extracted contacts)

## Your Rights

You have the right to:
- **Access** your data at any time through the extension
- **Export** your data as CSV
- **Delete** your account and all associated data
- **Opt-out** of cloud sync (use Guest Mode)

### Data Deletion
To delete your data:
- **Guest Mode**: Clear browser data or uninstall the extension
- **Cloud Sync**: Sign out and click "Delete Account" in settings, or contact us at support@crmsync.com

## Data Retention

- **Guest Mode**: Data is retained until you clear browser storage or uninstall
- **Cloud Sync**: Data is retained until you delete your account
- Deleted accounts are permanently removed within 30 days

## Children's Privacy

CRMSYNC is not intended for users under 13 years of age. We do not knowingly collect information from children under 13.

## Changes to This Policy

We may update this Privacy Policy from time to time. We will notify you of significant changes by updating the "Last Updated" date.

## Contact Us

If you have questions about this Privacy Policy or your data:
- **Email**: support@crmsync.com
- **GitHub**: https://github.com/yourusername/crmsync-extension

## Compliance

This extension complies with:
- Chrome Web Store Developer Program Policies
- General Data Protection Regulation (GDPR)
- California Consumer Privacy Act (CCPA)

## Data Processing Summary

| Data Type | Local (Guest) | Cloud (Logged In) |
|-----------|---------------|-------------------|
| Contact Information | ✅ Stored locally | ✅ Synced to cloud |
| Email Content | ✅ Processed locally | ❌ Never sent |
| Settings | ✅ Stored locally | ✅ Synced to cloud |
| Usage Analytics | ❌ Not collected | ⚠️ Minimal (errors only) |
| Sold to Third Parties | ❌ Never | ❌ Never |

---

**Your Privacy, Your Choice**: You have complete control over your data. Choose Guest Mode for local-only storage or enable Cloud Sync for cross-device access.

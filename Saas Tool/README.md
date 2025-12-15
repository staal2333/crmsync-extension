# CRMSYNC

A sleek, modern Chrome extension that automatically tracks, manages, and perfects your client communications in Gmail. Automatically captures contact details from your email exchanges and helps you stay on top of your outreach. **Now with cloud synchronization across all your devices!**

## ✨ New in v2.0: Cloud Sync & Authentication

- **🔐 Secure Sign-In**: Email/password or Google OAuth authentication
- **☁️ Cloud Sync**: Access your contacts from any device
- **👤 Guest Mode**: Use offline without an account (upgradeable anytime)
- **🔄 Auto-Sync**: Background sync every 5 minutes
- **📱 Cross-Platform**: Your data follows you everywhere

## Features

### Core Features

- **Real-Time Email Tracking**: Automatically detects recipient names, email addresses, and job titles from ongoing Gmail communications
- **Smart Data Enrichment**: Continuously monitors email exchanges for phone numbers, company names, LinkedIn profiles, and updates existing contacts
- **Approval Workflow**: Clean, minimalist approval panel for reviewing and confirming new contacts or updates before adding to your contact list
- **Customizable Reminders**: Automatically schedule follow-ups when sending outreach emails, or set reminders for unanswered emails
- **CSV Export**: One-click export of curated, verified leads ready for upload into any CRM platform (HubSpot, Pipedrive, Salesforce, etc.)
- **Cloud Synchronization**: Optional cloud backup and multi-device sync (requires free account)

### Design & Experience

- **Sleek, Modern UI**: Minimalist, distraction-free design with dark/light mode support
- **Sidebar & Floating Widget**: Seamless integration into Gmail workflow
- **Privacy First**: Choose between local-only storage or opt-in cloud sync
- **Lightning Fast**: Non-intrusive, highly optimized codebase ensures zero lag
- **Guest Mode**: Full functionality without account required

### Bonus Features

- **Bulk Approvals**: Preview and confirm multiple new contacts at once
- **Contact Health Dashboard**: Visual indicators and stats to track outreach status
- **Flexible Integrations**: Backend API ready for team CRM integrations
- **Multi-Device Access**: Sign in on any browser to access your contacts

## Quick Start

### Extension Only (Guest Mode)

1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" (toggle in top right)
4. Click "Load unpacked" and select the "Saas Tool" directory
5. Navigate to Gmail and click the extension icon
6. Choose "Continue Offline" for guest mode
7. Start tracking contacts!

### Full Setup (With Cloud Sync)

**Prerequisites:**
- Node.js 16+
- PostgreSQL 12+

**Quick Setup:**

```bash
# 1. Setup backend
cd crmsync-backend
npm install
cp .env.example .env
# Edit .env with your database credentials
npm run migrate
npm run dev

# 2. Install extension (steps above)
# 3. Click "Sign In / Sign Up" in extension
# 4. Create account or sign in with Google
```

**Detailed instructions:** See [SETUP_GUIDE.md](SETUP_GUIDE.md)

## Usage

### Basic Usage (All Modes)

1. **Automatic Detection**: The extension automatically scans your Gmail for contact information as you send and receive emails
2. **Approval**: When new contacts or updates are detected, you'll see an approval panel in the top-right corner
3. **Dashboard**: Click the floating widget (bottom-right) or use the sidebar to view your contact dashboard
4. **Export**: Use the "Export CSV" button to download your contacts for CRM import
5. **Settings**: Click the extension icon to access settings (dark mode, auto-approve, reminders, etc.)

### Cloud Sync Features

- **Auto-Sync**: Data syncs automatically every 5 minutes
- **Manual Sync**: Click the "🔄 Sync" button for immediate sync
- **Sync Status**: See last sync time in the auth banner
- **Multi-Device**: Install on multiple devices, sign in to access same data

## Settings

- **Dark Mode**: Toggle between light and dark themes
- **Auto Approve**: Automatically approve contacts without manual confirmation
- **Enable Sidebar**: Show/hide the sidebar in Gmail
- **Reminder Days**: Set how many days before showing follow-up reminders

## Privacy & Data Storage

### Guest Mode (Offline)

All contact and email activity data is stored **only in Chrome's local extension storage** (`chrome.storage.local`) on your device:

- **No external API calls** - Everything stays local
- **No account required** - Use immediately without signing up
- **Device-specific** - Data only on current browser/device
- **Full control** - Export or delete data anytime

### Cloud Sync Mode (With Account)

When you create an account and sign in:

- **Encrypted Transit**: All data encrypted with TLS 1.3 during sync
- **Secure Backend**: Data stored in PostgreSQL database with proper authentication
- **User Control**: You own your data - export or delete anytime
- **Optional**: Cloud sync is opt-in, not required
- **Privacy-First**: No data sold or shared with third parties

**What gets synced:**
- Contact information (names, emails, companies, titles, phone numbers)
- Email activity metadata (sent/received counts, timestamps)
- Settings and preferences
- Tags and follow-up reminders

**What doesn't get synced:**
- Full email content or bodies
- Email credentials or access tokens
- Gmail/Outlook authentication data
- Any sensitive information beyond contact details

**Compliance:**
- GDPR compliant data export
- Account deletion removes all cloud data
- Clear privacy policy
- Transparent data practices

See full [Privacy Policy](PRIVACY_POLICY.md) for details.

## Browser Compatibility

- Chrome (Manifest V3)
- Edge (Chromium-based)

## License

MIT License - feel free to use and modify as needed.

## Support

For issues, feature requests, or contributions, please open an issue on the repository.


# Website Content Updates

Your current privacy and terms pages are minimal. Here's comprehensive content to add.

---

## Privacy Policy (Expanded)

Copy this content to replace your current `#/privacy` page:

```
Privacy Policy
Last updated: December 2024

Your privacy is our priority. This policy explains what data we collect and how we use it.

---

SUMMARY
• We only collect data necessary to provide the service
• We never sell your data
• You can export or delete your data anytime
• Email content is processed locally, never stored

---

1. INFORMATION WE COLLECT

Account Information
When you create an account:
• Email address
• Name (if provided)
• Password (encrypted with bcrypt)

Contact Data
When you use CRMSYNC, we process:
• Names from email headers/signatures
• Email addresses
• Phone numbers (if found in signatures)
• Company names (if detected)
• Job titles (if detected)

IMPORTANT: We only process emails you actively view. We never scan your entire inbox or access emails you don't open.

Usage Data
Anonymous statistics to improve the service:
• Number of contacts saved
• Feature usage patterns
• Error logs (for debugging)

Payment Information
Payments are processed by Stripe. We never store credit card numbers.

---

2. HOW WE USE YOUR DATA

We use your information to:
• Provide the CRMSYNC service
• Sync contacts to your connected CRMs (HubSpot, Salesforce)
• Send important service updates
• Improve our product
• Provide customer support
• Process payments

---

3. DATA SHARING

Third-Party Services
• HubSpot/Salesforce: Contacts you choose to sync are sent to your CRM
• Stripe: For payment processing
• Cloud Infrastructure: Encrypted data storage

We Never Sell Your Data
We do not sell, rent, or trade your personal information to any third parties.

---

4. DATA SECURITY

We implement industry-standard security:
• All data transmitted over HTTPS (TLS 1.3)
• Passwords hashed with bcrypt
• JWT tokens with short expiration
• Database encryption at rest
• Regular security audits

---

5. DATA RETENTION

• Account data: Until you delete your account
• Contact data: Until you delete contacts or account
• Usage logs: 90 days
• Payment records: As required by law (7 years)

---

6. YOUR RIGHTS

You have the right to:
• ACCESS: Request a copy of your data
• CORRECTION: Update inaccurate information
• DELETION: Delete your account and all data
• EXPORT: Download contacts as CSV
• OPT-OUT: Unsubscribe from marketing emails

GDPR (European Users)
If you're in the EEA, you have additional rights including data portability and the right to lodge a complaint with a supervisory authority.

CCPA (California Users)
California residents can request to know what personal information is collected, request deletion, and opt-out of sale (we don't sell data).

---

7. COOKIES

We use essential cookies only:
• Authentication (keeping you logged in)
• Security (preventing CSRF attacks)

We do NOT use advertising or tracking cookies.

---

8. CHILDREN'S PRIVACY

CRMSYNC is not intended for users under 16. We do not knowingly collect information from children.

---

9. CHANGES TO THIS POLICY

We may update this policy from time to time. Significant changes will be communicated via email or in-app notification.

---

10. CONTACT US

Questions about privacy?
Email: privacy@crm-sync.net
Website: crm-sync.net/support
```

---

## Terms of Service (Expanded)

Copy this content to replace your current `#/terms` page:

```
Terms of Service
Last updated: December 2024

Please read these terms carefully before using CRMSYNC.

---

SUMMARY
• Use CRMSYNC responsibly and legally
• You own your data
• We provide the service "as is"
• You can cancel anytime

---

1. ACCEPTANCE OF TERMS

By using CRMSYNC ("the Service"), you agree to be bound by these Terms. If you don't agree, don't use the Service.

---

2. DESCRIPTION OF SERVICE

CRMSYNC is a Chrome extension and web service that:
• Extracts contact information from emails you view in Gmail
• Stores contacts locally and/or in the cloud
• Syncs contacts to third-party CRM platforms
• Provides contact management features

---

3. ACCOUNT REGISTRATION

To use certain features, you must create an account. You agree to:
• Provide accurate and complete information
• Maintain the security of your credentials
• Notify us of any unauthorized access
• Accept responsibility for all activities under your account

---

4. ACCEPTABLE USE

You agree NOT to use CRMSYNC to:
• Collect contacts without proper consent or legal basis
• Send spam or unsolicited communications
• Violate any applicable laws or regulations
• Infringe on others' privacy or intellectual property
• Attempt to hack or compromise the Service
• Abuse API rate limits
• Share your account or resell access

GDPR/CCPA COMPLIANCE: You are responsible for ensuring your use complies with data protection laws. Only collect contacts when you have a legal basis.

---

5. SUBSCRIPTION PLANS & PAYMENT

Free Plan
• Limited features and contact limit (50/month)
• May be modified with 30 days notice

Paid Plans (Pro, Business)
• Billed monthly or annually through Stripe
• You authorize recurring charges until cancellation

Cancellation & Refunds
• Cancel anytime from account settings
• Cancellation takes effect at end of billing period
• Refunds available within 14 days at our discretion
• No refunds for partial months

Price Changes
• 30 days notice for price changes
• Existing subscribers notified before changes affect them

---

6. INTELLECTUAL PROPERTY

The Service (code, design, content) is owned by CRMSYNC. You may not:
• Copy, modify, or distribute the extension
• Use our trademarks without permission
• Create derivative works

---

7. THIRD-PARTY SERVICES

CRMSYNC integrates with HubSpot, Salesforce, and Stripe. Your use of these integrations is subject to their terms. We're not responsible for third-party service availability.

---

8. DATA AND PRIVACY

See our Privacy Policy for details. Key points:
• You own your contact data
• We process data only to provide the Service
• You can export or delete your data anytime

---

9. SERVICE AVAILABILITY

We strive for high availability but don't guarantee uninterrupted service. We may:
• Perform scheduled maintenance
• Experience unplanned outages
• Modify or discontinue features

---

10. LIMITATION OF LIABILITY

THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND.

TO THE MAXIMUM EXTENT PERMITTED BY LAW, CRMSYNC SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES.

Our total liability shall not exceed the amount you paid us in the 12 months preceding the claim.

---

11. INDEMNIFICATION

You agree to indemnify CRMSYNC from any claims arising from:
• Your use of the Service
• Your violation of these Terms
• Your violation of third-party rights

---

12. TERMINATION

We may suspend or terminate your account if you:
• Violate these Terms
• Abuse the Service or other users
• Engage in fraudulent activity

Upon termination, your right to use the Service ends immediately. Export your data before termination.

---

13. DISPUTE RESOLUTION

Disputes shall be:
• First attempted through informal negotiation
• Subject to binding arbitration if negotiation fails
• Governed by the laws of Denmark

---

14. CHANGES TO TERMS

We may update these Terms. Continued use after changes constitutes acceptance. Material changes will be communicated via email.

---

15. CONTACT

Questions about these Terms?
Email: legal@crm-sync.net
Website: crm-sync.net/support
```

---

## How to Update Your Website

Since your website uses hash routing (#/privacy, #/terms), you'll need to update the React/Vue/Svelte component that renders these pages.

Look for files like:
- `Privacy.jsx` or `PrivacyPolicy.tsx`
- `Terms.jsx` or `TermsOfService.tsx`

Replace the minimal content with the expanded version above.

If you share your website codebase location, I can help update the files directly!

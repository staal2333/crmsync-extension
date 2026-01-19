# CRMSYNC Website

This folder contains the marketing website for CRMSYNC.

## Pages

| File | URL | Description |
|------|-----|-------------|
| `index.html` | `/` | Landing page |
| `pricing.html` | `/pricing` | Pricing plans |
| `privacy.html` | `/privacy` | Privacy policy |
| `terms.html` | `/terms` | Terms of service |
| `docs.html` | `/docs` | Documentation |

## Deployment Options

### Option 1: Vercel (Recommended)

1. **Push to GitHub:**
   ```bash
   cd website
   git init
   git add .
   git commit -m "Initial website"
   git remote add origin https://github.com/YOUR_USERNAME/crmsync-website.git
   git push -u origin main
   ```

2. **Deploy to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repo
   - Set output directory to `./` (root)
   - Click Deploy

3. **Add Custom Domain:**
   - In Vercel dashboard, go to Settings > Domains
   - Add `crm-sync.net`
   - Update DNS records as instructed

### Option 2: Netlify

1. **Drag & Drop:**
   - Go to [netlify.com](https://netlify.com)
   - Drag the `website` folder to the deploy zone
   - Done!

2. **Custom Domain:**
   - Go to Site Settings > Domain Management
   - Add custom domain
   - Update DNS

### Option 3: GitHub Pages

1. **Create repo:** `crmsync.github.io`
2. **Push files:**
   ```bash
   git clone https://github.com/YOUR_USERNAME/crmsync.github.io.git
   cp -r website/* crmsync.github.io/
   cd crmsync.github.io
   git add . && git commit -m "Deploy" && git push
   ```
3. **Custom Domain:** Add CNAME file with `crm-sync.net`

## DNS Configuration

Add these records to your domain (crm-sync.net):

### For Vercel:
```
Type: A
Name: @
Value: 76.76.21.21

Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

### For Netlify:
```
Type: A
Name: @
Value: 75.2.60.5

Type: CNAME
Name: www
Value: YOUR-SITE.netlify.app
```

## Required Assets

Before deploying, add these files:

- [ ] `favicon.png` - 32x32 favicon
- [ ] `og-image.png` - 1200x630 social share image
- [ ] Product screenshots for hero section

## Checklist Before Launch

- [ ] Replace placeholder hero image with real screenshot
- [ ] Update Chrome Web Store link (once published)
- [ ] Test all navigation links
- [ ] Test contact form (if added)
- [ ] Verify privacy@crm-sync.net email works
- [ ] Test on mobile devices
- [ ] Run Google PageSpeed Insights
- [ ] Set up Google Analytics or Plausible

## Adding Login/Signup Pages

For login functionality, you'll need to either:

1. **Link to existing app:** If your website already has auth, link `/login` to your app's login page

2. **Add auth pages:** Create `login.html` and `signup.html` with forms that call your API

Example login form:
```html
<form id="loginForm">
  <input type="email" name="email" placeholder="Email" required>
  <input type="password" name="password" placeholder="Password" required>
  <button type="submit">Log In</button>
</form>

<script>
document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const formData = new FormData(e.target);
  const response = await fetch('https://crmsync-api.onrender.com/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: formData.get('email'),
      password: formData.get('password')
    })
  });
  const data = await response.json();
  if (data.token) {
    localStorage.setItem('token', data.token);
    window.location.href = '/dashboard';
  }
});
</script>
```

## File Structure After Complete Setup

```
website/
├── index.html          # Landing page
├── pricing.html        # Pricing
├── privacy.html        # Privacy policy
├── terms.html          # Terms of service
├── docs.html           # Documentation
├── login.html          # Login page (create)
├── signup.html         # Signup page (create)
├── dashboard.html      # User dashboard (create)
├── favicon.png         # Favicon (add)
├── og-image.png        # Social image (add)
├── screenshots/        # Product screenshots (add)
│   ├── popup.png
│   ├── sidebar.png
│   └── dashboard.png
└── README.md           # This file
```

## Support

Questions? Contact support@crm-sync.net

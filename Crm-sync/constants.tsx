import { 
  Wand2, Search, Cloud, Download, Shield, CheckCircle2, 
  BarChart3, Bell, Users, Zap, Briefcase, Globe, RefreshCw, Link 
} from "lucide-react";
import { PricingTier, Feature, Testimonial, FAQItem } from "./types";

export const STRIPE_PUBLIC_KEY = "pk_test_51Sew66CCA7zznCUOs81EWnAMc71NVWNa0FTLDd38V9Xj26XrTB3DtCb6IdcAfiSDj41wEc0f4fMcHGtd6KhuwZeq00jHwgenCm";
export const API_URL = "https://crmsync-api.onrender.com";

export const PRICING_TIERS: PricingTier[] = [
  {
    id: "free",
    name: "Starter",
    priceMonthly: 0,
    priceYearly: 0,
    description: "Perfect for individuals just starting out.",
    features: [
      "50 contact limit",
      "Local storage only",
      "1 CSV export per week",
      "Basic email tracking",
      "Community support"
    ],
    buttonText: "Install Free",
    variant: "outline"
  },
  {
    id: "pro",
    name: "Professional",
    priceMonthly: 9.99,
    priceYearly: 99, // ~8.25/mo
    stripePriceMonthly: "price_1Sf0GZFyB6BgsXQ0K279LYTR",
    stripePriceYearly: "price_1Sf0ICFyB6BgsXQ06U07uDYc",
    description: "For power users who need cloud sync & CRM integrations.",
    features: [
      "Unlimited contacts",
      "HubSpot & Salesforce integrations",
      "Auto-sync to CRM",
      "Cloud sync across devices",
      "Unlimited CSV exports",
      "Auto-approve contacts",
      "Smart reminders & follow-ups",
      "Priority email support"
    ],
    isPopular: true,
    buttonText: "Start Pro Trial",
    variant: "primary"
  },
  {
    id: "business",
    name: "Teams",
    priceMonthly: 29.99,
    priceYearly: 299,
    stripePriceMonthly: "price_1Sf0HEFyB6BgsXQ0VM2a6HnB",
    stripePriceYearly: "price_1Sf0IYFyB6BgsXQ0YPHMBb1q",
    description: "Collaborate with your sales team.",
    features: [
      "Everything in Pro",
      "Up to 5 team members",
      "Shared contact database",
      "Advanced analytics",
      "Bulk export & import",
      "24hr Response Time"
    ],
    buttonText: "Get Business",
    variant: "dark"
  },
  {
    id: "enterprise",
    name: "Custom",
    priceMonthly: 99,
    priceYearly: 990, // Placeholder
    description: "For large organizations with specific needs.",
    features: [
      "Unlimited team members",
      "Dedicated account manager",
      "Custom integrations",
      "White-label options",
      "SLA guarantees",
      "On-premise deployment"
    ],
    buttonText: "Contact Sales",
    variant: "outline"
  }
];

export const FEATURES: Feature[] = [
  {
    title: "Automatic Extraction",
    description: "AI automatically detects names, emails, job titles, and companies from your Gmail conversations.",
    icon: Wand2
  },
  {
    title: "Smart Enrichment",
    description: "Automatically enriches contacts with company info and validates data accuracy.",
    icon: Search
  },
  {
    title: "Native CRM Integrations",
    description: "Directly connect to HubSpot & Salesforce. One-click sync with smart duplicate detection.",
    icon: Link
  },
  {
    title: "Auto-Sync",
    description: "New contacts automatically push to your CRM in real-time. Set it and forget it.",
    icon: RefreshCw
  },
  {
    title: "Cloud Sync",
    description: "Access your contacts from any device with secure cloud backup and synchronization.",
    icon: Cloud
  },
  {
    title: "CSV Export",
    description: "Export to any CRM in seconds with clean, formatted CSV files ready to import.",
    icon: Download
  },
  {
    title: "Privacy First",
    description: "Your data, your choice: local-only or cloud sync. Fully GDPR compliant.",
    icon: Shield
  },
  {
    title: "Smart Reminders",
    description: "Never forget a follow-up with automated reminder scheduling based on email activity.",
    icon: Bell
  }
];

export const TESTIMONIALS: Testimonial[] = [
  {
    quote: "I've saved hours every week. CRMSYNC finds contacts I would have missed manually.",
    author: "Sarah Chen",
    role: "Sales Manager",
    company: "TechCorp",
    image: "https://picsum.photos/100/100?random=1"
  },
  {
    quote: "Finally, a contact manager that actually works with my Gmail workflow. Game changer.",
    author: "Michael Rodriguez",
    role: "Freelance Consultant",
    company: "Independent",
    image: "https://picsum.photos/100/100?random=2"
  },
  {
    quote: "We've tracked 500+ leads this quarter. The team feature is perfect for our sales team.",
    author: "Jennifer Park",
    role: "Head of Growth",
    company: "StartupXYZ",
    image: "https://picsum.photos/100/100?random=3"
  }
];

export const FAQS: FAQItem[] = [
  {
    question: "Is CRMSYNC free?",
    answer: "Yes! The free tier includes 50 contacts forever. No credit card required."
  },
  {
    question: "How does CRMSYNC access my Gmail?",
    answer: "CRMSYNC only reads email metadata (sender names, addresses) locally within your browser. It never reads email content or stores passwords."
  },
  {
    question: "Which CRMs does CRMSYNC integrate with?",
    answer: "Native integrations with HubSpot and Salesforce! Connect via OAuth in seconds with smart duplicate detection and auto-sync. Export to any other CRM via CSV (Pipedrive, Zoho, etc.)."
  },
  {
    question: "Can I cancel anytime?",
    answer: "Yes! No contracts. Cancel anytime from your account dashboard. We offer a 14-day money-back guarantee."
  }
];

import { LucideIcon } from "lucide-react";

export interface PricingTier {
  id: string;
  name: string;
  priceMonthly: number;
  priceYearly: number;
  stripePriceMonthly?: string;
  stripePriceYearly?: string;
  description: string;
  features: string[];
  isPopular?: boolean;
  buttonText: string;
  variant: 'outline' | 'primary' | 'dark';
}

export interface Feature {
  title: string;
  description: string;
  icon: LucideIcon;
}

export interface Testimonial {
  quote: string;
  author: string;
  role: string;
  company: string;
  image: string;
}

export interface FAQItem {
  question: string;
  answer: string;
}

export type BillingPeriod = 'monthly' | 'yearly';

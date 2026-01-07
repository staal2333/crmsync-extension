import React from 'react';
import { FEATURES, TESTIMONIALS } from '../constants';
import { Button, SectionHeader, Badge, FadeInUp, StaggerContainer, LogoIcon } from '../components/Shared';
import { ValueCalculator } from '../components/ValueCalculator';
import { SecuritySection } from '../components/SecuritySection';
import { BeforeAfterComparison } from '../components/BeforeAfterComparison';
import { StickyHeader } from '../components/StickyHeader';
import { CompanyLogos } from '../components/CompanyLogos';
import { ArrowRight, Star, Download, Target, Upload, ShieldCheck, Zap, Chrome, Clock, Users, Shield, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

export const Home: React.FC<{ onNavigate: (page: string) => void }> = ({ onNavigate }) => {
  return (
    <div className="overflow-hidden">
      {/* Sticky Header - appears on scroll */}
      <StickyHeader onNavigate={onNavigate} />

      {/* Hero Section */}
      <section className="relative pt-20 pb-20 lg:pt-32 lg:pb-32 overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-0 left-0 w-full h-full bg-white z-0 pointer-events-none">
          <div className="absolute top-[-10%] right-[-5%] w-[50%] h-[70%] bg-gradient-to-bl from-blue-50 to-white opacity-60 blur-3xl rounded-full" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[60%] bg-gradient-to-tr from-teal-50 to-white opacity-60 blur-3xl rounded-full" />
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <Badge>✨ Launch Special: Free Forever Plan Available</Badge>
            
            <FadeInUp delay={0.1}>
              <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-dark mb-6 leading-tight">
                Own Every Relationship<br/>
                <span className="gradient-text">Without Ever Touching</span><br/>
                <span className="gradient-text">a Spreadsheet</span>
              </h1>
            </FadeInUp>

            <FadeInUp delay={0.2}>
              <p className="text-xl md:text-2xl text-gray-600 mb-10 max-w-3xl mx-auto leading-relaxed">
                AI-powered contact detection that captures every relationship from Gmail. 
                <span className="font-semibold text-dark"> Automatic enrichment. CSV export ready.</span> Zero manual work.
              </p>
            </FadeInUp>

            <FadeInUp delay={0.3}>
              <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
                <button 
                  onClick={() => window.open('https://chrome.google.com/webstore', '_blank')}
                  className="group w-full sm:w-auto bg-gradient-to-r from-primary to-secondary text-white px-10 py-4 rounded-xl font-bold text-lg hover:shadow-2xl hover:scale-105 transition-all duration-300 flex items-center justify-center"
                >
                  <Chrome className="mr-3 h-5 w-5" />
                  Add to Chrome — It's Free
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </button>
                <button 
                  onClick={() => onNavigate('login')}
                  className="w-full sm:w-auto border-2 border-gray-200 text-gray-700 px-8 py-4 rounded-xl font-semibold text-lg hover:border-primary hover:text-primary hover:bg-blue-50 transition-all duration-200"
                >
                  Sign In
                </button>
              </div>
            </FadeInUp>
            
            <FadeInUp delay={0.4}>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-sm text-gray-500">
                 <div className="flex items-center">
                   <ShieldCheck className="h-4 w-4 mr-1 text-green-500" /> No credit card required
                 </div>
                 <div className="flex items-center">
                   <Download className="h-4 w-4 mr-1 text-primary" /> Free forever plan
                 </div>
                 <div className="flex items-center">
                   <Zap className="h-4 w-4 mr-1 text-yellow-500" /> Setup in 2 minutes
                 </div>
              </div>
            </FadeInUp>

            {/* Video/GIF Placeholder */}
            <FadeInUp delay={0.5}>
              <div className="mt-6 bg-blue-50 border-2 border-dashed border-blue-200 rounded-xl p-6 max-w-2xl mx-auto">
                <p className="text-sm text-blue-600 font-medium">
                  📹 <span className="font-bold">Pro Tip:</span> Add a 5-10 second looping GIF here showing contact detection in action!
                  <br/><span className="text-xs text-blue-500">Record: Gmail → Email opens → Extension popup shows contact → "Save Contact" → ✓ Success</span>
                </p>
              </div>
            </FadeInUp>
          </div>

          {/* Hero Image / UI Mockup */}
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.5, type: "spring" }}
            className="mt-20 relative mx-auto max-w-5xl"
          >
            {/* Floating Animation Wrapper */}
            <div className="animate-float">
              <div className="bg-dark/90 rounded-xl shadow-2xl overflow-hidden border border-gray-800 p-2 md:p-3 backdrop-blur-sm">
                <div className="bg-white rounded-lg overflow-hidden shadow-inner relative">
                   {/* Mock UI header */}
                   <div className="bg-gray-100 border-b border-gray-200 p-3 flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full bg-red-400"></div>
                      <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                      <div className="w-3 h-3 rounded-full bg-green-400"></div>
                      <div className="ml-4 bg-white border border-gray-200 rounded px-3 py-1 text-xs text-gray-400 flex-grow max-w-md flex justify-between items-center">
                        <span>gmail.com</span>
                        <div className="flex space-x-2">
                          <LogoIcon className="h-4 w-4" />
                        </div>
                      </div>
                   </div>
                   {/* Content Placeholder */}
                   <div className="relative h-[400px] md:h-[500px] bg-white flex">
                      <div className="w-64 border-r border-gray-100 hidden md:block bg-gray-50 p-4 space-y-4">
                         <div className="h-8 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                         <div className="h-4 bg-gray-200 rounded w-full animate-pulse delay-75"></div>
                         <div className="h-4 bg-gray-200 rounded w-5/6 animate-pulse delay-100"></div>
                         <div className="mt-8 space-y-2">
                            {[1,2,3,4].map(i => (
                              <div key={i} className="h-10 bg-white border border-gray-200 rounded w-full"></div>
                            ))}
                         </div>
                      </div>
                      <div className="flex-grow p-8 relative">
                         <div className="space-y-6">
                            <div className="flex items-start space-x-4">
                               <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-primary font-bold">JD</div>
                               <div className="space-y-2 flex-grow">
                                  <div className="flex justify-between">
                                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                                    <div className="h-4 bg-gray-100 rounded w-12"></div>
                                  </div>
                                  <div className="h-4 bg-gray-100 rounded w-3/4"></div>
                                  <div className="h-20 bg-gray-50 rounded w-full border border-gray-100 p-4 text-gray-600 text-sm">
                                    Hi there, <br/><br/>
                                    I'd love to connect about the enterprise deal we discussed last week. Let's schedule a time.
                                  </div>
                               </div>
                            </div>
                         </div>

                         {/* The Extension UI Popover */}
                         <motion.div 
                           initial={{ x: 50, opacity: 0 }}
                           animate={{ x: 0, opacity: 1 }}
                           transition={{ delay: 1.5, duration: 0.5 }}
                           className="absolute top-10 right-10 w-80 bg-white rounded-xl shadow-2xl border border-gray-100 p-6 z-10"
                         >
                            <div className="flex items-center justify-between mb-4">
                               <div className="flex items-center space-x-2">
                                  <div className="transform rotate-12">
                                    <LogoIcon className="h-6 w-6" />
                                  </div>
                                  <span className="font-bold text-dark text-sm">CRMSYNC</span>
                               </div>
                               <span className="text-xs text-green-600 font-bold bg-green-50 px-2 py-0.5 rounded-full border border-green-100 flex items-center">
                                 <div className="w-1.5 h-1.5 rounded-full bg-green-50 mr-1"></div>
                                 Found 1
                               </span>
                            </div>
                            
                            <div className="space-y-3">
                               <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 group hover:border-primary/30 transition-colors">
                                  <label className="text-xs text-gray-500 block mb-1">Name</label>
                                  <div className="font-medium text-dark flex items-center">
                                    John Doe
                                    <ShieldCheck className="h-3 w-3 text-primary ml-1" />
                                  </div>
                               </div>
                               <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 group hover:border-primary/30 transition-colors">
                                  <label className="text-xs text-gray-500 block mb-1">Company</label>
                                  <div className="font-medium text-dark">TechCorp Inc.</div>
                               </div>
                               <div className="flex space-x-2 pt-1">
                                  <button className="flex-1 bg-primary text-white text-sm py-2 rounded-lg font-medium shadow-lg shadow-primary/20 hover:bg-primary-dark transition-colors">
                                    Add to CRM
                                  </button>
                                  <button className="p-2 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 hover:text-primary transition-colors">
                                    <Target className="h-4 w-4" />
                                  </button>
                               </div>
                            </div>
                         </motion.div>
                      </div>
                   </div>
                </div>
              </div>
            </div>
            
            {/* Decorative blurs behind image */}
            <div className="absolute -top-10 -right-10 w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-[100px] opacity-20 animate-blob"></div>
            <div className="absolute -bottom-10 -left-10 w-72 h-72 bg-teal-400 rounded-full mix-blend-multiply filter blur-[100px] opacity-20 animate-blob animation-delay-2000"></div>
          </motion.div>
        </div>
      </section>

      {/* Company Logos & Trust Signals */}
      <CompanyLogos />

      {/* AI Comparison - Before vs After */}
      <BeforeAfterComparison />

      {/* CRM Integrations Section */}
      <section className="py-24 bg-gradient-to-br from-blue-50 via-white to-teal-50 relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-[120px] opacity-20 animate-blob"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-teal-200 rounded-full mix-blend-multiply filter blur-[120px] opacity-20 animate-blob animation-delay-2000"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <SectionHeader 
            title="🔌 Native CRM Integrations" 
            subtitle="Connect directly to your existing CRM. No CSV exports, no manual imports." 
          />
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-16">
            {/* HubSpot Card */}
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="bg-white rounded-3xl p-10 shadow-xl hover:shadow-2xl transition-all duration-300 border border-gray-100 group hover:border-orange-300"
            >
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                  H
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-dark">HubSpot</h3>
                  <p className="text-gray-500">Marketing & Sales Hub</p>
                </div>
              </div>
              
              <ul className="space-y-3 mb-6">
                <li className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">One-click OAuth connection</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Auto-sync new contacts in real-time</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Smart duplicate detection</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Bi-directional contact sync</span>
                </li>
              </ul>
              
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 text-center">
                <p className="text-sm text-orange-700 font-medium">✓ Available on Pro & Business plans</p>
              </div>
            </motion.div>

            {/* Salesforce Card */}
            <motion.div 
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="bg-white rounded-3xl p-10 shadow-xl hover:shadow-2xl transition-all duration-300 border border-gray-100 group hover:border-blue-300"
            >
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                  S
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-dark">Salesforce</h3>
                  <p className="text-gray-500">Sales Cloud</p>
                </div>
              </div>
              
              <ul className="space-y-3 mb-6">
                <li className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Secure OAuth 2.0 with PKCE</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Push to Leads or Contacts</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Email de-duplication checks</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Automatic contact enrichment</span>
                </li>
              </ul>
              
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
                <p className="text-sm text-blue-700 font-medium">✓ Available on Pro & Business plans</p>
              </div>
            </motion.div>
          </div>

          {/* CTA Section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-16 text-center"
          >
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 max-w-3xl mx-auto">
              <h3 className="text-2xl font-bold text-dark mb-3">More Integrations Coming Soon</h3>
              <p className="text-gray-600 mb-6">
                Pipedrive, Zoho, Microsoft Dynamics, and more. 
                <span className="font-semibold text-primary"> Vote for your favorite CRM!</span>
              </p>
              <button 
                onClick={() => onNavigate('pricing')}
                className="bg-gradient-to-r from-primary to-secondary text-white px-8 py-3 rounded-xl font-semibold hover:shadow-xl hover:scale-105 transition-all duration-300"
              >
                See Pricing & Get Started
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader title="Supercharge Your Inbox" subtitle="Everything you need to manage relationships without leaving Gmail." />
          <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {FEATURES.map((feature, idx) => (
              <motion.div 
                key={idx} 
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0 }
                }}
                whileHover={{ y: -5 }}
                className="p-8 rounded-3xl bg-gray-50 border border-gray-100 hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300 hover:bg-white group"
              >
                <div className="w-14 h-14 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-primary/5 transition-all duration-300 border border-gray-100">
                  <feature.icon className="h-7 w-7 text-gray-600 group-hover:text-primary transition-colors" />
                </div>
                <h3 className="text-xl font-bold text-dark mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-24 bg-dark text-white relative overflow-hidden">
        {/* Abstract shapes in bg */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[100px] translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-secondary/10 rounded-full blur-[100px] -translate-x-1/2 translate-y-1/2"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <SectionHeader title="How It Works" subtitle="Get started in less than 2 minutes." />
          <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center mt-16">
            <motion.div variants={{ hidden: { opacity: 0, x: -50 }, visible: { opacity: 1, x: 0 } }} className="relative group">
              <div className="w-20 h-20 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-8 backdrop-blur-sm border border-white/10 group-hover:border-primary/50 group-hover:bg-primary/10 transition-all duration-300">
                <Download className="h-10 w-10 text-white group-hover:text-primary transition-colors" />
              </div>
              <h3 className="text-xl font-bold mb-3">1. Install & Connect</h3>
              <p className="text-gray-400 leading-relaxed">Install the Chrome extension and open Gmail. CRMSYNC activates automatically.</p>
              <div className="hidden md:block absolute top-10 left-1/2 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent transform translate-x-1/2"></div>
            </motion.div>
            
            <motion.div variants={{ hidden: { opacity: 0, scale: 0.8 }, visible: { opacity: 1, scale: 1 } }} className="relative group">
              <div className="w-20 h-20 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-8 backdrop-blur-sm border border-white/10 group-hover:border-accent/50 group-hover:bg-accent/10 transition-all duration-300">
                <Target className="h-10 w-10 text-white group-hover:text-accent transition-colors" />
              </div>
              <h3 className="text-xl font-bold mb-3">2. Auto Detection</h3>
              <p className="text-gray-400 leading-relaxed">AI extracts names, emails, companies, and titles from your conversations in real-time.</p>
              <div className="hidden md:block absolute top-10 left-1/2 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent transform translate-x-1/2"></div>
            </motion.div>
            
            <motion.div variants={{ hidden: { opacity: 0, x: 50 }, visible: { opacity: 1, x: 0 } }} className="relative group">
              <div className="w-20 h-20 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-8 backdrop-blur-sm border border-white/10 group-hover:border-secondary/50 group-hover:bg-secondary/10 transition-all duration-300">
                <Upload className="h-10 w-10 text-white group-hover:text-secondary transition-colors" />
              </div>
              <h3 className="text-xl font-bold mb-3">3. Organize & Export</h3>
              <p className="text-gray-400 leading-relaxed">Review, approve, and export contacts as CSV to import into any CRM.</p>
            </motion.div>
          </StaggerContainer>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
           <SectionHeader title="Built for Professionals Like You" subtitle="See what early adopters are saying about CRM-Sync." />
           <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-8">
             {TESTIMONIALS.map((t, i) => (
               <motion.div 
                 key={i} 
                 variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
                 whileHover={{ scale: 1.03, y: -5 }}
                 className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 hover:shadow-xl hover:border-blue-100 transition-all duration-300"
               >
                 <div className="flex text-yellow-400 mb-6">
                   {[...Array(5)].map((_, j) => <Star key={j} className="h-4 w-4 fill-current" />)}
                 </div>
                 <p className="text-gray-700 italic mb-8 leading-relaxed">"{t.quote}"</p>
                 <div className="flex items-center">
                   <div className="w-12 h-12 rounded-full bg-gray-200 mr-4 overflow-hidden">
                      <img src={t.image} alt={t.author} className="w-full h-full object-cover" />
                   </div>
                   <div>
                     <div className="font-bold text-dark text-base">{t.author}</div>
                     <div className="text-sm text-gray-500">{t.role} @ {t.company}</div>
                   </div>
                 </div>
               </motion.div>
             ))}
           </StaggerContainer>

           {/* Value Props Instead of Fake Stats */}
           <motion.div 
             initial={{ opacity: 0 }}
             whileInView={{ opacity: 1 }}
             viewport={{ once: true }}
             transition={{ delay: 0.5, duration: 0.8 }}
             className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8 border-t border-gray-200 pt-16"
           >
             {[
               { label: "Setup Time", value: "2 min", icon: Clock },
               { label: "Contacts Limit", value: "Unlimited", icon: Users },
               { label: "Data Storage", value: "Secure", icon: Shield },
               { label: "Export Format", value: "CSV Ready", icon: Download },
             ].map((stat, i) => (
               <div key={i} className="text-center group cursor-default">
                 <div className="flex items-center justify-center mb-3">
                   <stat.icon className="h-8 w-8 text-primary" />
                 </div>
                 <div className="text-3xl font-extrabold text-dark mb-2 group-hover:text-primary transition-colors duration-300">{stat.value}</div>
                 <div className="text-xs text-gray-500 uppercase tracking-widest font-bold">{stat.label}</div>
               </div>
             ))}
           </motion.div>
        </div>
      </section>

      {/* Security & Privacy Section */}
      <SecuritySection />

      {/* Value Calculator */}
      <section className="py-24 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <ValueCalculator />
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-white overflow-hidden">
        <FadeInUp className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-gradient-to-r from-primary to-secondary rounded-[2.5rem] p-12 md:p-20 text-white shadow-2xl shadow-blue-500/30 relative overflow-hidden group">
            <div className="relative z-10">
              <h2 className="text-3xl md:text-5xl font-bold mb-8">Ready to Stop Wasting Time on Data Entry?</h2>
              <p className="text-lg md:text-xl text-white/90 mb-10 max-w-2xl mx-auto">
                Join 4,500+ professionals saving hours every week. Get started in under 2 minutes.
                <br/><span className="font-semibold">No credit card required.</span>
              </p>
              <button 
                onClick={() => window.open('https://chrome.google.com/webstore', '_blank')}
                className="bg-white text-primary hover:bg-gray-50 border-none shadow-xl px-12 py-5 text-lg rounded-xl font-bold hover:scale-105 transition-all duration-300 inline-flex items-center"
              >
                <Chrome className="mr-3 h-5 w-5" />
                Add to Chrome — It's Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </button>
              <p className="mt-6 text-sm text-white/70">
                ✓ Free forever plan  •  ✓ 2-minute setup  •  ✓ Cancel anytime
              </p>
            </div>
            
            {/* Animated BG elements */}
            <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-white opacity-10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000 ease-out"></div>
            <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-80 h-80 bg-white opacity-10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000 ease-out delay-100"></div>
          </div>
        </FadeInUp>
      </section>
    </div>
  );
};
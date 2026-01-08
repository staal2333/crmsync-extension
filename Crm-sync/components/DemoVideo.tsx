import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Play, CheckCircle2 } from 'lucide-react';

export const DemoVideo: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.5 }}
      className="mt-20 relative mx-auto max-w-5xl"
    >
      {/* Main Video Container */}
      <div className="relative group">
        {/* Video Wrapper with Browser Chrome */}
        <div className="bg-dark/90 rounded-xl shadow-2xl overflow-hidden border border-gray-800 p-2 md:p-3 backdrop-blur-sm">
          <div className="bg-white rounded-lg overflow-hidden shadow-inner relative">
            {/* Mock Browser Header */}
            <div className="bg-gray-100 border-b border-gray-200 p-3 flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-red-400"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
              <div className="w-3 h-3 rounded-full bg-green-400"></div>
              <div className="ml-4 bg-white border border-gray-200 rounded px-3 py-1 text-xs text-gray-400 flex-grow max-w-md">
                <span>mail.google.com/mail/u/0/#inbox</span>
              </div>
            </div>

            {/* Video / Placeholder Area */}
            <div className="relative h-[400px] md:h-[500px] bg-gradient-to-br from-blue-50 via-white to-teal-50 flex items-center justify-center overflow-hidden">
              {/* PLACEHOLDER - Replace this with your actual video */}
              {!isPlaying ? (
                <>
                  {/* Static Preview Image / Mockup */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center space-y-6 z-10">
                      <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto cursor-pointer hover:bg-primary/20 transition-all group-hover:scale-110 duration-300"
                        onClick={() => setIsPlaying(true)}
                      >
                        <Play className="w-12 h-12 text-primary ml-1" fill="currentColor" />
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm font-semibold text-gray-700">
                          See CRM-Sync in Action
                        </p>
                        <p className="text-xs text-gray-500">
                          15-second demo • No sound needed
                        </p>
                      </div>
                    </div>

                    {/* Demo Flow Visualization */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-20">
                      <div className="grid grid-cols-3 gap-8 text-center">
                        <div className="space-y-2">
                          <div className="w-16 h-16 bg-blue-200 rounded-xl mx-auto"></div>
                          <p className="text-xs font-medium text-gray-600">Open Email</p>
                        </div>
                        <div className="space-y-2">
                          <div className="w-16 h-16 bg-teal-200 rounded-xl mx-auto"></div>
                          <p className="text-xs font-medium text-gray-600">AI Detects</p>
                        </div>
                        <div className="space-y-2">
                          <div className="w-16 h-16 bg-green-200 rounded-xl mx-auto"></div>
                          <p className="text-xs font-medium text-gray-600">Sync to CRM</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="absolute inset-0 bg-white flex items-center justify-center">
                  {/* REPLACE THIS WITH YOUR ACTUAL VIDEO ELEMENT */}
                  {/* Example for when you have video file: */}
                  {/*
                  <video 
                    autoPlay 
                    loop 
                    muted 
                    playsInline
                    className="w-full h-full object-contain"
                  >
                    <source src="/demo-video.mp4" type="video/mp4" />
                    <source src="/demo-video.webm" type="video/webm" />
                  </video>
                  */}
                  
                  {/* Temporary animated placeholder */}
                  <div className="text-center space-y-4 p-12">
                    <div className="animate-pulse space-y-4">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
                      <div className="h-32 bg-gradient-to-r from-blue-100 to-teal-100 rounded-lg"></div>
                      <div className="flex justify-center space-x-2">
                        <CheckCircle2 className="w-6 h-6 text-green-500" />
                        <span className="text-sm font-medium text-gray-700">Contact synced successfully!</span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-8">
                      💡 To add your actual demo: Replace this div with a {'<video>'} element<br/>
                      pointing to your screen recording
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Decorative Background Blurs */}
        <div className="absolute -top-10 -right-10 w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-[100px] opacity-20 animate-blob pointer-events-none"></div>
        <div className="absolute -bottom-10 -left-10 w-72 h-72 bg-teal-400 rounded-full mix-blend-multiply filter blur-[100px] opacity-20 animate-blob animation-delay-2000 pointer-events-none"></div>
      </div>

      {/* Features Below Video */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
        {[
          { label: 'AI Detection', time: '2 seconds', icon: '🤖' },
          { label: 'Zero Manual Entry', time: 'Fully Automated', icon: '⚡' },
          { label: 'Works with Gmail', time: 'Install & Go', icon: '✅' },
        ].map((feature, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 + i * 0.1 }}
            className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow text-center"
          >
            <div className="text-2xl mb-2">{feature.icon}</div>
            <div className="text-sm font-semibold text-gray-900">{feature.label}</div>
            <div className="text-xs text-gray-500 mt-1">{feature.time}</div>
          </motion.div>
        ))}
      </div>

      {/* Recording Instructions (Hidden in Production) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
          <p className="font-semibold mb-2">📹 How to Record Your Demo Video:</p>
          <ol className="list-decimal list-inside space-y-1 text-xs">
            <li>Open Gmail in Chrome with your extension installed</li>
            <li>Use QuickTime (Mac) or OBS (Windows) to record screen</li>
            <li>Show: Open email → Extension detects contact → Click "Add to CRM" → Success message</li>
            <li>Keep it under 20 seconds</li>
            <li>Export as MP4, save to <code className="bg-yellow-100 px-1 rounded">/public/demo-video.mp4</code></li>
            <li>Replace the placeholder div with: <code className="bg-yellow-100 px-1 rounded">{'<video src="/demo-video.mp4" autoPlay loop muted playsInline />'}</code></li>
          </ol>
        </div>
      )}
    </motion.div>
  );
};

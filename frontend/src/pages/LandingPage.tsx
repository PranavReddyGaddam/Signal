import FloatingLines from '@/components/FloatingLines';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import ChatInput from '@/components/ui/chat-input';
import TestPopup from '@/components/ui/test-popup';
import AnimatedSVGOverlay from '@/components/ui/animated-svg-overlay';
import { useState } from 'react';

// Hero line color (aqua blue)
const HERO_LINE_COLOR = ['#228B22'];

export default function LandingPage() {
  const navigate = useNavigate();
  const [isTestPopupOpen, setIsTestPopupOpen] = useState(false);

  const handleGetStarted = (userInput: string) => {
    if (userInput.trim()) {
      navigate('/dashboard', { state: { initialInput: userInput } });
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <div className="relative" style={{ fontFamily: 'Aeonik, sans-serif' }}>
      {/* Add Google Fonts and Custom Font */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link 
        href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&display=swap" 
        rel="stylesheet" 
      />
      <style>{`
        @font-face {
          font-family: 'Aeonik';
          src: url('/fonts/Aeonik-Regular.ttf') format('truetype');
          font-weight: 400;
          font-style: normal;
        }
      `}</style>

      {/* Floating Navigation */}
      <nav className="fixed top-8 left-0 right-0 z-50 transition-all duration-300 px-8" id="main-nav">
        <div className="max-w-7xl mx-auto bg-black/30 border border-white/20 backdrop-blur-sm rounded-2xl px-6 py-4 transition-all">
          <div className="flex items-center justify-between">
            {/* Logo - Extreme Left */}
            <div className="flex items-center space-x-2 flex-shrink-0">
              <span className="font-bold text-xl text-white">
                Signal
              </span>
            </div>
            
            {/* Navigation Links - Center */}
            <div className="flex items-center space-x-2 absolute left-1/2 transform -translate-x-1/2">
              <Button 
                variant="ghost" 
                className="text-gray-300 hover:text-white hover:bg-white/10 font-medium text-sm px-4 py-2 h-10 rounded-xl transition-colors"
                onClick={() => {
                  const element = document.getElementById('about');
                  if (element) {
                    element.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
              >
                About
              </Button>
              <Button 
                variant="ghost" 
                className="text-gray-300 hover:text-white hover:bg-white/10 font-medium text-sm px-4 py-2 h-10 rounded-xl transition-colors"
                onClick={() => {
                  const element = document.getElementById('features');
                  if (element) {
                    element.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
              >
                Features
              </Button>
              <Button 
                variant="ghost" 
                className="text-gray-300 hover:text-white hover:bg-white/10 font-medium text-sm px-4 py-2 h-10 rounded-xl transition-colors"
                onClick={() => setIsTestPopupOpen(true)}
              >
                Test
              </Button>
            </div>
            
            {/* Sign In Button - Extreme Right */}
            <div className="flex items-center flex-shrink-0">
              <Button 
                variant="outline" 
                className="text-white border-white/30 bg-white/10 hover:bg-white/20 hover:text-white font-medium text-sm px-5 py-2 h-10 rounded-xl transition-colors"
              >
                Sign In
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section - Full Viewport with Floating Lines */}
      <div className="relative h-screen overflow-hidden">
        {/* FloatingLines Background - Only for Hero */}
        <div className="absolute inset-0 z-0">
          <FloatingLines 
            linesGradient={HERO_LINE_COLOR}
            animationSpeed={0.8}
            interactive={true}
            parallax={true}
            parallaxStrength={0.15}
            mixBlendMode="screen"
          />
        </div>

        {/* Dark overlay for better text contrast */}
        <div className="absolute inset-0 bg-black bg-opacity-60 z-10" />

        {/* Hero Content */}
        <div className="relative z-20 h-screen flex items-center justify-center px-6">
          <div className="max-w-4xl w-full text-center">
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 tracking-wide">
              Launch GTM Plays That Actually Win.
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-100 mb-12 max-w-2xl mx-auto font-light">
            </p>

            {/* CTA Section */}
            <div className="max-w-2xl mx-auto">
              <ChatInput 
                onSubmit={handleGetStarted}
                placeholder="e.g., Magic with AI-powered insights"
              />
            </div>
          </div>
        </div>
      </div>

      
      {/* About Section - Unified Design */}
      <section id="about" className="relative py-20 overflow-hidden bg-black">
        <div className="max-w-7xl mx-auto px-8">
          {/* Section Header */}
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">About</h2>
          </div>
          <div className="grid lg:grid-cols-[3fr_2fr] items-stretch">
            {/* Left Side - Background Image (bg-5) */}
            <div className="relative order-2 lg:order-1 z-10 lg:-mr-8">
              <div 
                className="relative rounded-3xl overflow-hidden shadow-2xl bg-cover bg-center h-full"
                style={{
                  backgroundImage: 'url(/bg-5.jpg)',
                  minHeight: '400px'
                }}
              >
                <AnimatedSVGOverlay variant="about" />
              </div>
            </div>
            
            {/* Right Side - Content with Dark Background */}
            <div className="space-y-8 order-1 lg:order-2 bg-gray-950 p-12 rounded-2xl lg:rounded-r-2xl lg:rounded-l-none flex flex-col justify-center items-center text-center min-h-[400px] border-2 border-white">
              <div className="space-y-6 max-w-lg">
                <h2 className="text-[30px] font-bold text-white leading-tight">
                  Your AI-Powered GTM Co-Pilot
                </h2>
              </div>
              
              <div className="space-y-6 max-w-lg">
                <p className="text-[14px] text-gray-300 leading-relaxed font-light text-center">
                  Stop guessing your go-to-market strategy. Signal analyzes thousands of successful companies to deliver data-driven insights tailored to your industry, target market, and business model.
                </p>
              </div>
              
              {/* CTA Button */}
              <div className="pt-4">
                <button 
                  onClick={() => navigate('/dashboard')}
                  className="bg-white text-gray-900 font-medium px-6 py-3 rounded-full hover:bg-gray-100 transition-colors"
                >
                  Start strategizing
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - Exact Replica */}
      <section id="features" className="relative py-20 bg-black">
        <div className="max-w-7xl mx-auto px-8">
          {/* Section Header */}
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">Features</h2>
          </div>
          <div className="grid lg:grid-cols-[2fr_3fr] items-stretch">
            {/* Left Side - Content with Dark Background */}
            <div className="space-y-8 order-2 lg:order-1 bg-gray-950 p-12 rounded-2xl lg:rounded-l-2xl lg:rounded-r-none flex flex-col justify-center items-center text-center min-h-[400px] border border-white relative z-0">
              <div className="space-y-6 max-w-lg">
                <h3 className="text-[30px] font-bold text-white leading-tight">
                  Deploy Winning GTM Strategies in Minutes
                </h3>
              </div>
              
              <div className="space-y-6 max-w-lg">
                <p className="text-[14px] text-gray-300 leading-relaxed font-light text-center">
                  From product launches to market expansion, Signal delivers battle-tested go-to-market strategies used by unicorns and industry leaders. Simply describe your goal, get instant actionable plans.
                </p>
              </div>
              
              {/* CTA Button */}
              <div className="pt-4">
                <button 
                  onClick={() => navigate('/dashboard')}
                  className="bg-white text-gray-900 font-medium px-6 py-3 rounded-full hover:bg-gray-100 transition-colors"
                >
                  Launch faster
                </button>
              </div>
            </div>
            
            {/* Right Side - Background Image (bg-6) */}
            <div className="relative order-1 lg:order-2 z-10 lg:-ml-8">
              <div 
                className="relative rounded-3xl overflow-hidden shadow-2xl bg-cover bg-center h-full"
                style={{
                  backgroundImage: 'url(/bg-6.jpg)',
                  minHeight: '400px'
                }}
              >
                <AnimatedSVGOverlay variant="strategy" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - Component 2 (Reversed) */}
      <section className="relative py-20 bg-black">
        <div className="max-w-7xl mx-auto px-8">
          <div className="grid lg:grid-cols-[3fr_2fr] items-stretch">
            {/* Left Side - Background Image (bg-7) */}
            <div className="relative order-2 lg:order-1 z-10 lg:-mr-8">
              <div 
                className="relative rounded-3xl overflow-hidden shadow-2xl bg-cover bg-center h-full"
                style={{
                  backgroundImage: 'url(/bg-7.jpg)',
                  minHeight: '400px'
                }}
              >
                <AnimatedSVGOverlay variant="analytics" />
              </div>
            </div>

            {/* Right Side - Content with Dark Background */}
            <div className="space-y-8 order-1 lg:order-2 bg-gray-950 p-12 rounded-2xl lg:rounded-r-2xl lg:rounded-l-none flex flex-col justify-center items-center text-center min-h-[400px] border border-white relative z-0">
              <div className="space-y-6 max-w-lg">
                <h3 className="text-[30px] font-bold text-white leading-tight">
                  Market Intelligence That Drives Revenue
                </h3>
              </div>
              
              <div className="space-y-6 max-w-lg">
                <p className="text-[14px] text-gray-300 leading-relaxed font-light text-center">
                  Access real-time market data, competitor analysis, and customer insights. Signal's AI identifies untapped opportunities and warns you about market threats before they impact your bottom line.
                </p>
              </div>
              
              {/* CTA Button */}
              <div className="pt-4">
                <button 
                  onClick={() => navigate('/dashboard')}
                  className="bg-white text-gray-900 font-medium px-6 py-3 rounded-full hover:bg-gray-100 transition-colors"
                >
                  Analyze market
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - Component 3 */}
      <section className="relative py-20 bg-black">
        <div className="max-w-7xl mx-auto px-8">
          <div className="grid lg:grid-cols-[2fr_3fr] items-stretch">
            {/* Left Side - Content with Dark Background */}
            <div className="space-y-8 order-2 lg:order-1 bg-gray-950 p-12 rounded-2xl lg:rounded-l-2xl lg:rounded-r-none flex flex-col justify-center items-center text-center min-h-[400px] border border-white relative z-0">
              <div className="space-y-6 max-w-lg">
                <h3 className="text-[30px] font-bold text-white leading-tight">
                  High-Intent Leads, Delivered Daily
                </h3>
              </div>
              
              <div className="space-y-6 max-w-lg">
                <p className="text-[14px] text-gray-300 leading-relaxed font-light text-center">
                  Signal's AI scours the market to identify prospects actively seeking solutions like yours. Get qualified leads with verified contact info, buying signals, and personalized outreach strategies.
                </p>
              </div>
              
              {/* CTA Button */}
              <div className="pt-4">
                <button 
                  onClick={() => navigate('/dashboard')}
                  className="bg-white text-gray-900 font-medium px-6 py-3 rounded-full hover:bg-gray-100 transition-colors"
                >
                  Get leads
                </button>
              </div>
            </div>
            
            {/* Right Side - Background Image (bg-8) */}
            <div className="relative order-1 lg:order-2 z-10 lg:-ml-8">
              <div 
                className="relative rounded-3xl overflow-hidden shadow-2xl bg-cover bg-center h-full"
                style={{
                  backgroundImage: 'url(/bg-8.jpg)',
                  minHeight: '400px'
                }}
              >
                <AnimatedSVGOverlay variant="leads" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Test Popup Modal */}
      <TestPopup 
        isOpen={isTestPopupOpen} 
        onClose={() => setIsTestPopupOpen(false)} 
      />

    </div>
  );
}

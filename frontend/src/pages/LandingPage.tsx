import FloatingLines from '@/components/FloatingLines';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import AI_Input_Search from '@/components/kokonutui/ai-input-search';

// Smooth scroll function
const scrollToSection = (sectionId: string) => {
  const element = document.getElementById(sectionId);
  if (element) {
    element.scrollIntoView({ behavior: 'smooth' });
  }
};

// Google-themed colors
const GOOGLE_COLORS = [
  '#4285F4',  // Blue
  '#EA4335',  // Red
  '#FBBC05',  // Yellow
  '#34A853',  // Green
  '#5F6368',  // Gray
  '#1A73E8',  // Bright Blue
  '#D93025',  // Dark Red
  '#F9AB00',  // Gold
];

export default function LandingPage() {
  const navigate = useNavigate();
  const [currentSection, setCurrentSection] = useState('hero');

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      const windowHeight = window.innerHeight;
      
      if (scrollPosition < windowHeight * 0.5) {
        setCurrentSection('hero');
      } else if (scrollPosition < windowHeight * 1.5) {
        setCurrentSection('about');
      } else {
        setCurrentSection('features');
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial call
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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

      {/* Fixed Navigation */}
      <nav className="fixed top-0 left-0 right-0 flex justify-between items-center p-6 z-50 transition-all duration-300" id="main-nav">
        <div className="flex items-center space-x-2">
          <span className={`font-bold text-xl nav-logo ${currentSection === 'hero' ? 'text-white' : 'text-gray-800'}`}>
            Signal
          </span>
        </div>
        <div className="flex space-x-4">
          <Button 
            variant="ghost" 
            className={`font-medium nav-text ${
              currentSection === 'hero' 
                ? 'text-white hover:text-blue-300' 
                : 'text-gray-800 hover:text-blue-600'
            }`}
            onClick={() => scrollToSection('about')}
          >
            About
          </Button>
          <Button 
            variant="ghost" 
            className={`font-medium nav-text ${
              currentSection === 'hero' 
                ? 'text-white hover:text-blue-300' 
                : 'text-gray-800 hover:text-blue-600'
            }`}
            onClick={() => scrollToSection('features')}
          >
            Features
          </Button>
          <Button 
            variant="outline" 
            className={`font-medium nav-btn ${
              currentSection === 'hero' 
                ? 'text-black border-white hover:bg-white hover:text-gray-900' 
                : 'text-gray-800 border-gray-600 hover:bg-gray-800 hover:text-white'
            }`}
          >
            Sign In
          </Button>
        </div>
      </nav>

      {/* Hero Section - Full Viewport with Floating Lines */}
      <div className="relative h-screen overflow-hidden">
        {/* FloatingLines Background - Only for Hero */}
        <div className="absolute inset-0 z-0">
          <FloatingLines 
            linesGradient={GOOGLE_COLORS}
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
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
              <span style={{ color: '#4285F4' }}>Transform</span>{' '}
              <span style={{ color: '#EA4335' }}>Your</span>{' '}
              <span style={{ color: '#FBBC05' }}>Go-To</span>{' '}
              <span style={{ color: '#34A853' }}>Market</span>{' '}
              <span style={{ color: '#34A853' }}>Strategy</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-100 mb-12 max-w-2xl mx-auto font-light">
            </p>

            {/* CTA Section */}
            <div className="max-w-2xl mx-auto ">
              <AI_Input_Search 
                onSubmit={handleGetStarted}
                minHeight={104}
                placeholder="e.g., Magic with AI-powered insights"
              />
            </div>
          </div>
        </div>
      </div>

        {/* About Section - Soft Blended Colors */}
      <section id="about" className="min-h-screen flex">
        {/* Left Side - Soft Blue Gradient */}
        <div className="w-1/2 flex items-center justify-center px-12" style={{ 
          background: 'linear-gradient(135deg, #E8F0FE 0%, #D2E3FC 50%, #B8D4F1 100%)'
        }}>
          <div className="max-w-md">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6">
              About Signal
            </h2>
            <p className="text-xl text-gray-700 leading-relaxed">
              Revolutionizing go-to-market strategies with AI-powered insights and data-driven patterns.
            </p>
          </div>
        </div>
        
        {/* Right Side - Soft Red/Pink Gradient */}
        <div className="w-1/2 flex items-center justify-center px-12" style={{ 
          background: 'linear-gradient(135deg, #FCE8E6 0%, #FAD2CF 50%, #F8BBD0 100%)'
        }}>
          <div className="max-w-md space-y-6">
            <p className="text-lg text-gray-700 leading-relaxed">
              Signal leverages advanced artificial intelligence and machine learning algorithms to analyze thousands of successful companies across various industries. We identify proven patterns and strategies that drive growth.
            </p>
            <p className="text-lg text-gray-700 leading-relaxed">
              Founded by data scientists and business strategists, we address the challenges of traditional market research by providing real-time insights and predictive analytics for informed decision-making.
            </p>
            <p className="text-lg text-gray-700 leading-relaxed">
              Our proprietary AI engine continuously learns from market data, customer behavior, and competitive landscapes to deliver actionable recommendations tailored to your specific business goals.
            </p>
          </div>
        </div>
      </section>

      {/* Features Section - Reference Layout Recreation */}
      <section id="features" className="min-h-screen py-20" style={{ 
        background: 'linear-gradient(180deg, #FEF7E0 0%, #FFF3E0 50%, #FEF9E7 100%)'
      }}>
        <div className="max-w-7xl mx-auto px-8">
          <div className="grid lg:grid-cols-[1.2fr_1fr] gap-12 items-center">
            {/* Left Side - Image */}
            <div className="relative order-1 lg:order-1">
              <div className="aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl">
                <img 
                  src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=600&fit=crop&crop=center&auto=format" 
                  alt="Sales Analytics Dashboard"
                  className="w-full h-full object-cover"
                />
                {/* Overlay gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
              </div>
              
              {/* Floating cards */}
              <div className="absolute -top-4 -left-4 bg-white rounded-xl p-3 shadow-lg">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-800">Sales Growth</p>
                    <p className="text-xs text-gray-600">+24.5%</p>
                  </div>
                </div>
              </div>
              
              <div className="absolute -bottom-4 -right-4 bg-white rounded-xl p-3 shadow-lg">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-800">Conversion Rate</p>
                    <p className="text-xs text-gray-600">+18.2%</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Right Side - Content */}
            <div className="space-y-6 order-2 lg:order-2">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-800 leading-tight">
                Powerful Features to Transform Your Business
              </h2>
              
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <div className="w-5 h-5 rounded-full bg-blue-500"></div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-1">
                      AI-Powered Pattern Recognition
                    </h3>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      Advanced algorithms analyze thousands of successful strategies to identify patterns that work for your specific industry and target market.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <div className="w-5 h-5 rounded-full bg-green-500"></div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-1">
                      Real-Time Market Intelligence
                    </h3>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      Stay ahead of the competition with up-to-date market insights, trends, and opportunities tailored to your business objectives.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0">
                    <div className="w-5 h-5 rounded-full bg-yellow-500"></div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-1">
                      Lead Generation & Scoring
                    </h3>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      Automatically generate and qualify leads based on your ideal customer profile, ensuring your sales team focuses on the most promising opportunities.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                    <div className="w-5 h-5 rounded-full bg-red-500"></div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-1">
                      Performance Analytics
                    </h3>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      Track and measure the effectiveness of your go-to-market initiatives with comprehensive analytics and actionable insights for continuous improvement.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}

import React from 'react';
import { useLocation } from 'react-router-dom';

export function GTMDashboard() {
  const location = useLocation();

  // Check for initial input from landing page
  React.useEffect(() => {
    if (location.state?.initialInput) {
      console.log('Initial input from landing page:', location.state.initialInput);
      // You can handle the initial input here if needed
    }
  }, [location.state]);

  return (
    <div style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
      {/* Add Google Fonts */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link 
        href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&display=swap" 
        rel="stylesheet" 
      />
      
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Signal Dashboard</h1>
          <p className="text-xl text-muted-foreground mb-8">
            {location.state?.initialInput ? 
              `Analyzing: ${location.state.initialInput}` : 
              'Welcome to the Signal Dashboard'
            }
          </p>
          <div className="bg-muted/50 p-8 rounded-lg">
            <p className="text-sm">Dashboard components are being prepared...</p>
            <p className="text-xs text-muted-foreground mt-2">
              Initial input: {location.state?.initialInput || 'None provided'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

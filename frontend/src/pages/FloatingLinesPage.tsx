import { useState } from 'react'
import FloatingLines from '@/components/FloatingLines'

// Color preset dictionary with multiple color ranges
const COLOR_PRESETS = {
  sunset: [
    '#FF6B6B',    // Coral Red
    '#FF8E53',    // Orange
    '#FFD93D',    // Yellow
    '#6BCF7F',    // Green
    '#4ECDC4',    // Teal
    '#45B7D1',    // Sky Blue
    '#5B86E5',    // Blue
    '#8E44AD',    // Purple
  ],
  ocean: [
    '#006994',    // Deep Ocean
    '#0099CC',    // Ocean Blue
    '#00B4D8',    // Light Blue
    '#48CAE4',    // Sky Blue
    '#90E0EF',    // Pale Blue
    '#ADE8F4',    // Lighter Blue
    '#CAF0F8',    // Very Light Blue
    '#03045E',    // Midnight Blue
  ],
  forest: [
    '#2D6A4F',    // Dark Green
    '#40916C',    // Forest Green
    '#52B788',    // Medium Green
    '#74C69D',    // Light Green
    '#95D5B2',    // Pale Green
    '#B7E4C7',    // Lighter Green
    '#D8F3DC',    // Very Light Green
    '#1B5E20',    // Deep Forest
  ],
  fire: [
    '#FF0000',    // Red
    '#FF4500',    // Orange Red
    '#FF6347',    // Tomato
    '#FF8C00',    // Dark Orange
    '#FFA500',    // Orange
    '#FFD700',    // Gold
    '#FFFF00',    // Yellow
    '#FFA07A',    // Light Salmon
  ],
  purple: [
    '#6A0DAD',    // Purple
    '#7B68EE',    // Medium Slate Blue
    '#9370DB',    // Medium Purple
    '#8A2BE2',    // Blue Violet
    '#9400D3',    // Violet
    '#9932CC',    // Dark Orchid
    '#BA55D3',    // Medium Orchid
    '#DDA0DD',    // Plum
  ],
  monochrome: [
    '#000000',    // Black
    '#2C2C2C',    // Dark Gray
    '#555555',    // Medium Dark Gray
    '#808080',    // Medium Gray
    '#AAAAAA',    // Light Gray
    '#D3D3D3',    // Lighter Gray
    '#E5E5E5',    // Very Light Gray
    '#FFFFFF',    // White
  ],
  neon: [
    '#FF10F0',    // Neon Pink
    '#00FFF0',    // Neon Cyan
    '#39FF14',    // Neon Green
    '#FF3131',    // Neon Red
    '#FFFF33',    // Neon Yellow
    '#FF10F0',    // Neon Magenta
    '#1F51FF',    // Neon Blue
    '#FF6700',    // Neon Orange
  ],
  pastel: [
    '#FFB3BA',    // Light Pink
    '#FFDFBA',    // Light Orange
    '#FFFFBA',    // Light Yellow
    '#BAFFC9',    // Light Green
    '#BAE1FF',    // Light Blue
    '#E0BBE4',    // Light Purple
    '#FEC8D8',    // Light Rose
    '#FFDFD3',    // Light Peach
  ]
}

// Helper function to generate color range based on base color
function generateColorRange(baseColor: string): string[] {
  // Convert hex to RGB
  const hex = baseColor.replace('#', '')
  const r = parseInt(hex.substr(0, 2), 16)
  const g = parseInt(hex.substr(2, 2), 16)
  const b = parseInt(hex.substr(4, 2), 16)
  
  const colors: string[] = []
  
  // Generate 8 colors based on the base color with variations
  for (let i = 0; i < 8; i++) {
    const factor = 0.3 + (i * 0.1) // Variation factor from 0.3 to 1.0
    const variation = Math.sin(i * 0.8) * 30 // Sinusoidal variation
    
    const newR = Math.min(255, Math.max(0, Math.round(r * factor + variation)))
    const newG = Math.min(255, Math.max(0, Math.round(g * factor + variation)))
    const newB = Math.min(255, Math.max(0, Math.round(b * factor + variation)))
    
    colors.push(`#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`)
  }
  
  return colors
}

export function FloatingLinesPage() {
  const [selectedPreset, setSelectedPreset] = useState<keyof typeof COLOR_PRESETS>('fire')
  const [isManualMode, setIsManualMode] = useState(false)
  const [baseColor, setBaseColor] = useState('#FF0000')
  const [showControls, setShowControls] = useState(false)

  const currentColors = isManualMode ? generateColorRange(baseColor) : COLOR_PRESETS[selectedPreset]

  const handlePresetChange = (preset: keyof typeof COLOR_PRESETS) => {
    setSelectedPreset(preset)
    setIsManualMode(false)
  }

  const handleBaseColorChange = (color: string) => {
    setBaseColor(color)
    setIsManualMode(true)
  }

  return (
    <div className="fixed inset-0 z-0">
      {/* Hero Component Name */}
      <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold text-white">
          Floating Lines
        </h1>
      </div>

      {/* Glassmorphic Color Controls Panel - Right Corner Positioning */}
      <div className="absolute top-4 right-4 z-20">
        <button
          onClick={() => setShowControls(!showControls)}
          className="px-4 py-2 bg-white bg-opacity-10 backdrop-blur-md text-white rounded-xl border border-white border-opacity-20 hover:bg-opacity-20 transition-all duration-300 shadow-lg"
        >
          {showControls ? 'Hide' : 'Show'} Colors
        </button>
        
        {/* Smooth Animated Panel - Fixed Position */}
        <div 
          className={`absolute top-full right-0 mt-2 origin-top-right transition-all duration-300 ease-out ${
            showControls 
              ? 'opacity-100 scale-100 pointer-events-auto' 
              : 'opacity-0 scale-95 pointer-events-none'
          }`}
        >
          <div className="w-80 p-6 bg-white bg-opacity-10 backdrop-blur-md rounded-2xl border border-white border-opacity-20 shadow-2xl">
            <h3 className="text-lg font-semibold text-white mb-6">Color Controls</h3>
            
            {/* Mode Toggle */}
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => setIsManualMode(false)}
                className={`flex-1 px-3 py-2 text-sm rounded-xl transition-all duration-300 ${
                  !isManualMode 
                    ? 'bg-white bg-opacity-30 text-white shadow-lg' 
                    : 'bg-white bg-opacity-10 text-white hover:bg-opacity-20'
                }`}
              >
                Presets
              </button>
              <button
                onClick={() => setIsManualMode(true)}
                className={`flex-1 px-3 py-2 text-sm rounded-xl transition-all duration-300 ${
                  isManualMode 
                    ? 'bg-white bg-opacity-30 text-white shadow-lg' 
                    : 'bg-white bg-opacity-10 text-white hover:bg-opacity-20'
                }`}
              >
                Color Slider
              </button>
            </div>

            {/* Preset Selection */}
            {!isManualMode && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-white text-opacity-90 mb-3">Color Presets</h4>
                <div className="grid grid-cols-2 gap-2">
                  {Object.keys(COLOR_PRESETS).map((preset) => (
                    <button
                      key={preset}
                      onClick={() => handlePresetChange(preset as keyof typeof COLOR_PRESETS)}
                      className={`px-3 py-2 text-sm rounded-xl capitalize transition-all duration-300 ${
                        selectedPreset === preset
                          ? 'bg-white bg-opacity-30 text-white shadow-lg'
                          : 'bg-white bg-opacity-10 text-white hover:bg-opacity-20'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
                
                {/* Color Preview */}
                <div className="mt-6">
                  <h4 className="text-sm font-medium text-white text-opacity-90 mb-3">Color Preview</h4>
                  <div className="flex gap-1 p-2 bg-black bg-opacity-20 rounded-xl">
                    {currentColors.map((color, index) => (
                      <div
                        key={index}
                        className="flex-1 h-8 rounded shadow-md"
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Enhanced Single Color Slider */}
            {isManualMode && (
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-white text-opacity-90 mb-4">Base Color</h4>
                
                {/* Custom Styled Color Picker */}
                <div className="flex items-center gap-4 p-4 bg-black bg-opacity-20 rounded-xl">
                  <div className="relative group">
                    {/* Custom color input wrapper */}
                    <div className="relative w-20 h-20 rounded-xl overflow-hidden shadow-xl ring-2 ring-white ring-opacity-30 transition-all duration-300 group-hover:ring-opacity-50">
                      {/* Color preview background */}
                      <div 
                        className="absolute inset-0 transition-all duration-300 pointer-events-none"
                        style={{ backgroundColor: baseColor }}
                      />
                      {/* Glass overlay */}
                      <div className="absolute inset-0 bg-gradient-to-br from-white from-opacity-20 to-transparent pointer-events-none" />
                      
                      {/* Styled color input */}
                      <input
                        type="color"
                        value={baseColor}
                        onChange={(e) => handleBaseColorChange(e.target.value)}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        style={{
                          // Ensure the input is clickable
                          pointerEvents: 'auto',
                        }}
                      />
                      
                      {/* Custom border effect */}
                      <div className="absolute inset-0 rounded-xl border-2 border-white border-opacity-20 pointer-events-none z-20" />
                    </div>
                    
                    {/* Hover effect ring */}
                    <div className="absolute -inset-1 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 opacity-0 group-hover:opacity-30 blur transition-opacity duration-300" />
                  </div>
                  
                  <div className="flex-1">
                    <input
                      type="text"
                      value={baseColor}
                      onChange={(e) => handleBaseColorChange(e.target.value)}
                      className="w-full px-3 py-2 text-white bg-white bg-opacity-10 border border-white border-opacity-20 rounded-xl focus:outline-none focus:border-opacity-40 focus:bg-opacity-20 transition-all duration-300"
                      placeholder="#000000"
                    />
                    <p className="text-xs text-white text-opacity-70 mt-2">
                      Click the color box to pick a custom color
                    </p>
                    
                    {/* Color value display */}
                    <div className="mt-3 flex items-center gap-2">
                      <div 
                        className="w-6 h-6 rounded-full border border-white border-opacity-30 shadow-md"
                        style={{ backgroundColor: baseColor }}
                      />
                      <span className="text-xs text-white text-opacity-80 font-mono">
                        {baseColor.toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Generated Color Range Preview */}
                <div className="mt-6">
                  <h4 className="text-sm font-medium text-white text-opacity-90 mb-3">Generated Range</h4>
                  <div className="flex gap-1 p-2 bg-black bg-opacity-20 rounded-xl">
                    {currentColors.map((color, index) => (
                      <div
                        key={index}
                        className="flex-1 h-8 rounded shadow-md transition-all duration-300 hover:scale-105 cursor-pointer"
                        style={{ backgroundColor: color }}
                        title={color}
                        onClick={() => handleBaseColorChange(color)}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-white text-opacity-60 mt-2 text-center">
                    Click any color above to use it as the base
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <FloatingLines 
        linesGradient={currentColors}
      />
    </div>
  )
}

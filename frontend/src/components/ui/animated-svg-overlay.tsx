"use client";

import { motion } from "motion/react";
import { useInView } from "motion/react";
import { useRef } from "react";

interface AnimatedSVGOverlayProps {
  variant: "strategy" | "analytics" | "leads" | "about" | "compact";
  className?: string;
}

export default function AnimatedSVGOverlay({ variant, className = "" }: AnimatedSVGOverlayProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  const renderSVG = () => {
    switch (variant) {
      case "strategy":
        return (
          <svg preserveAspectRatio="xMidYMid meet" data-bbox="72 46 451 628" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 595 625" height="625" width="595" data-type="ugc" role="presentation" aria-hidden="true" aria-label="">
            <g>
              <path fillOpacity=".5" fill="#000000" d="M231.013 144.475v.735l1.987 1.843 1.987-1.843v-.735L233 146.29z"></path>
              <g filter="url(#strategy-shadow)">
                <path shapeRendering="crispEdges" fillOpacity=".6" fill="url(#strategy-gradient)" d="M523 70.37v579.26c0 13.46-10.91 24.37-24.37 24.37H96.37C82.91 674 72 663.09 72 649.63V70.37C72 56.91 82.91 46 96.37 46h402.26C512.09 46 523 56.91 523 70.37"></path>
                <path shapeRendering="crispEdges" stroke="url(#strategy-border)" d="M522.5 70.37v579.26c0 13.183-10.687 23.87-23.87 23.87H96.37c-13.183 0-23.87-10.687-23.87-23.87V70.37c0-13.183 10.687-23.87 23.87-23.87h402.26c13.183 0 23.87 10.687 23.87 23.87z" fill="none"></path>
              </g>
              <path fill="#C6BFC9" d="M499 79v3a2 2 0 0 1-2 2H105a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h392a2 2 0 0 1 2 2"></path>
              <path fill="#C6BFC9" d="M353 95v3a2 2 0 0 1-2 2H105a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h246a2 2 0 0 1 2 2"></path>
              <path fill="#D9BDB8" d="M494 448v3a2 2 0 0 1-2 2H105a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h387a2 2 0 0 1 2 2"></path>
              <path fill="#D9BDB8" d="M451 464v3a2 2 0 0 1-2 2H105a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h344a2 2 0 0 1 2 2"></path>
              <path strokeWidth=".56" stroke="url(#strategy-inner)" fill="#ffffff" opacity=".8" d="M498.72 141.481v264.038c0 12.261-9.94 22.201-22.201 22.201H119.481c-12.261 0-22.201-9.94-22.201-22.201V141.481c0-12.261 9.94-22.201 22.201-22.201h357.038c12.261 0 22.201 9.94 22.201 22.201z"></path>
              {/* Enhanced Strategy Content */}
              <rect fill="#E8F5E8" x="135" y="155" width="115" height="32" rx="5" stroke="#4CAF50" strokeWidth="1"></rect>
              <path fill="#2E7D32" d="M143 173h4v4h-4zm7 0h4v4h-4zm7 0h4v4h-4zm7 0h4v4h-4zm7 0h4v4h-4zm7 0h4v4h-4zm7 0h4v4h-4zm7 0h4v4h-4zm7 0h4v4h-4zm7 0h4v4h-4zm7 0h4v4h-4z"></path>
              <circle fill="#4CAF50" cx="147" cy="175" r="2"></circle>
              <circle fill="#4CAF50" cx="238" cy="175" r="2"></circle>
              <text fill="#2E7D32" x="155" y="177" fontSize="7" fontWeight="bold">Market Research</text>
              
              <rect fill="#E3F2FD" x="135" y="192" width="115" height="32" rx="5" stroke="#2196F3" strokeWidth="1"></rect>
              <path fill="#1565C0" d="M143 210h4v4h-4zm7 0h4v4h-4zm7 0h4v4h-4zm7 0h4v4h-4zm7 0h4v4h-4zm7 0h4v4h-4zm7 0h4v4h-4zm7 0h4v4h-4zm7 0h4v4h-4zm7 0h4v4h-4zm7 0h4v4h-4z"></path>
              <circle fill="#2196F3" cx="147" cy="212" r="2"></circle>
              <text fill="#1565C0" x="155" y="214" fontSize="7" fontWeight="bold">Competitor Analysis</text>
              
              <rect fill="#FFF3E0" x="135" y="229" width="115" height="32" rx="5" stroke="#FF9800" strokeWidth="1"></rect>
              <path fill="#E65100" d="M143 247h4v4h-4zm7 0h4v4h-4zm7 0h4v4h-4zm7 0h4v4h-4zm7 0h4v4h-4zm7 0h4v4h-4zm7 0h4v4h-4zm7 0h4v4h-4zm7 0h4v4h-4zm7 0h4v4h-4zm7 0h4v4h-4z"></path>
              <circle fill="#FF9800" cx="147" cy="249" r="2"></circle>
              <text fill="#E65100" x="155" y="251" fontSize="7" fontWeight="bold">Target Segments</text>
              
              <rect fill="#FCE4EC" x="135" y="266" width="115" height="32" rx="5" stroke="#E91E63" strokeWidth="1"></rect>
              <path fill="#880E4F" d="M143 284h4v4h-4zm7 0h4v4h-4zm7 0h4v4h-4zm7 0h4v4h-4zm7 0h4v4h-4zm7 0h4v4h-4zm7 0h4v4h-4zm7 0h4v4h-4zm7 0h4v4h-4zm7 0h4v4h-4zm7 0h4v4h-4z"></path>
              <circle fill="#E91E63" cx="147" cy="286" r="2"></circle>
              <text fill="#880E4F" x="155" y="288" fontSize="7" fontWeight="bold">Messaging Framework</text>
              
              <rect fill="#F3E5F5" x="135" y="283" width="115" height="32" rx="5" stroke="#9C27B0" strokeWidth="1"></rect>
              <path fill="#4A148C" d="M143 301h4v4h-4zm7 0h4v4h-4zm7 0h4v4h-4zm7 0h4v4h-4zm7 0h4v4h-4zm7 0h4v4h-4zm7 0h4v4h-4zm7 0h4v4h-4zm7 0h4v4h-4zm7 0h4v4h-4zm7 0h4v4h-4z"></path>
              <circle fill="#9C27B0" cx="147" cy="303" r="2"></circle>
              <text fill="#4A148C" x="155" y="305" fontSize="7" fontWeight="bold">Launch Timeline</text>
              
              {/* Progress indicators */}
              <rect fill="#E8F5E8" x="270" y="160" width="135" height="5" rx="2"></rect>
              <rect fill="#4CAF50" x="270" y="160" width="121" height="5" rx="2"></rect>
              <text fill="#2E7D32" x="275" y="175" fontSize="8" fontWeight="bold">90% Complete</text>
              
              <rect fill="#E3F2FD" x="270" y="197" width="135" height="5" rx="2"></rect>
              <rect fill="#2196F3" x="270" y="197" width="94" height="5" rx="2"></rect>
              <text fill="#1565C0" x="275" y="212" fontSize="8" fontWeight="bold">70% Complete</text>
              
              <rect fill="#FFF3E0" x="270" y="234" width="135" height="5" rx="2"></rect>
              <rect fill="#FF9800" x="270" y="234" width="67" height="5" rx="2"></rect>
              <text fill="#E65100" x="275" y="249" fontSize="8" fontWeight="bold">50% Complete</text>
              
              <rect fill="#FCE4EC" x="270" y="271" width="135" height="5" rx="2"></rect>
              <rect fill="#E91E63" x="270" y="271" width="40" height="5" rx="2"></rect>
              <text fill="#880E4F" x="275" y="286" fontSize="8" fontWeight="bold">30% Complete</text>
              
              <rect fill="#F3E5F5" x="270" y="308" width="135" height="5" rx="2"></rect>
              <rect fill="#9C27B0" x="270" y="308" width="13" height="5" rx="2"></rect>
              <text fill="#4A148C" x="275" y="323" fontSize="8" fontWeight="bold">10% Complete</text>
            </g>
            <defs>
              <filter colorInterpolationFilters="sRGB" filterUnits="userSpaceOnUse" height="988" width="811" y="-134" x="-108" id="strategy-shadow">
                <feFlood result="BackgroundImageFix" floodOpacity="0"></feFlood>
                <feColorMatrix result="hardAlpha" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" in="SourceAlpha"></feColorMatrix>
                <feMorphology result="effect1_dropShadow_757_3882" in="SourceAlpha" operator="dilate" radius="6"></feMorphology>
                <feOffset dy="26"></feOffset>
                <feGaussianBlur stdDeviation="33"></feGaussianBlur>
                <feComposite operator="out" in2="hardAlpha"></feComposite>
                <feColorMatrix values="0 0 0 0 0.151842 0 0 0 0 0.201736 0 0 0 0 0.451209 0 0 0 0.4 0"></feColorMatrix>
                <feBlend result="effect1_dropShadow_757_3882" in2="BackgroundImageFix"></feBlend>
                <feBlend result="shape" in2="effect1_dropShadow_757_3882" in="SourceGraphic"></feBlend>
              </filter>
              <linearGradient gradientUnits="userSpaceOnUse" y2="714.392" x2="297.5" y1="46" x1="297.5" id="strategy-gradient">
                <stop stopColor="#E9E8F8"></stop>
                <stop stopColor="#ffffff" offset="1"></stop>
              </linearGradient>
              <linearGradient gradientUnits="userSpaceOnUse" y2="324.91" x2="-18.854" y1="-49.21" x1="348.419" id="strategy-border">
                <stop stopOpacity="0" stopColor="#ffffff"></stop>
                <stop stopColor="#ffffff" offset="1"></stop>
              </linearGradient>
              <linearGradient gradientUnits="userSpaceOnUse" y2="351.581" x2="191.962" y1="72.153" x1="343.387" id="strategy-inner">
                <stop stopOpacity="0" stopColor="#ffffff"></stop>
                <stop stopColor="#ffffff" offset="1"></stop>
              </linearGradient>
            </defs>
          </svg>
        );

      case "analytics":
        return (
          <svg preserveAspectRatio="xMidYMid meet" data-bbox="72 46 451 628" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 595 625" height="625" width="595" data-type="ugc" role="presentation" aria-hidden="true" aria-label="">
            <g>
              <path fillOpacity=".5" fill="#000000" d="M231.013 144.475v.735l1.987 1.843 1.987-1.843v-.735L233 146.29z"></path>
              <g filter="url(#analytics-shadow)">
                <path shapeRendering="crispEdges" fillOpacity=".6" fill="url(#analytics-gradient)" d="M523 70.37v579.26c0 13.46-10.91 24.37-24.37 24.37H96.37C82.91 674 72 663.09 72 649.63V70.37C72 56.91 82.91 46 96.37 46h402.26C512.09 46 523 56.91 523 70.37"></path>
                <path shapeRendering="crispEdges" stroke="url(#analytics-border)" d="M522.5 70.37v579.26c0 13.183-10.687 23.87-23.87 23.87H96.37c-13.183 0-23.87-10.687-23.87-23.87V70.37c0-13.183 10.687-23.87 23.87-23.87h402.26c13.183 0 23.87 10.687 23.87 23.87z" fill="none"></path>
              </g>
              <path fill="#C6BFC9" d="M499 79v3a2 2 0 0 1-2 2H105a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h392a2 2 0 0 1 2 2"></path>
              <path fill="#C6BFC9" d="M353 95v3a2 2 0 0 1-2 2H105a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h246a2 2 0 0 1 2 2"></path>
              <path fill="#D9BDB8" d="M494 448v3a2 2 0 0 1-2 2H105a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h387a2 2 0 0 1 2 2"></path>
              <path fill="#D9BDB8" d="M451 464v3a2 2 0 0 1-2 2H105a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h344a2 2 0 0 1 2 2"></path>
              <path strokeWidth=".56" stroke="url(#analytics-inner)" fill="#ffffff" opacity=".8" d="M498.72 141.481v264.038c0 12.261-9.94 22.201-22.201 22.201H119.481c-12.261 0-22.201-9.94-22.201-22.201V141.481c0-12.261 9.94-22.201 22.201-22.201h357.038c12.261 0 22.201 9.94 22.201 22.201z"></path>
              {/* Enhanced Analytics Content */}
              {/* Bar Chart */}
              <rect fill="#E8F5E8" x="125" y="145" width="145" height="105" rx="7" stroke="#4CAF50" strokeWidth="1"></rect>
              <text fill="#2E7D32" x="197" y="160" fontSize="10" fontWeight="bold" textAnchor="middle">Revenue Growth</text>
              <rect fill="#4CAF50" x="140" y="215" width="18" height="28" rx="2"></rect>
              <rect fill="#2196F3" x="168" y="195" width="18" height="48" rx="2"></rect>
              <rect fill="#FF9800" x="196" y="175" width="18" height="68" rx="2"></rect>
              <rect fill="#E91E63" x="224" y="155" width="18" height="88" rx="2"></rect>
              <text fill="#666" x="149" y="238" fontSize="6" textAnchor="middle">Q1</text>
              <text fill="#666" x="177" y="238" fontSize="6" textAnchor="middle">Q2</text>
              <text fill="#666" x="205" y="238" fontSize="6" textAnchor="middle">Q3</text>
              <text fill="#666" x="233" y="238" fontSize="6" textAnchor="middle">Q4</text>
              
              {/* Line Chart */}
              <rect fill="#E3F2FD" x="295" y="145" width="145" height="105" rx="7" stroke="#2196F3" strokeWidth="1"></rect>
              <text fill="#1565C0" x="367" y="160" fontSize="10" fontWeight="bold" textAnchor="middle">Market Share</text>
              <polyline fill="none" stroke="#2196F3" strokeWidth="2" points="315,225 335,205 355,210 375,185 395,165 415,155"></polyline>
              <circle fill="#2196F3" cx="315" cy="225" r="2"></circle>
              <circle fill="#2196F3" cx="335" cy="205" r="2"></circle>
              <circle fill="#2196F3" cx="355" cy="210" r="2"></circle>
              <circle fill="#2196F3" cx="375" cy="185" r="2"></circle>
              <circle fill="#2196F3" cx="395" cy="165" r="2"></circle>
              <circle fill="#2196F3" cx="415" cy="155" r="2"></circle>
              
              {/* Pie Chart */}
              <rect fill="#FFF3E0" x="125" y="275" width="145" height="105" rx="7" stroke="#FF9800" strokeWidth="1"></rect>
              <text fill="#E65100" x="197" y="290" fontSize="10" fontWeight="bold" textAnchor="middle">Segment Analysis</text>
              <circle fill="#4CAF50" cx="197" cy="335" r="18"></circle>
              <path fill="#2196F3" d="M197 335 L197 317 A18 18 0 0 1 215 335 Z"></path>
              <path fill="#FF9800" d="M197 335 L215 335 A18 18 0 0 1 197 353 Z"></path>
              <path fill="#E91E63" d="M197 335 L197 353 A18 18 0 0 1 179 335 Z"></path>
              
              {/* KPI Cards */}
              <rect fill="#FCE4EC" x="295" y="275" width="65" height="40" rx="5" stroke="#E91E63" strokeWidth="1"></rect>
              <text fill="#880E4F" x="327" y="290" fontSize="8" fontWeight="bold" textAnchor="middle">Conversion</text>
              <text fill="#E91E63" x="327" y="305" fontSize="12" fontWeight="bold" textAnchor="middle">24%</text>
              
              <rect fill="#F3E5F5" x="375" y="275" width="65" height="40" rx="5" stroke="#9C27B0" strokeWidth="1"></rect>
              <text fill="#4A148C" x="407" y="290" fontSize="8" fontWeight="bold" textAnchor="middle">ROI</text>
              <text fill="#9C27B0" x="407" y="305" fontSize="12" fontWeight="bold" textAnchor="middle">3.2x</text>
            </g>
            <defs>
              <filter colorInterpolationFilters="sRGB" filterUnits="userSpaceOnUse" height="988" width="811" y="-134" x="-108" id="analytics-shadow">
                <feFlood result="BackgroundImageFix" floodOpacity="0"></feFlood>
                <feColorMatrix result="hardAlpha" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" in="SourceAlpha"></feColorMatrix>
                <feMorphology result="effect1_dropShadow_757_3882" in="SourceAlpha" operator="dilate" radius="6"></feMorphology>
                <feOffset dy="26"></feOffset>
                <feGaussianBlur stdDeviation="33"></feGaussianBlur>
                <feComposite operator="out" in2="hardAlpha"></feComposite>
                <feColorMatrix values="0 0 0 0 0.151842 0 0 0 0 0.201736 0 0 0 0 0.451209 0 0 0 0.4 0"></feColorMatrix>
                <feBlend result="effect1_dropShadow_757_3882" in2="BackgroundImageFix"></feBlend>
                <feBlend result="shape" in2="effect1_dropShadow_757_3882" in="SourceGraphic"></feBlend>
              </filter>
              <linearGradient gradientUnits="userSpaceOnUse" y2="714.392" x2="297.5" y1="46" x1="297.5" id="analytics-gradient">
                <stop stopColor="#E9E8F8"></stop>
                <stop stopColor="#ffffff" offset="1"></stop>
              </linearGradient>
              <linearGradient gradientUnits="userSpaceOnUse" y2="324.91" x2="-18.854" y1="-49.21" x1="348.419" id="analytics-border">
                <stop stopOpacity="0" stopColor="#ffffff"></stop>
                <stop stopColor="#ffffff" offset="1"></stop>
              </linearGradient>
              <linearGradient gradientUnits="userSpaceOnUse" y2="351.581" x2="191.962" y1="72.153" x1="343.387" id="analytics-inner">
                <stop stopOpacity="0" stopColor="#ffffff"></stop>
                <stop stopColor="#ffffff" offset="1"></stop>
              </linearGradient>
            </defs>
          </svg>
        );

      case "leads":
        return (
          <svg preserveAspectRatio="xMidYMid meet" data-bbox="72 46 451 628" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 595 625" height="625" width="595" data-type="ugc" role="presentation" aria-hidden="true" aria-label="">
            <g>
              <path fillOpacity=".5" fill="#000000" d="M231.013 144.475v.735l1.987 1.843 1.987-1.843v-.735L233 146.29z"></path>
              <g filter="url(#leads-shadow)">
                <path shapeRendering="crispEdges" fillOpacity=".6" fill="url(#leads-gradient)" d="M523 70.37v579.26c0 13.46-10.91 24.37-24.37 24.37H96.37C82.91 674 72 663.09 72 649.63V70.37C72 56.91 82.91 46 96.37 46h402.26C512.09 46 523 56.91 523 70.37"></path>
                <path shapeRendering="crispEdges" stroke="url(#leads-border)" d="M522.5 70.37v579.26c0 13.183-10.687 23.87-23.87 23.87H96.37c-13.183 0-23.87-10.687-23.87-23.87V70.37c0-13.183 10.687-23.87 23.87-23.87h402.26c13.183 0 23.87 10.687 23.87 23.87z" fill="none"></path>
              </g>
              <path fill="#C6BFC9" d="M499 79v3a2 2 0 0 1-2 2H105a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h392a2 2 0 0 1 2 2"></path>
              <path fill="#C6BFC9" d="M353 95v3a2 2 0 0 1-2 2H105a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h246a2 2 0 0 1 2 2"></path>
              <path fill="#D9BDB8" d="M494 448v3a2 2 0 0 1-2 2H105a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h387a2 2 0 0 1 2 2"></path>
              <path fill="#D9BDB8" d="M451 464v3a2 2 0 0 1-2 2H105a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h344a2 2 0 0 1 2 2"></path>
              <path strokeWidth=".56" stroke="url(#leads-inner)" fill="#ffffff" opacity=".8" d="M498.72 141.481v264.038c0 12.261-9.94 22.201-22.201 22.201H119.481c-12.261 0-22.201-9.94-22.201-22.201V141.481c0-12.261 9.94-22.201 22.201-22.201h357.038c12.261 0 22.201 9.94 22.201 22.201z"></path>
              {/* Enhanced Leads Content */}
              {/* Lead Profiles */}
              <rect fill="#E8F5E8" x="125" y="145" width="135" height="70" rx="7" stroke="#4CAF50" strokeWidth="1"></rect>
              <circle fill="#4CAF50" cx="148" cy="165" r="8"></circle>
              <path fill="#ffffff" d="M148 160c-1.657 0-3 1.343-3 3s1.343 3 3 3 3-1.343 3-3-1.343-3-3-3zm0 4.5c-.828 0-1.5-.672-1.5-1.5s.672-1.5 1.5-1.5 1.5.672 1.5 1.5-.672 1.5-1.5 1.5z"></path>
              <text fill="#2E7D32" x="165" y="162" fontSize="7" fontWeight="bold">Sarah Chen</text>
              <text fill="#666" x="165" y="170" fontSize="6">Tech Director</text>
              <text fill="#4CAF50" x="165" y="178" fontSize="6" fontWeight="bold">High Intent</text>
              <circle fill="#2196F3" cx="148" cy="192" r="8"></circle>
              <path fill="#ffffff" d="M148 187c-1.657 0-3 1.343-3 3s1.343 3 3 3 3-1.343 3-3-1.343-3-3-3zm0 4.5c-.828 0-1.5-.672-1.5-1.5s.672-1.5 1.5-1.5 1.5.672 1.5 1.5-.672 1.5-1.5 1.5z"></path>
              <text fill="#1565C0" x="165" y="189" fontSize="7" fontWeight="bold">Mike Ross</text>
              <text fill="#666" x="165" y="197" fontSize="6">VP Sales</text>
              <text fill="#2196F3" x="165" y="205" fontSize="6" fontWeight="bold">Qualified</text>
              
              {/* Conversion Funnel */}
              <rect fill="#E3F2FD" x="285" y="145" width="135" height="105" rx="7" stroke="#2196F3" strokeWidth="1"></rect>
              <text fill="#1565C0" x="352" y="160" fontSize="10" fontWeight="bold" textAnchor="middle">Conversion Funnel</text>
              <path fill="#E3F2FD" stroke="#2196F3" strokeWidth="1" d="M310 170 L395 170 L390 190 L315 190 Z"></path>
              <text fill="#1565C0" x="352" y="185" fontSize="8" textAnchor="middle">1,250 Leads</text>
              <path fill="#BBDEFB" stroke="#2196F3" strokeWidth="1" d="M315 195 L390 195 L385 215 L320 215 Z"></path>
              <text fill="#1565C0" x="352" y="210" fontSize="8" textAnchor="middle">480 MQLs</text>
              <path fill="#90CAF9" stroke="#2196F3" strokeWidth="1" d="M320 220 L385 220 L380 240 L325 240 Z"></path>
              <text fill="#ffffff" x="352" y="235" fontSize="8" textAnchor="middle">120 SQLs</text>
              <path fill="#64B5F6" stroke="#2196F3" strokeWidth="1" d="M325 245 L380 245 L375 265 L330 265 Z"></path>
              <text fill="#ffffff" x="352" y="260" fontSize="8" textAnchor="middle">32 Deals</text>
              
              {/* Lead Scoring */}
              <rect fill="#FFF3E0" x="125" y="240" width="135" height="85" rx="7" stroke="#FF9800" strokeWidth="1"></rect>
              <text fill="#E65100" x="192" y="255" fontSize="10" fontWeight="bold" textAnchor="middle">Lead Scoring</text>
              <circle fill="#4CAF50" cx="145" cy="270" r="5"></circle>
              <text fill="#666" x="158" y="273" fontSize="7">Enterprise (95)</text>
              <circle fill="#2196F3" cx="145" cy="288" r="5"></circle>
              <text fill="#666" x="158" y="291" fontSize="7">Mid-Market (75)</text>
              <circle fill="#FF9800" cx="145" cy="306" r="5"></circle>
              <text fill="#666" x="158" y="309" fontSize="7">Startup (45)</text>
              
              {/* Activity Timeline */}
              <rect fill="#FCE4EC" x="285" y="275" width="135" height="65" rx="7" stroke="#E91E63" strokeWidth="1"></rect>
              <text fill="#880E4F" x="352" y="290" fontSize="10" fontWeight="bold" textAnchor="middle">Recent Activity</text>
              <circle fill="#E91E63" cx="305" cy="305" r="2"></circle>
              <line stroke="#E91E63" strokeWidth="1" x1="305" y1="305" x2="305" y2="335"></line>
              <text fill="#666" x="315" y="307" fontSize="6">Demo scheduled</text>
              <circle fill="#E91E63" cx="305" cy="318" r="2"></circle>
              <text fill="#666" x="315" y="320" fontSize="6">Proposal sent</text>
              <circle fill="#4CAF50" cx="305" cy="331" r="2"></circle>
              <text fill="#666" x="315" y="333" fontSize="6">Deal closed</text>
            </g>
            <defs>
              <filter colorInterpolationFilters="sRGB" filterUnits="userSpaceOnUse" height="988" width="811" y="-134" x="-108" id="leads-shadow">
                <feFlood result="BackgroundImageFix" floodOpacity="0"></feFlood>
                <feColorMatrix result="hardAlpha" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" in="SourceAlpha"></feColorMatrix>
                <feMorphology result="effect1_dropShadow_757_3882" in="SourceAlpha" operator="dilate" radius="6"></feMorphology>
                <feOffset dy="26"></feOffset>
                <feGaussianBlur stdDeviation="33"></feGaussianBlur>
                <feComposite operator="out" in2="hardAlpha"></feComposite>
                <feColorMatrix values="0 0 0 0 0.151842 0 0 0 0 0.201736 0 0 0 0 0.451209 0 0 0 0.4 0"></feColorMatrix>
                <feBlend result="effect1_dropShadow_757_3882" in2="BackgroundImageFix"></feBlend>
                <feBlend result="shape" in2="effect1_dropShadow_757_3882" in="SourceGraphic"></feBlend>
              </filter>
              <linearGradient gradientUnits="userSpaceOnUse" y2="714.392" x2="297.5" y1="46" x1="297.5" id="leads-gradient">
                <stop stopColor="#E9E8F8"></stop>
                <stop stopColor="#ffffff" offset="1"></stop>
              </linearGradient>
              <linearGradient gradientUnits="userSpaceOnUse" y2="324.91" x2="-18.854" y1="-49.21" x1="348.419" id="leads-border">
                <stop stopOpacity="0" stopColor="#ffffff"></stop>
                <stop stopColor="#ffffff" offset="1"></stop>
              </linearGradient>
              <linearGradient gradientUnits="userSpaceOnUse" y2="351.581" x2="191.962" y1="72.153" x1="343.387" id="leads-inner">
                <stop stopOpacity="0" stopColor="#ffffff"></stop>
                <stop stopColor="#ffffff" offset="1"></stop>
              </linearGradient>
            </defs>
          </svg>
        );

      case "about":
        return (
          <svg preserveAspectRatio="xMidYMid meet" data-bbox="72 46 451 628" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 595 625" height="625" width="595" data-type="ugc" role="presentation" aria-hidden="true" aria-label="">
            <g>
              <path fillOpacity=".5" fill="#000000" d="M231.013 144.475v.735l1.987 1.843 1.987-1.843v-.735L233 146.29z"></path>
              <g filter="url(#about-shadow)">
                <path shapeRendering="crispEdges" fillOpacity=".6" fill="url(#about-gradient)" d="M523 70.37v579.26c0 13.46-10.91 24.37-24.37 24.37H96.37C82.91 674 72 663.09 72 649.63V70.37C72 56.91 82.91 46 96.37 46h402.26C512.09 46 523 56.91 523 70.37"></path>
                <path shapeRendering="crispEdges" stroke="url(#about-border)" d="M522.5 70.37v579.26c0 13.183-10.687 23.87-23.87 23.87H96.37c-13.183 0-23.87-10.687-23.87-23.87V70.37c0-13.183 10.687-23.87 23.87-23.87h402.26c13.183 0 23.87 10.687 23.87 23.87z" fill="none"></path>
              </g>
              <path fill="#C6BFC9" d="M499 79v3a2 2 0 0 1-2 2H105a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h392a2 2 0 0 1 2 2"></path>
              <path fill="#C6BFC9" d="M353 95v3a2 2 0 0 1-2 2H105a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h246a2 2 0 0 1 2 2"></path>
              <path fill="#D9BDB8" d="M494 448v3a2 2 0 0 1-2 2H105a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h387a2 2 0 0 1 2 2"></path>
              <path fill="#D9BDB8" d="M451 464v3a2 2 0 0 1-2 2H105a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h344a2 2 0 0 1 2 2"></path>
              <path strokeWidth=".56" stroke="url(#about-inner)" fill="#ffffff" opacity=".8" d="M498.72 141.481v264.038c0 12.261-9.94 22.201-22.201 22.201H119.481c-12.261 0-22.201-9.94-22.201-22.201V141.481c0-12.261 9.94-22.201 22.201-22.201h357.038c12.261 0 22.201 9.94 22.201 22.201z"></path>
              
              {/* Enhanced About Content */}
              {/* Company Mission */}
              <rect fill="#E8F5E8" x="125" y="145" width="155" height="75" rx="7" stroke="#4CAF50" strokeWidth="1"></rect>
              <text fill="#2E7D32" x="202" y="162" fontSize="10" fontWeight="bold" textAnchor="middle">Our Mission</text>
              <text fill="#666" x="202" y="178" fontSize="7" textAnchor="middle">Empower businesses with</text>
              <text fill="#666" x="202" y="188" fontSize="7" textAnchor="middle">AI-driven GTM strategies</text>
              <text fill="#666" x="202" y="198" fontSize="7" textAnchor="middle">that drive predictable</text>
              <text fill="#666" x="202" y="208" fontSize="7" textAnchor="middle">revenue growth</text>
              
              {/* Core Values */}
              <rect fill="#E3F2FD" x="305" y="145" width="155" height="75" rx="7" stroke="#2196F3" strokeWidth="1"></rect>
              <text fill="#1565C0" x="382" y="162" fontSize="10" fontWeight="bold" textAnchor="middle">Core Values</text>
              <circle fill="#4CAF50" cx="322" cy="180" r="3"></circle>
              <text fill="#666" x="332" y="183" fontSize="7">Innovation</text>
              <circle fill="#2196F3" cx="322" cy="195" r="3"></circle>
              <text fill="#666" x="332" y="198" fontSize="7">Excellence</text>
              <circle fill="#FF9800" cx="322" cy="210" r="3"></circle>
              <text fill="#666" x="332" y="213" fontSize="7">Integrity</text>
              
              {/* Team Stats */}
              <rect fill="#FFF3E0" x="125" y="245" width="155" height="75" rx="7" stroke="#FF9800" strokeWidth="1"></rect>
              <text fill="#E65100" x="202" y="262" fontSize="10" fontWeight="bold" textAnchor="middle">Team & Impact</text>
              <text fill="#666" x="140" y="280" fontSize="7">50+ Team Members</text>
              <text fill="#666" x="140" y="295" fontSize="7">1000+ Companies Helped</text>
              <text fill="#666" x="140" y="310" fontSize="7">$500M+ Revenue Generated</text>
              
              {/* Technology Stack */}
              <rect fill="#FCE4EC" x="305" y="245" width="155" height="75" rx="7" stroke="#E91E63" strokeWidth="1"></rect>
              <text fill="#880E4F" x="382" y="262" fontSize="10" fontWeight="bold" textAnchor="middle">Technology</text>
              <rect fill="#E91E63" x="320" y="275" width="28" height="7" rx="2"></rect>
              <text fill="#666" x="355" y="280" fontSize="6">AI/ML</text>
              <rect fill="#2196F3" x="320" y="288" width="28" height="7" rx="2"></rect>
              <text fill="#666" x="355" y="293" fontSize="6">Cloud</text>
              <rect fill="#4CAF50" x="320" y="301" width="28" height="7" rx="2"></rect>
              <text fill="#666" x="355" y="306" fontSize="6">Analytics</text>
              
              {/* Achievement Badges */}
              <rect fill="#F3E5F5" x="215" y="345" width="155" height="55" rx="7" stroke="#9C27B0" strokeWidth="1"></rect>
              <text fill="#4A148C" x="292" y="362" fontSize="10" fontWeight="bold" textAnchor="middle">Achievements</text>
              <circle fill="#FFD700" cx="245" cy="380" r="7"></circle>
              <text fill="#666" x="260" y="383" fontSize="6">Top AI Startup</text>
              <circle fill="#C0C0C0" cx="340" cy="380" r="7"></circle>
              <text fill="#666" x="355" y="383" fontSize="6">Industry Leader</text>
            </g>
            <defs>
              <filter colorInterpolationFilters="sRGB" filterUnits="userSpaceOnUse" height="988" width="811" y="-134" x="-108" id="about-shadow">
                <feFlood result="BackgroundImageFix" floodOpacity="0"></feFlood>
                <feColorMatrix result="hardAlpha" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" in="SourceAlpha"></feColorMatrix>
                <feMorphology result="effect1_dropShadow_757_3882" in="SourceAlpha" operator="dilate" radius="6"></feMorphology>
                <feOffset dy="26"></feOffset>
                <feGaussianBlur stdDeviation="33"></feGaussianBlur>
                <feComposite operator="out" in2="hardAlpha"></feComposite>
                <feColorMatrix values="0 0 0 0 0.151842 0 0 0 0 0.201736 0 0 0 0 0.451209 0 0 0 0.4 0"></feColorMatrix>
                <feBlend result="effect1_dropShadow_757_3882" in2="BackgroundImageFix"></feBlend>
                <feBlend result="shape" in2="effect1_dropShadow_757_3882" in="SourceGraphic"></feBlend>
              </filter>
              <linearGradient gradientUnits="userSpaceOnUse" y2="714.392" x2="297.5" y1="46" x1="297.5" id="about-gradient">
                <stop stopColor="#E9E8F8"></stop>
                <stop stopColor="#ffffff" offset="1"></stop>
              </linearGradient>
              <linearGradient gradientUnits="userSpaceOnUse" y2="324.91" x2="-18.854" y1="-49.21" x1="348.419" id="about-border">
                <stop stopOpacity="0" stopColor="#ffffff"></stop>
                <stop stopColor="#ffffff" offset="1"></stop>
              </linearGradient>
              <linearGradient gradientUnits="userSpaceOnUse" y2="351.581" x2="191.962" y1="72.153" x1="343.387" id="about-inner">
                <stop stopOpacity="0" stopColor="#ffffff"></stop>
                <stop stopColor="#ffffff" offset="1"></stop>
              </linearGradient>
            </defs>
          </svg>
        );

      case "compact":
        return (
          <svg preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 250" height="250" width="600" data-type="ugc" role="presentation" aria-hidden="true" aria-label="">
            <g>
              {/* Device Frame */}
              <path fillOpacity=".1" fill="#000000" d="M231.013 144.475v.735l1.987 1.843 1.987-1.843v-.735L233 146.29z"></path>
              <g filter="url(#compact-shadow)">
                <path shapeRendering="crispEdges" fillOpacity=".8" fill="url(#compact-gradient)" d="M580 73v141.868c0 10.823-8.774 19.597-19.597 19.597H99.597C88.774 234.465 80 225.691 80 214.868V73c0-10.823 8.774-19.597 19.597-19.597h460.806c10.823 0 19.597 8.774 19.597 19.597"></path>
                <path shapeRendering="crispEdges" stroke="url(#compact-border)" d="M579.5 73v141.868c0 10.548-8.549 19.097-19.097 19.097H99.597c-10.548 0-19.097-8.549-19.097-19.097V73c0-10.548 8.549-19.097 19.097-19.097h460.806c10.548 0 19.097 8.549 19.097 19.097z" fill="none"></path>
              </g>
              <path fill="#C6BFC9" d="M556 82v2a1.5 1.5 0 0 1-1.5 1.5H106.5a1.5 1.5 0 0 1-1.5-1.5v-2a1.5 1.5 0 0 1 1.5-1.5h448a1.5 1.5 0 0 1 1.5 1.5"></path>
              <path fill="#C6BFC9" d="M420 95v2a1.5 1.5 0 0 1-1.5 1.5H106.5a1.5 1.5 0 0 1-1.5-1.5v-2a1.5 1.5 0 0 1 1.5-1.5h312a1.5 1.5 0 0 1 1.5 1.5"></path>
              <path fill="#D9BDB8" d="M556 205v2a1.5 1.5 0 0 1-1.5 1.5H106.5a1.5 1.5 0 0 1-1.5-1.5v-2a1.5 1.5 0 0 1 1.5-1.5h448a1.5 1.5 0 0 1 1.5 1.5"></path>
              <path fill="#D9BDB8" d="M520 218v2a1.5 1.5 0 0 1-1.5 1.5H106.5a1.5 1.5 0 0 1-1.5-1.5v-2a1.5 1.5 0 0 1 1.5-1.5h412a1.5 1.5 0 0 1 1.5 1.5"></path>
              <path strokeWidth=".5" stroke="url(#compact-inner)" fill="#ffffff" opacity=".9" d="M559.743 72.98v141.868c0 10.823-8.774 19.597-19.597 19.597H99.308c-10.823 0-19.597-8.774-19.597-19.597V72.98c0-10.823 8.774-19.597 19.597-19.597h440.838c10.823 0 19.597 8.774 19.597 19.597"></path>
              
              {/* Compact Dashboard Layout */}
              {/* Left Panel - Metrics */}
              <rect fill="#E8F5E8" x="105" y="105" width="120" height="50" rx="5" stroke="#4CAF50" strokeWidth="1"></rect>
              <text fill="#2E7D32" x="165" y="120" fontSize="8" fontWeight="bold" textAnchor="middle">Revenue</text>
              <text fill="#4CAF50" x="165" y="135" fontSize="12" fontWeight="bold" textAnchor="middle">$2.4M</text>
              <text fill="#666" x="165" y="148" fontSize="6" textAnchor="middle">+24% YoY</text>
              
              <rect fill="#E3F2FD" x="105" y="160" width="120" height="50" rx="5" stroke="#2196F3" strokeWidth="1"></rect>
              <text fill="#1565C0" x="165" y="175" fontSize="8" fontWeight="bold" textAnchor="middle">Users</text>
              <text fill="#2196F3" x="165" y="190" fontSize="12" fontWeight="bold" textAnchor="middle">48.2K</text>
              <text fill="#666" x="165" y="203" fontSize="6" textAnchor="middle">+18% MoM</text>
              
              {/* Center Panel - Chart */}
              <rect fill="#FFF3E0" x="235" y="105" width="130" height="105" rx="5" stroke="#FF9800" strokeWidth="1"></rect>
              <text fill="#E65100" x="300" y="120" fontSize="8" fontWeight="bold" textAnchor="middle">Performance</text>
              <polyline fill="none" stroke="#FF9800" strokeWidth="2" points="250,195 270,180 290,185 310,165 330,150 350,140"></polyline>
              <circle fill="#FF9800" cx="250" cy="195" r="2"></circle>
              <circle fill="#FF9800" cx="270" cy="180" r="2"></circle>
              <circle fill="#FF9800" cx="290" cy="185" r="2"></circle>
              <circle fill="#FF9800" cx="310" cy="165" r="2"></circle>
              <circle fill="#FF9800" cx="330" cy="150" r="2"></circle>
              <circle fill="#FF9800" cx="350" cy="140" r="2"></circle>
              
              {/* Right Panel - Activity */}
              <rect fill="#FCE4EC" x="375" y="105" width="120" height="50" rx="5" stroke="#E91E63" strokeWidth="1"></rect>
              <text fill="#880E4F" x="435" y="120" fontSize="8" fontWeight="bold" textAnchor="middle">Active Deals</text>
              <text fill="#E91E63" x="435" y="135" fontSize="12" fontWeight="bold" textAnchor="middle">127</text>
              <text fill="#666" x="435" y="148" fontSize="6" textAnchor="middle">32 this week</text>
              
              <rect fill="#F3E5F5" x="375" y="160" width="120" height="50" rx="5" stroke="#9C27B0" strokeWidth="1"></rect>
              <text fill="#4A148C" x="435" y="175" fontSize="8" fontWeight="bold" textAnchor="middle">Conversion</text>
              <text fill="#9C27B0" x="435" y="190" fontSize="12" fontWeight="bold" textAnchor="middle">3.2%</text>
              <text fill="#666" x="435" y="203" fontSize="6" textAnchor="middle">Above target</text>
            </g>
            <defs>
              <filter colorInterpolationFilters="sRGB" filterUnits="userSpaceOnUse" height="400" width="700" y="-50" x="-50" id="compact-shadow">
                <feFlood result="BackgroundImageFix" floodOpacity="0"></feFlood>
                <feColorMatrix result="hardAlpha" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" in="SourceAlpha"></feColorMatrix>
                <feMorphology result="effect1_dropShadow_compact" in="SourceAlpha" operator="dilate" radius="4"></feMorphology>
                <feOffset dy="8"></feOffset>
                <feGaussianBlur stdDeviation="12"></feGaussianBlur>
                <feComposite operator="out" in2="hardAlpha"></feComposite>
                <feColorMatrix values="0 0 0 0 0.151842 0 0 0 0 0.201736 0 0 0 0 0.451209 0 0 0 0.3 0"></feColorMatrix>
                <feBlend result="effect1_dropShadow_compact" in2="BackgroundImageFix"></feBlend>
                <feBlend result="shape" in2="effect1_dropShadow_compact" in="SourceGraphic"></feBlend>
              </filter>
              <linearGradient gradientUnits="userSpaceOnUse" y2="250" x2="300" y1="50" x1="300" id="compact-gradient">
                <stop stopColor="#E9E8F8"></stop>
                <stop stopColor="#ffffff" offset="1"></stop>
              </linearGradient>
              <linearGradient gradientUnits="userSpaceOnUse" y2="120" x2="-10" y1="-20" x1="310" id="compact-border">
                <stop stopOpacity="0" stopColor="#ffffff"></stop>
                <stop stopColor="#ffffff" offset="1"></stop>
              </linearGradient>
              <linearGradient gradientUnits="userSpaceOnUse" y2="140" x2="180" y1="60" x1="320" id="compact-inner">
                <stop stopOpacity="0" stopColor="#ffffff"></stop>
                <stop stopColor="#ffffff" offset="1"></stop>
              </linearGradient>
            </defs>
          </svg>
        );

      default:
        return null;
    }
  };

  return (
    <div ref={ref} className={`absolute inset-0 flex items-center justify-center pointer-events-none ${className}`}>
      <motion.div
        initial={
          variant === "about" ? { opacity: 0, y: 50, scale: 0.9 } : 
          variant === "compact" ? { opacity: 0, x: -50, scale: 0.95 } : 
          { opacity: 0, scale: 0.8, rotate: -5 }
        }
        animate={isInView ? 
          (variant === "about" ? { opacity: 1, y: 0, scale: 1 } : 
           variant === "compact" ? { opacity: 1, x: 0, scale: 1 } : 
           { opacity: 1, scale: 1, rotate: 0 }) : 
          (variant === "about" ? { opacity: 0, y: 50, scale: 0.9 } : 
           variant === "compact" ? { opacity: 0, x: -50, scale: 0.95 } : 
           { opacity: 0, scale: 0.8, rotate: -5 })
        }
        transition={{ 
          duration: variant === "compact" ? 0.6 : (variant === "about" ? 1.0 : 0.8), 
          ease: "easeOut",
          delay: variant === "compact" ? 0.1 : (variant === "about" ? 0.2 : 0)
        }}
        className="w-full h-full max-w-md max-h-md opacity-90"
      >
        {renderSVG()}
      </motion.div>
    </div>
  );
}

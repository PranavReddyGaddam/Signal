"use client";

import { X } from "lucide-react";

interface TestPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TestPopup({ isOpen, onClose }: TestPopupProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative bg-white rounded-2xl p-8 max-w-4xl w-full mx-4 max-h-[90vh] overflow-auto">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors"
        >
          <X className="w-5 h-5 text-gray-600" />
        </button>

        {/* Title */}
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Test SVG Preview</h2>

        {/* SVG Content */}
        <div className="flex justify-center items-center">
          <svg preserveAspectRatio="xMidYMid meet" data-bbox="72 46 451 628" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 595 625" height="625" width="595" data-type="ugc" role="presentation" aria-hidden="true" aria-label="">
            <g>
              <path fillOpacity=".5" fill="#000000" d="M231.013 144.475v.735l1.987 1.843 1.987-1.843v-.735L233 146.29z"></path>
              <g filter="url(#d0105992-e3ea-489a-8d7a-d7458e45faeb_comp-mcf7kbxy2)">
                <path shapeRendering="crispEdges" fillOpacity=".6" fill="url(#f967228e-9218-4256-95d9-195a29bc9fd4_comp-mcf7kbxy2)" d="M523 70.37v579.26c0 13.46-10.91 24.37-24.37 24.37H96.37C82.91 674 72 663.09 72 649.63V70.37C72 56.91 82.91 46 96.37 46h402.26C512.09 46 523 56.91 523 70.37"></path>
                <path shapeRendering="crispEdges" stroke="url(#59e341ae-25a8-40d3-bfa0-a0d35f8d1188_comp-mcf7kbxy2)" d="M522.5 70.37v579.26c0 13.183-10.687 23.87-23.87 23.87H96.37c-13.183 0-23.87-10.687-23.87-23.87V70.37c0-13.183 10.687-23.87 23.87-23.87h402.26c13.183 0 23.87 10.687 23.87 23.87z" fill="none"></path>
              </g>
              <path fill="#C6BFC9" d="M499 79v3a2 2 0 0 1-2 2H105a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h392a2 2 0 0 1 2 2"></path>
              <path fill="#C6BFC9" d="M353 95v3a2 2 0 0 1-2 2H105a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h246a2 2 0 0 1 2 2"></path>
              <path fill="#D9BDB8" d="M494 448v3a2 2 0 0 1-2 2H105a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h387a2 2 0 0 1 2 2"></path>
              <path fill="#D9BDB8" d="M451 464v3a2 2 0 0 1-2 2H105a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h344a2 2 0 0 1 2 2"></path>
              <path strokeWidth=".56" stroke="url(#469398a1-7743-4fe5-a6da-7fded9baf838_comp-mcf7kbxy2)" fill="#ffffff" opacity=".8" d="M498.72 141.481v264.038c0 12.261-9.94 22.201-22.201 22.201H119.481c-12.261 0-22.201-9.94-22.201-22.201V141.481c0-12.261 9.94-22.201 22.201-22.201h357.038c12.261 0 22.201 9.94 22.201 22.201z"></path>
              <path fill="#EAE5E9" d="M260 208v2a2 2 0 0 1-2 2H144a2 2 0 0 1-2-2v-2a2 2 0 0 1 2-2h114a2 2 0 0 1 2 2"></path>
              <path fill="#EAE5E9" d="M260 302v2a2 2 0 0 1-2 2H144a2 2 0 0 1-2-2v-2a2 2 0 0 1 2-2h114a2 2 0 0 1 2 2"></path>
              <path fill="#EAE5E9" d="M260 396v2a2 2 0 0 1-2 2H144a2 2 0 0 1-2-2v-2a2 2 0 0 1 2-2h114a2 2 0 0 1 2 2"></path>
              <path fill="#EAE5E9" d="M284 255v2a2 2 0 0 1-2 2H144a2 2 0 0 1-2-2v-2a2 2 0 0 1 2-2h138a2 2 0 0 1 2 2"></path>
              <path fill="#EAE5E9" d="M284 350v2a2 2 0 0 1-2 2H144a2 2 0 0 1-2-2v-2a2 2 0 0 1 2-2h138a2 2 0 0 1 2 2"></path>
              <path fill="#2CCE7F" d="m124.295 195.85-1.565-1.588-.757.788 2.322 2.355 3.624-3.671-.755-.789z" clipRule="evenodd" fillRule="evenodd"></path>
              <path stroke="#2CCE7F" d="M130.892 194.946a5.946 5.946 0 1 1-11.892 0 5.946 5.946 0 0 1 11.892 0z" fill="none"></path>
              <path fill="#515151" d="M146.892 191.94q-.096-.924-.672-1.332-.564-.42-1.452-.42-.36 0-.708.072a2 2 0 0 0-.624.24q-.264.168-.432.456-.156.276-.156.696 0 .396.228.648.24.24.624.396.396.156.888.264.492.096 1.008.216t1.008.288q.492.156.876.432t.612.708q.24.42.24 1.044 0 .684-.312 1.176-.3.48-.78.792-.48.3-1.08.444a5.1 5.1 0 0 1-2.544-.036q-.636-.18-1.128-.552a2.75 2.75 0 0 1-.768-.936q-.276-.576-.276-1.356h1.08q0 .54.204.936.216.384.552.636.348.252.792.372.456.12.948.12.384 0 .768-.072.396-.072.708-.24.312-.18.504-.48t.192-.768q0-.444-.24-.72a1.6 1.6 0 0 0-.612-.444 4.2 4.2 0 0 0-.876-.288q-.492-.12-1.008-.228t-1.008-.252a3.8 3.8 0 0 1-.888-.408 2.1 2.1 0 0 1-.624-.636q-.228-.384-.228-.972 0-.648.264-1.116.264-.48.696-.78.444-.312.996-.456.564-.156 1.152-.156.66 0 1.224.156t.984.492.672.852q.252.504.276 1.212z"></path>
            </g>
            <defs>
              <filter colorInterpolationFilters="sRGB" filterUnits="userSpaceOnUse" height="988" width="811" y="-134" x="-108" id="d0105992-e3ea-489a-8d7a-d7458e45faeb_comp-mcf7kbxy2">
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
              <linearGradient gradientUnits="userSpaceOnUse" y2="714.392" x2="297.5" y1="46" x1="297.5" id="f967228e-9218-4256-95d9-195a29bc9fd4_comp-mcf7kbxy2">
                <stop stopColor="#E9E8F8"></stop>
                <stop stopColor="#ffffff" offset="1"></stop>
              </linearGradient>
              <linearGradient gradientUnits="userSpaceOnUse" y2="324.91" x2="-18.854" y1="-49.21" x1="348.419" id="59e341ae-25a8-40d3-bfa0-a0d35f8d1188_comp-mcf7kbxy2">
                <stop stopOpacity="0" stopColor="#ffffff"></stop>
                <stop stopColor="#ffffff" offset="1"></stop>
              </linearGradient>
              <linearGradient gradientUnits="userSpaceOnUse" y2="351.581" x2="191.962" y1="72.153" x1="343.387" id="469398a1-7743-4fe5-a6da-7fded9baf838_comp-mcf7kbxy2">
                <stop stopOpacity="0" stopColor="#ffffff"></stop>
                <stop stopColor="#ffffff" offset="1"></stop>
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Description */}
        <p className="text-gray-600 text-center mt-6">
          This is a test SVG popup preview. If you like how this looks, we can add similar elements throughout the project.
        </p>
      </div>
    </div>
  );
}

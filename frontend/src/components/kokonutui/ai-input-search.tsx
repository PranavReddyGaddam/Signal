"use client";

/**
 * @author: @kokonutui
 * @description: AI Input Search
 * @version: 1.0.0
 * @date: 2025-06-26
 * @license: MIT
 * @website: https://kokonutui.com
 * @github: https://github.com/kokonut-labs/kokonutui
 */

import { Paperclip, Send, Sparkles } from "lucide-react";
import { useState, useEffect } from "react";
import { Textarea } from "../ui/textarea";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import { useAutoResizeTextarea } from "@/hooks/use-auto-resize-textarea";

interface AIInputSearchProps {
  onSubmit?: (value: string) => void;
  minHeight?: number;
  placeholder?: string;
}

export default function AI_Input_Search({
  onSubmit,
  minHeight = 52,
  placeholder = "Search the web...",
}: AIInputSearchProps = {}) {
  const [value, setValue] = useState("");
  const { textareaRef, adjustHeight } = useAutoResizeTextarea({
    minHeight: 40,
    maxHeight: 200,
  });
  const [showSearch, setShowSearch] = useState(true);
  const [isFocused, setIsFocused] = useState(false);
  const [typingText, setTypingText] = useState("");
  
  // GTM-related texts for typing effect
  const gtmTexts = [
    "Identify the best go-to-market strategy for SaaS products",
    "Find proven growth patterns for healthcare technology companies",
    "Discover lead generation strategies for B2B startups",
    "Analyze market entry tactics for fintech companies",
    "Generate qualified leads for enterprise software",
  ];

  useEffect(() => {
    let currentTextIndex = 0;
    let currentCharIndex = 0;
    let isDeleting = false;
    let timeoutId: ReturnType<typeof setTimeout>;

    const type = () => {
      const currentText = gtmTexts[currentTextIndex];

      if (!isDeleting && currentCharIndex < currentText.length) {
        setTypingText(currentText.substring(0, currentCharIndex + 1));
        currentCharIndex++;
        timeoutId = setTimeout(type, 100);
      } else if (isDeleting && currentCharIndex > 0) {
        setTypingText(currentText.substring(0, currentCharIndex - 1));
        currentCharIndex--;
        timeoutId = setTimeout(type, 30);
      } else if (!isDeleting && currentCharIndex === currentText.length) {
        timeoutId = setTimeout(() => {
          isDeleting = true;
          type();
        }, 2000);
      } else if (isDeleting && currentCharIndex === 0) {
        isDeleting = false;
        currentTextIndex = (currentTextIndex + 1) % gtmTexts.length;
        timeoutId = setTimeout(type, 500);
      }
    };

    timeoutId = setTimeout(type, 1000);

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  const handleSubmit = () => {
    if (onSubmit && value.trim()) {
      onSubmit(value);
    }
    setValue("");
    adjustHeight(true);
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  const handleContainerClick = () => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  return (
    <div className="w-full py-4">
      <div className="relative max-w-xl w-full mx-auto">
        <div
          role="textbox"
          tabIndex={0}
          aria-label="Search input container"
          className={cn(
            "relative rounded-xl transition-all duration-200 w-full text-left cursor-text",
            "bg-black/50 backdrop-blur-md border border-white/20",
            isFocused && "bg-black/60 border-white/30"
          )}
          onClick={handleContainerClick}
          onKeyDown={(e: React.KeyboardEvent<HTMLDivElement>) => {
            if (e.key === "Enter" || e.key === " ") {
              handleContainerClick();
            }
          }}
        >
          <div className="relative min-h-[72px] px-4 pt-3 pb-12">
            {/* Paperclip icon - Top Left */}
            <div className="absolute top-2 left-2 z-10">
              <label className="cursor-pointer rounded-lg p-2 bg-black/30 hover:bg-black/40 transition-colors">
                <input type="file" className="hidden" />
                <Paperclip className="w-4 h-4 text-white/70 hover:text-white transition-colors" />
              </label>
            </div>
            
            <Textarea
              id="ai-input-04"
              value={value}
              placeholder=""
              className="w-full !bg-transparent !border-0 !border-none text-white resize-none !focus-visible:ring-0 !focus-visible:ring-offset-0 !focus-visible:outline-none !outline-none !ring-0 !shadow-none leading-[1.2] !p-0 min-h-[40px] !rounded-none pl-10"
              ref={textareaRef}
              style={{ 
                backgroundColor: 'transparent', 
                border: 'none', 
                outline: 'none', 
                boxShadow: 'none',
                background: 'transparent',
                backgroundImage: 'none',
                backgroundClip: 'padding-box'
              }}
              onFocus={(e) => {
                handleFocus();
                e.target.style.backgroundColor = 'transparent';
                e.target.style.background = 'transparent';
              }}
              onBlur={handleBlur}
              onKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                setValue(e.target.value);
                adjustHeight();
                e.target.style.backgroundColor = 'transparent';
                e.target.style.background = 'transparent';
              }}
            />
            {!value && (
              <div className="absolute left-12 top-3 text-white/80 pointer-events-none">
                {typingText">
                {typingText}
                <span className="animate-pulse">|</span>
              </div>
            )}
            
            {/* Buttons positioned at bottom */}
            <div className="absolute bottom-2 left-3 flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowSearch(!showSearch);
                }}
                className={cn(
                  "rounded-full transition-all flex items-center gap-2 px-1.5 py-1 border h-8 cursor-pointer",
                  showSearch
                    ? "bg-black/40 border-white/50 text-white"
                    : "bg-black/30 border-white/20 text-white/70 hover:text-white"
                )}
              >
                <div className="w-4 h-4 flex items-center justify-center shrink-0">
                  <motion.div
                    animate={{
                      rotate: showSearch ? 180 : 0,
                      scale: showSearch ? 1.1 : 1,
                    }}
                    whileHover={{
                      rotate: showSearch ? 180 : 15,
                      scale: 1.1,
                      transition: {
                        type: "spring",
                        stiffness: 300,
                        damping: 10,
                      },
                    }}
                    transition={{
                      type: "spring",
                      stiffness: 260,
                      damping: 25,
                    }}
                  >
                    <Sparkles
                      className={cn(
                        "w-4 h-4",
                        showSearch ? "text-white" : "text-inherit"
                      )}
                    />
                  </motion.div>
                </div>
                <AnimatePresence>
                  {showSearch && (
                    <motion.span
                      initial={{ width: 0, opacity: 0 }}
                      animate={{
                        width: "auto",
                        opacity: 1,
                      }}
                      exit={{ width: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="text-sm overflow-hidden whitespace-nowrap text-white shrink-0"
                    >
                      Auto-Fill
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
            </div>
            <div className="absolute bottom-2 right-3">
              <button
                type="button"
                onClick={handleSubmit}
                className={cn(
                  "rounded-full w-10 h-10 flex items-center justify-center transition-colors",
                  value
                    ? "bg-orange-500 text-white hover:bg-orange-600"
                    : "bg-black/30 text-white/50 hover:text-white/70 cursor-pointer"
                )}
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Plus, Image, FileText, Mic } from "lucide-react";
import { Button } from "./button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./dropdown-menu";

interface ChatInputProps {
  onSubmit?: (value: string) => void;
  placeholder?: string;
}

export default function ChatInput({
  onSubmit,
}: ChatInputProps) {
  const [value, setValue] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [typingText, setTypingText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Typing effect texts
  const typingTexts = [
    "Identify the best go-to-market strategy for SaaS products",
    "Find proven growth patterns for healthcare technology companies",
    "Discover lead generation strategies for B2B startups",
    "Analyze market entry tactics for fintech companies",
    "Generate qualified leads for enterprise software",
  ];

  // Typing animation effect
  useEffect(() => {
    let currentTextIndex = 0;
    let currentCharIndex = 0;
    let isDeleting = false;
    let timeoutId: ReturnType<typeof setTimeout>;

    const type = () => {
      const currentText = typingTexts[currentTextIndex];

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
        currentTextIndex = (currentTextIndex + 1) % typingTexts.length;
        timeoutId = setTimeout(type, 500);
      }
    };

    timeoutId = setTimeout(type, 1000);

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [value]);

  const handleSubmit = () => {
    if (onSubmit && value.trim()) {
      onSubmit(value);
    }
    setValue("");
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleFileUpload = (type: string) => {
    if (type === 'file') {
      fileInputRef.current?.click();
    } else if (type === 'image') {
      // Create a file input that only accepts images
      const imageInput = document.createElement('input');
      imageInput.type = 'file';
      imageInput.accept = 'image/*';
      imageInput.onchange = (e) => {
        const files = (e.target as HTMLInputElement).files;
        if (files && files.length > 0) {
          console.log("Image selected:", files[0]);
        }
      };
      imageInput.click();
    } else if (type === 'voice') {
      console.log("Voice recording triggered");
    }
  };

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      <div
        className={`relative rounded-2xl border transition-all duration-200 ${
          isFocused 
            ? 'border-white/40 bg-black/40' 
            : 'border-white/20 bg-black/20'
        } backdrop-blur-sm`}
      >
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder=""
          className="w-full px-4 py-3 pl-12 pr-16 bg-transparent text-white placeholder-transparent resize-none outline-none border-0 rounded-2xl min-h-[56px] max-h-[200px]"
          style={{
            fontFamily: 'inherit',
            lineHeight: '1.5'
          }}
        />
        
        {/* Plus button - Left corner */}
        <div className="absolute left-3 top-3">
          <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={`p-2 h-8 w-8 rounded-lg transition-all duration-200 ${
                  isMenuOpen ? 'text-white bg-white/15' : 'text-gray-400'
                } hover:text-white hover:bg-white/10`}
              >
                <Plus
                  className={`w-4 h-4 transition-transform duration-200 ${
                    isMenuOpen ? 'rotate-45' : 'rotate-0'
                  }`}
                />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              align="start"
              alignOffset={-18}
              sideOffset={4}
              className="bg-black/70 backdrop-blur-xl border border-white/15 text-white/90 rounded-2xl shadow-2xl px-1.5 py-1.5 min-w-[150px]"
            >
              <DropdownMenuItem 
                onClick={() => handleFileUpload('file')}
                className="flex items-center gap-2.5 px-2 py-1.5 rounded-xl cursor-pointer text-sm text-white/90 hover:bg-white/10 transition-colors"
              >
                <FileText className="w-4 h-4" />
                <span>Upload File</span>
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => handleFileUpload('image')}
                className="flex items-center gap-2.5 px-2 py-1.5 rounded-xl cursor-pointer text-sm text-white/90 hover:bg-white/10 transition-colors"
              >
                <Image className="w-4 h-4" />
                <span>Upload Image</span>
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => handleFileUpload('voice')}
                className="flex items-center gap-2.5 px-2 py-1.5 rounded-xl cursor-pointer text-sm text-white/90 hover:bg-white/10 transition-colors"
              >
                <Mic className="w-4 h-4" />
                <span>Voice Input</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        {/* Typing effect placeholder */}
        {!value && (
          <div className="absolute left-12 top-3 text-gray-400 pointer-events-none">
            {typingText}
            <span className="animate-pulse">|</span>
          </div>
        )}
        
        {/* Send Button - Right corner */}
        <div className="absolute right-3 top-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSubmit}
            disabled={!value.trim()}
            className={`p-2 rounded-lg transition-all h-8 w-8 ${
              value.trim() 
                ? 'text-white hover:text-white hover:bg-white/10' 
                : 'text-gray-500 cursor-not-allowed'
            }`}
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        
        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={(e) => {
            const files = e.target.files;
            if (files && files.length > 0) {
              console.log("Files selected:", files);
            }
          }}
          className="hidden"
          accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif"
        />
      </div>
      
      {/* Character count */}
      <div className="mt-2 text-xs text-gray-500 text-center">
        {value.length > 0 && `${value.length} characters`}
      </div>
    </div>
  );
}

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
import { useState } from "react";
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
    minHeight: minHeight,
    maxHeight: 200,
  });
  const [showSearch, setShowSearch] = useState(true);
  const [isFocused, setIsFocused] = useState(false);

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
            "relative flex flex-col rounded-xl transition-all duration-200 w-full text-left cursor-text",
            "bg-white/10 backdrop-blur-md border border-white/20",
            isFocused && "bg-white/15 border-white/30"
          )}
          onClick={handleContainerClick}
          onKeyDown={(e: React.KeyboardEvent<HTMLDivElement>) => {
            if (e.key === "Enter" || e.key === " ") {
              handleContainerClick();
            }
          }}
        >
          <div className="overflow-y-auto max-h-[200px]">
            <Textarea
              id="ai-input-04"
              value={value}
              placeholder={placeholder}
              className="w-full rounded-xl rounded-b-none px-4 py-3 bg-white/20 backdrop-blur-md border border-white/30 text-white placeholder:text-white placeholder:opacity-100 resize-none focus-visible:ring-0 leading-[1.2]"
              ref={textareaRef}
              onFocus={handleFocus}
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
              }}
            />
          </div>

          <div className="h-12 bg-white/20 backdrop-blur-md border border-white/30 border-t-0 rounded-b-xl">
            <div className="absolute left-3 bottom-3 flex items-center gap-2">
              <label className="cursor-pointer rounded-lg p-2 bg-white/10 hover:bg-white/20 transition-colors">
                <input type="file" className="hidden" />
                <Paperclip className="w-4 h-4 text-white/70 hover:text-white transition-colors" />
              </label>
              <button
                type="button"
                onClick={() => {
                  setShowSearch(!showSearch);
                }}
                className={cn(
                  "rounded-full transition-all flex items-center gap-2 px-1.5 py-1 border h-8 cursor-pointer",
                  showSearch
                    ? "bg-white/30 border-white/50 text-white"
                    : "bg-white/10 border-white/20 text-white/70 hover:text-white"
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
                      Search
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
            </div>
            <div className="absolute right-3 bottom-3">
              <button
                type="button"
                onClick={handleSubmit}
                className={cn(
                  "rounded-lg p-2 transition-colors",
                  value
                    ? "bg-white/30 text-white"
                    : "bg-white/10 text-white/50 hover:text-white/70 cursor-pointer"
                )}
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

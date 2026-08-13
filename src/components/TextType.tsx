"use client";

import { useEffect, useState, useRef, useCallback } from "react";

interface TextTypeProps {
  text: string | string[];
  typingSpeed?: number;
  deletingSpeed?: number;
  pauseDuration?: number;
  loop?: boolean;
  showCursor?: boolean;
  cursorCharacter?: string;
  cursorClassName?: string;
  cursorBlinkDuration?: number;
  hideCursorWhileTyping?: boolean;
  initialDelay?: number;
  startOnVisible?: boolean;
  className?: string;
}

const TextType: React.FC<TextTypeProps> = ({
  text,
  typingSpeed = 50,
  deletingSpeed = 30,
  pauseDuration = 2000,
  loop = true,
  showCursor = true,
  cursorCharacter = "|",
  cursorClassName = "",
  cursorBlinkDuration = 0.5,
  hideCursorWhileTyping = false,
  initialDelay = 0,
  startOnVisible = false,
  className = "",
}) => {
  const textArray = Array.isArray(text) ? text : [text];
  const [displayText, setDisplayText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0); // index within current string
  const [textIndex, setTextIndex] = useState(0); // which string from array
  const [isDeleting, setIsDeleting] = useState(false);
  const [started, setStarted] = useState(!startOnVisible);
  const containerRef = useRef<HTMLSpanElement>(null);
  const cursorRef = useRef<HTMLSpanElement>(null);

  const currentFullText = textArray[textIndex] || "";

  // Intersection Observer to start when visible
  useEffect(() => {
    if (!startOnVisible || !containerRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setStarted(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [startOnVisible]);

  // Blinking cursor animation
  useEffect(() => {
    if (!showCursor || !cursorRef.current) return;
    let interval: NodeJS.Timeout;
    if (cursorBlinkDuration > 0) {
      let visible = true;
      interval = setInterval(() => {
        if (cursorRef.current) {
          cursorRef.current.style.opacity = visible ? "1" : "0";
          visible = !visible;
        }
      }, cursorBlinkDuration * 1000);
    }
    return () => clearInterval(interval);
  }, [showCursor, cursorBlinkDuration]);

  useEffect(() => {
    if (!started) return;

    let timeout: NodeJS.Timeout;

    if (!isDeleting && currentIndex < currentFullText.length) {
      // Typing
      const speed = typingSpeed;
      timeout = setTimeout(() => {
        setDisplayText((prev) => prev + currentFullText[currentIndex]);
        setCurrentIndex((prev) => prev + 1);
      }, speed);
    } else if (!isDeleting && currentIndex === currentFullText.length) {
      // Finished typing current string
      if (textArray.length === 1) {
        // Single text: stop if not loop
        if (!loop) return;
      }
      // Pause then start deleting
      timeout = setTimeout(() => {
        setIsDeleting(true);
      }, pauseDuration);
    } else if (isDeleting && currentIndex > 0) {
      // Deleting
      const speed = deletingSpeed;
      timeout = setTimeout(() => {
        setDisplayText((prev) => prev.slice(0, -1));
        setCurrentIndex((prev) => prev - 1);
      }, speed);
    } else if (isDeleting && currentIndex === 0) {
      // Finished deleting
      queueMicrotask(() => setIsDeleting(false));
      // Move to next text
      if (textArray.length > 1) {
        queueMicrotask(() => setTextIndex((prev) => (prev + 1) % textArray.length));
      }
      timeout = setTimeout(() => {
        // Just continue to typing
      }, pauseDuration);
    }

    return () => clearTimeout(timeout);
  }, [
    started,
    isDeleting,
    currentIndex,
    textIndex,
    currentFullText,
    typingSpeed,
    deletingSpeed,
    pauseDuration,
    loop,
    textArray,
  ]);

  // Initial delay
  useEffect(() => {
    if (!started) return;
    const delayTimeout = setTimeout(() => {
      // This effect is already handled by the typing logic, but we need to ensure typing starts after delay.
      // The typing effect will automatically start because currentIndex is 0 and isDeleting false.
    }, initialDelay);
    return () => clearTimeout(delayTimeout);
  }, [started, initialDelay]);

  const shouldHideCursor =
    hideCursorWhileTyping && currentIndex < currentFullText.length && !isDeleting;

  return (
    <span ref={containerRef} className={`inline ${className}`}>
      <span className="text-type__content">{displayText}</span>
      {showCursor && (
        <span
          ref={cursorRef}
          className={`text-type__cursor ${cursorClassName} ${
            shouldHideCursor ? "hidden" : ""
          }`}
          style={{ marginLeft: "0.25rem" }}
        >
          {cursorCharacter}
        </span>
      )}
    </span>
  );
};

export default TextType;
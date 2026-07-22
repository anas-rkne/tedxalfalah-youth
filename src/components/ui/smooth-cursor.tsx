"use client"

import { FC, useEffect, useRef, useState } from "react"
import { motion, useSpring, AnimatePresence } from "framer-motion"

interface Position {
  x: number
  y: number
}

export interface SmoothCursorProps {
  cursor?: "paper-plane" | "pulse-dot" | "blend-circle" | "bubble-trail" | "ring"
  springConfig?: {
    damping: number
    stiffness: number
    mass: number
    restDelta: number
  }
}

const DESKTOP_POINTER_QUERY = "(any-hover: hover) and (any-pointer: fine)"

function isTrackablePointer(pointerType: string) {
  return pointerType !== "touch"
}

/* ═══════════════════════════════════════════════════════════════
   أيقونة طائرة ورقية TEDx — الأنيقة والشبابية
   ═══════════════════════════════════════════════════════════════ */
const PaperPlaneCursor: FC<{ hovering: boolean }> = ({ hovering }) => {
  return (
    <motion.div
      animate={{
        scale: hovering ? 1.2 : 1,
        rotate: hovering ? -15 : 0,
      }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className="relative"
    >
      {/* توهج hover */}
      <AnimatePresence>
        {hovering && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1.5, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, repeat: Infinity, ease: "easeOut" }}
            className="absolute inset-0 rounded-full bg-[#e62b1e]/20"
          />
        )}
      </AnimatePresence>

      {/* الطائرة الورقية */}
      <svg
        width="32"
        height="32"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#e62b1e"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="drop-shadow-[0_2px_8px_rgba(230,43,30,0.3)]"
      >
        {/* جسم الطائرة */}
        <path d="M2 12l20-9-9 20-2-9-9-2z" />
        {/* خط التفصيل */}
        <path d="M13 3l-2 9" strokeWidth="1.2" opacity="0.6" />
      </svg>

      {/* نقطة حمراء صغيرة تتبع */}
      <motion.div
        animate={{
          scale: hovering ? 1 : 0,
          opacity: hovering ? 1 : 0,
        }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        className="absolute -bottom-1 -right-1 w-2 h-2 rounded-full bg-[#e62b1e]"
      />
    </motion.div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   ١: نقطة نبض TEDx
   ═══════════════════════════════════════════════════════════════ */
const PulseDotCursor: FC<{ hovering: boolean }> = ({ hovering }) => {
  return (
    <div className="relative flex items-center justify-center">
      <AnimatePresence>
        {hovering && (
          <motion.div
            initial={{ scale: 1, opacity: 0.5 }}
            animate={{ scale: 2.5, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, repeat: Infinity, ease: "easeOut" }}
            className="absolute inset-0 rounded-full bg-[#e62b1e]/30"
          />
        )}
      </AnimatePresence>
      <motion.div
        animate={{
          width: hovering ? 16 : 8,
          height: hovering ? 16 : 8,
        }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        className="rounded-full bg-[#e62b1e]"
      />
      <motion.div
        animate={{
          scale: hovering ? 0.5 : 0,
          opacity: hovering ? 1 : 0,
        }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        className="absolute w-2 h-2 rounded-full bg-white"
      />
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   ٢: دائرة blend mode
   ═══════════════════════════════════════════════════════════════ */
const BlendCircleCursor: FC<{ hovering: boolean }> = ({ hovering }) => {
  return (
    <div className="relative flex items-center justify-center">
      <motion.div
        animate={{
          width: hovering ? 48 : 24,
          height: hovering ? 48 : 24,
        }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="rounded-full bg-white border-2 border-[#e62b1e]"
        style={{ mixBlendMode: "difference" }}
      />
      <motion.div
        animate={{
          scale: hovering ? 0.6 : 1,
          opacity: hovering ? 0.5 : 1,
        }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        className="absolute w-1.5 h-1.5 rounded-full bg-[#e62b1e]"
      />
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   ٣: أثر فقاعات TEDx
   ═══════════════════════════════════════════════════════════════ */
interface Bubble {
  id: number
  x: number
  y: number
  size: number
}

const BubbleTrailCursor: FC<{
  hovering: boolean
  position: Position
}> = ({ hovering, position }) => {
  const [bubbles, setBubbles] = useState<Bubble[]>([])
  const bubbleId = useRef(0)
  const lastBubbleTime = useRef(0)

  useEffect(() => {
    const now = Date.now()
    if (now - lastBubbleTime.current > 80) {
      lastBubbleTime.current = now
      const newBubble: Bubble = {
        id: bubbleId.current++,
        x: position.x,
        y: position.y,
        size: Math.random() * 6 + 4,
      }
      setBubbles((prev) => [...prev.slice(-12), newBubble])
    }
  }, [position])

  return (
    <>
      <AnimatePresence>
        {bubbles.map((bubble) => (
          <motion.div
            key={bubble.id}
            initial={{ scale: 1, opacity: 0.6 }}
            animate={{ scale: 0, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="absolute rounded-full bg-[#e62b1e]/20 pointer-events-none"
            style={{
              width: bubble.size,
              height: bubble.size,
              left: bubble.x - bubble.size / 2,
              top: bubble.y - bubble.size / 2,
            }}
          />
        ))}
      </AnimatePresence>
      <motion.div
        animate={{
          width: hovering ? 20 : 10,
          height: hovering ? 20 : 10,
          boxShadow: hovering
            ? "0 0 20px rgba(230,43,30,0.4), 0 0 40px rgba(230,43,30,0.2)"
            : "0 0 10px rgba(230,43,30,0.2)",
        }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        className="rounded-full bg-[#e62b1e]"
      />
    </>
  )
}

/* ═══════════════════════════════════════════════════════════════
   الدائرة الحمراء القديمة
   ═══════════════════════════════════════════════════════════════ */
const TedxRing: FC<{ hovering: boolean }> = ({ hovering }) => (
  <motion.div
    animate={{
      width: hovering ? 40 : 12,
      height: hovering ? 40 : 12,
      borderRadius: "9999px",
      borderWidth: 2,
      borderStyle: "solid",
      borderColor: hovering
        ? "rgba(220, 38, 38, 0.6)"
        : "rgba(220, 38, 38, 0.4)",
      backgroundColor: hovering
        ? "rgba(220, 38, 38, 0.12)"
        : "transparent",
      boxShadow: hovering
        ? "0 0 20px rgba(220,38,38,0.3), 0 0 40px rgba(220,38,38,0.1)"
        : "0 0 0px transparent",
    }}
    transition={{ type: "spring", stiffness: 300, damping: 25 }}
  />
)

export function SmoothCursor({
  cursor = "paper-plane",
  springConfig = {
    damping: 45,
    stiffness: 400,
    mass: 1,
    restDelta: 0.001,
  },
}: SmoothCursorProps) {
  const lastMousePos = useRef<Position>({ x: 0, y: 0 })
  const velocity = useRef<Position>({ x: 0, y: 0 })
  const lastUpdateTime = useRef(Date.now())
  const previousAngle = useRef(0)
  const accumulatedRotation = useRef(0)
  const [isEnabled, setIsEnabled] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const [isHovering, setIsHovering] = useState(false)
  const [currentPos, setCurrentPos] = useState<Position>({ x: 0, y: 0 })

  const cursorX = useSpring(0, springConfig)
  const cursorY = useSpring(0, springConfig)
  const rotation = useSpring(0, {
    ...springConfig,
    damping: 60,
    stiffness: 300,
  })
  const scale = useSpring(1, {
    ...springConfig,
    stiffness: 500,
    damping: 35,
  })

  useEffect(() => {
    const mediaQuery = window.matchMedia(DESKTOP_POINTER_QUERY)

    const updateEnabled = () => {
      const nextIsEnabled = mediaQuery.matches
      setIsEnabled(nextIsEnabled)

      if (!nextIsEnabled) {
        setIsVisible(false)
      }
    }

    updateEnabled()
    mediaQuery.addEventListener("change", updateEnabled)

    return () => {
      mediaQuery.removeEventListener("change", updateEnabled)
    }
  }, [])

  useEffect(() => {
    if (!isEnabled) {
      return
    }

    let timeout: ReturnType<typeof setTimeout> | null = null

    const updateVelocity = (currentPos: Position) => {
      const currentTime = Date.now()
      const deltaTime = currentTime - lastUpdateTime.current

      if (deltaTime > 0) {
        velocity.current = {
          x: (currentPos.x - lastMousePos.current.x) / deltaTime,
          y: (currentPos.y - lastMousePos.current.y) / deltaTime,
        }
      }

      lastUpdateTime.current = currentTime
      lastMousePos.current = currentPos
    }

    const smoothPointerMove = (e: PointerEvent) => {
      if (!isTrackablePointer(e.pointerType)) {
        return
      }

      setIsVisible(true)

      const pos = { x: e.clientX, y: e.clientY }
      setCurrentPos(pos)
      updateVelocity(pos)

      const speed = Math.sqrt(
        Math.pow(velocity.current.x, 2) + Math.pow(velocity.current.y, 2)
      )

      cursorX.set(pos.x)
      cursorY.set(pos.y)

      if (speed > 0.1) {
        const currentAngle =
          Math.atan2(velocity.current.y, velocity.current.x) * (180 / Math.PI) +
          90

        let angleDiff = currentAngle - previousAngle.current
        if (angleDiff > 180) angleDiff -= 360
        if (angleDiff < -180) angleDiff += 360
        accumulatedRotation.current += angleDiff
        rotation.set(accumulatedRotation.current)
        previousAngle.current = currentAngle

        scale.set(0.95)

        if (timeout !== null) {
          clearTimeout(timeout)
        }

        timeout = setTimeout(() => {
          scale.set(1)
        }, 150)
      }
    }

    let rafId = 0
    const throttledPointerMove = (e: PointerEvent) => {
      if (!isTrackablePointer(e.pointerType)) {
        return
      }

      if (rafId) return

      rafId = requestAnimationFrame(() => {
        smoothPointerMove(e)
        rafId = 0
      })
    }

    function handlePointerOver(e: PointerEvent) {
      if (!isTrackablePointer(e.pointerType)) return
      const target = e.target as HTMLElement
      setIsHovering(
        Boolean(
          target.closest(
            "button, a, [role='button'], input, select, textarea"
          )
        )
      )
    }

    document.body.style.cursor = "none"
    window.addEventListener("pointermove", throttledPointerMove, {
      passive: true,
    })
    window.addEventListener("pointerover", handlePointerOver)

    return () => {
      window.removeEventListener("pointermove", throttledPointerMove)
      window.removeEventListener("pointerover", handlePointerOver)
      document.body.style.cursor = "auto"
      if (rafId) cancelAnimationFrame(rafId)
      if (timeout !== null) {
        clearTimeout(timeout)
      }
    }
  }, [cursorX, cursorY, rotation, scale, isEnabled])

  if (!isEnabled) {
    return null
  }

  const renderCursor = () => {
    switch (cursor) {
      case "paper-plane":
        return <PaperPlaneCursor hovering={isHovering} />
      case "blend-circle":
        return <BlendCircleCursor hovering={isHovering} />
      case "bubble-trail":
        return <BubbleTrailCursor hovering={isHovering} position={currentPos} />
      case "ring":
        return <TedxRing hovering={isHovering} />
      case "pulse-dot":
      default:
        return <PulseDotCursor hovering={isHovering} />
    }
  }

  return (
    <motion.div
      style={{
        position: "fixed",
        left: cursorX,
        top: cursorY,
        translateX: "-50%",
        translateY: "-50%",
        rotate: rotation,
        scale: scale,
        zIndex: 100,
        pointerEvents: "none",
        willChange: "transform",
        opacity: isVisible ? 1 : 0,
      }}
      initial={false}
      animate={{ opacity: isVisible ? 1 : 0 }}
      transition={{ duration: 0.15 }}
    >
      {renderCursor()}
    </motion.div>
  )
}

export default SmoothCursor
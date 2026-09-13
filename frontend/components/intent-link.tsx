"use client";
import NextLink, { useLinkStatus } from "next/link";
import { useState, type ComponentProps } from "react";

// Warm only the normal Next.js shell on intent, never force a long-lived
// prefetch of private page data. Keep native links and keyboard behavior.
function PendingNavigation() {
  const {pending} = useLinkStatus();
  if (!pending) return null;
  return <><span className="sr-only" role="status">Abriendo sección…</span><span aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-0.5 bg-cyan motion-safe:animate-pulse" /></>;
}

export function IntentLink({onMouseEnter,onFocus,onTouchStart,children,className,...props}:Omit<ComponentProps<typeof NextLink>,"prefetch">) {
  const [intent,setIntent] = useState(false);
  return <NextLink {...props} className={`${className??""} relative`} prefetch={intent ? null : false}
    onMouseEnter={e=>{onMouseEnter?.(e);if(!e.defaultPrevented)setIntent(true);}}
    onFocus={e=>{onFocus?.(e);if(!e.defaultPrevented)setIntent(true);}}
    onTouchStart={e=>{onTouchStart?.(e);if(!e.defaultPrevented)setIntent(true);}}
  >{children}<PendingNavigation/></NextLink>;
}

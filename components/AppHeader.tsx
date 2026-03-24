"use client";

import Link from "next/link";
import { IoCloseOutline, IoPersonOutline } from "react-icons/io5";
import { RxHamburgerMenu } from "react-icons/rx";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

export default function AppHeader() {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const pathName = usePathname();

  useEffect(() => {
    setIsCollapsed(true);
  }, [pathName]);

  if (pathName === "/auth/login" || pathName === "/auth/signup") return null;

  return (
    <header className="sticky top-0 z-50 w-full glass border-b border-border transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="group flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/30 group-hover:scale-110 transition-transform">
            <span className="text-white font-black text-xl">F</span>
          </div>
          <p className="text-xl font-bold tracking-tight bg-gradient-to-r from-text to-text-muted bg-clip-text text-transparent">
            Fridge
          </p>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden sm:flex items-center gap-6">
          <Link 
            href="/auth/logout" 
            className="btn btn-ghost text-sm font-medium flex items-center gap-2"
          >
            <IoPersonOutline className="text-lg" />
            <span>Logout</span>
          </Link>
        </nav>

        {/* Mobile menu button */}
        <button
          className="sm:hidden btn btn-ghost p-2"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {isCollapsed ? (
            <RxHamburgerMenu className="text-2xl" />
          ) : (
            <IoCloseOutline className="text-2xl" />
          )}
        </button>
      </div>

      {/* Mobile Nav Overlay */}
      <AnimatePresence>
        {!isCollapsed && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCollapsed(true)}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 sm:hidden"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 h-dvh w-64 bg-background border-l border-border z-50 p-6 flex flex-col gap-6 sm:hidden"
            >
              <div className="flex items-center justify-between font-bold text-lg mb-4">
                <span>Menu</span>
                <button onClick={() => setIsCollapsed(true)} className="p-2 -mr-2">
                  <IoCloseOutline className="text-2xl" />
                </button>
              </div>
              <Link
                href="/auth/logout"
                className="btn btn-secondary justify-start w-full"
                onClick={() => setIsCollapsed(true)}
              >
                <IoPersonOutline className="text-xl" />
                <span>Logout</span>
              </Link>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}
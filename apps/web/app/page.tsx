"use client";

import { Button } from "@/components/ui/button";
import { ArrowUpRight, Moon, Sun, FileText, Users, Code, BookOpen } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import React, { useState, useEffect } from "react";
import Link from "next/link";

const projects = [
  {
    client: "Valhalla Brush",
    title: "Different Day",
    img: "https://placehold.co/800x600/FF9900/000000?text=Valhalla",
  },
  {
    client: "Sound Lab",
    title: "Cooking Something",
    img: "https://placehold.co/800x600/3498db/ffffff?text=Music",
  },
  {
    client: "MeetX",
    title: "Nightmare",
    img: "https://placehold.co/800x600/e74c3c/ffffff?text=MeetX",
  },
];

const newsItems = [
  {
    title: "Breaking Through Creative Roadblocks",
    img: "https://placehold.co/400x500/34495e/ffffff?text=Creative",
    date: "September 26, 2025",
  },
  {
    title: "30 Creatives Spill Their Secrets",
    img: "https://placehold.co/400x500/9b59b6/ffffff?text=Secrets",
    date: "September 15, 2025",
  },
  {
    title: "PageSmith's Campaign Wins Ad of the Year",
    img: "https://placehold.co/400x500/1abc9c/ffffff?text=AWARD",
    date: "September 02, 2025",
  },
];

const features = [
  {
    icon: FileText,
    title: "Readme Preview",
    description: "Check and format your documentation with live preview capabilities.",
  },
  {
    icon: BookOpen,
    title: "Save Notes",
    description: "Capture and organize your thoughts and ideas in one place.",
  },
  {
    icon: Users,
    title: "Real-time Collaboration",
    description: "Work together seamlessly with your team on projects and documents.",
  },
  {
    icon: Code,
    title: "Code Snippets",
    description: "Save, organize, and reuse code snippets for any purpose.",
  },
];

// Animated Googly Eyes Graphic
const GooglyEyes = () => (
  <motion.div
    className="relative w-48 h-24"
    animate={{ rotate: [0, -5, 5, -5, 0] }}
    transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
  >
    <div className="absolute top-0 left-0 w-20 h-20 bg-white rounded-full border-2 border-black flex items-center justify-center">
      <motion.div
        className="w-8 h-8 bg-black rounded-full"
        animate={{ x: [-8, 8, -8], y: [-5, 5, -5] }}
        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
      />
    </div>
    <div className="absolute top-0 right-0 w-20 h-20 bg-white rounded-full border-2 border-black flex items-center justify-center">
      <motion.div
        className="w-8 h-8 bg-black rounded-full"
        animate={{ x: [8, -8, 8], y: [5, -5, 5] }}
        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
      />
    </div>
  </motion.div>
);

export default function LandingPage() {
  const [currentProject, setCurrentProject] = useState(0);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    // Check localStorage first
    const savedMode = localStorage.getItem("darkMode");
    
    if (savedMode !== null) {
      const isDark = savedMode === "true";
      setIsDarkMode(isDark);
      // Immediately apply the class to prevent flash
      if (isDark) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    } else {
      // Fall back to system preference
      const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches;
      setIsDarkMode(prefersDark);
      if (prefersDark) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentProject((prev) => (prev + 1) % projects.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("darkMode", "true");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("darkMode", "false");
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  return (
    <main className="w-full bg-[#F0F0F0] dark:bg-[#1a1a1a] text-[#111111] dark:text-[#F0F0F0]">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 flex justify-between items-center p-4 px-8 bg-[#F0F0F0]/80 dark:bg-[#1a1a1a]/80 backdrop-blur-sm border-b border-black dark:border-white">
        <Link href="/" className="text-2xl font-black cursor-pointer">
          PageSmith
        </Link>
        <nav className="hidden md:flex items-center gap-6 font-bold">
          <a href="#work" className="cursor-pointer">
            Work
          </a>
          <a href="#features" className="cursor-pointer">
            Features
          </a>
          <a href="#news" className="cursor-pointer">
            News
          </a>
          <a href="#about" className="cursor-pointer">
            About
          </a>
          <Button className="bg-black dark:bg-white text-white dark:text-black rounded-none hover:bg-black/80 dark:hover:bg-white/80">
            CONTACT
          </Button>
        </nav>
        <button
          onClick={toggleDarkMode}
          className="ml-4 p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10"
          aria-label="Toggle dark mode"
        >
          {isDarkMode ? (
            <Sun className="h-5 w-5" />
          ) : (
            <Moon className="h-5 w-5" />
          )}
        </button>
      </header>

      {/* Vertical Text Sidebar */}
      <div className="fixed top-0 left-0 z-40 h-full hidden md:flex items-center justify-center border-r border-black dark:border-white bg-[#F0F0F0] dark:bg-[#1a1a1a]">
        <span className="font-black text-xl [writing-mode:vertical-rl] tracking-widest uppercase">
          Work Work Work Work Work Work
        </span>
      </div>

      <div className="md:ml-16 pt-20">
        {/* Hero Section */}
        <section
          id="work"
          className="min-h-[90vh] grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border-b-2 border-black dark:border-white"
        >
          <div className="border border-black dark:border-white p-2 h-[60vh] md:h-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentProject}
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 50 }}
                transition={{ duration: 0.5 }}
                className="w-full h-full bg-cover bg-center relative"
                style={{
                  backgroundImage: `url(${projects[currentProject].img})`,
                }}
              >
                <div className="absolute bottom-4 left-4 text-black bg-white p-2 font-bold">
                  <p className="text-sm">{projects[currentProject].client}</p>
                  <h2 className="text-2xl">{projects[currentProject].title}</h2>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
          <div className="border border-black dark:border-white p-8 flex flex-col justify-center">
            <GooglyEyes />
            <h1 className="text-4xl md:text-5xl font-black mt-8 leading-tight">
              FOR One Month, WE&apos;VE BEEN COLLABORATING, SHAPING STORIES, AND
              CRAFTING RELATABLE HUMOR FOR BIG BRANDS.
            </h1>
          </div>
        </section>

        {/* Features Section */}
        <section
          id="features"
          className="p-4 md:p-8 border-b-2 border-black dark:border-white bg-white dark:bg-[#0a0a0a]"
        >
          <div className="p-4 md:p-8">
            <h2 className="text-5xl md:text-7xl font-black mb-12">POWERFUL FEATURES</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <motion.div
                    key={index}
                    className="border-2 border-black dark:border-white p-6"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.5 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  >
                    <Icon className="h-12 w-12 mb-4" />
                    <h3 className="text-2xl font-black mb-2">{feature.title}</h3>
                    <p className="text-lg dark:text-gray-300">{feature.description}</p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* News Section */}
        <section
          id="news"
          className="p-4 border-b-2 border-black dark:border-white bg-[#FF4136] dark:bg-[#8B0000] text-white"
        >
          <div className="p-8">
            <h2 className="text-8xl md:text-9xl font-black">IN YOUR</h2>
            <h2 className="text-8xl md:text-9xl font-black">FEED.</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {newsItems.map((item, index) => (
              <motion.div
                key={index}
                className="border border-white p-2"
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 0.5, delay: index * 0.2 }}
              >
                <div
                  className="h-64 bg-cover bg-center"
                  style={{ backgroundImage: `url(${item.img})` }}
                />
                <div className="p-4 bg-white/10">
                  <p className="font-bold text-xl">{item.title}</p>
                  <p className="text-sm mt-2">{item.date}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* About Section */}
        <section
          id="about"
          className="p-12 text-center flex flex-col items-center justify-center min-h-[60vh]"
        >
          <h2 className="text-4xl md:text-6xl font-black">YOUR ALL-IN-ONE</h2>
          <h2 className="text-4xl md:text-6xl font-black">
            COLLABORATIVE CANVAS
          </h2>
          <p className="max-w-3xl mx-auto mt-8 text-lg">
            Inspired by Notion, built for productivity. Bring your ideas, code,
            and tasks together in one seamless, real-time workspace. We provide
            the tools, you provide the genius.
          </p>
          <Link href="/sign-up">
            <Button
              size="lg"
              className="bg-black dark:bg-white text-white dark:text-black rounded-none hover:bg-black/80 dark:hover:bg-white/80 mt-8"
            >
              Get Started Free <ArrowUpRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </section>
      </div>
    </main>
  );
}
"use client";

import { Button } from "@/components/ui/button";
import {
  ArrowUpRight,
  Moon,
  Sun,
  FileText,
  Users,
  Code,
  Zap,
  Share2,
  Terminal,
  Cpu,
  LayoutTemplate,
  CheckCircle2,
} from "lucide-react";
import { motion } from "motion/react";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

// --- Data & Content ---

const useCases = [
  {
    title: "Engineering Wikis",
    description: "Centralize your technical documentation. Store code snippets, API schemas, and architecture diagrams with full syntax highlighting.",
    icon: Terminal,
    color: "bg-[#FF9900]", // Vibrant Orange
  },
  {
    title: "Product Specs (PRDs)",
    description: "Collaborate on requirements in real-time. Use the AI assistant to brainstorm features and generate user stories instantly.",
    icon: LayoutTemplate,
    color: "bg-[#3498db]", // Bright Blue
  },
  {
    title: "Knowledge Base",
    description: "Build a personal or team brain. Organize notes, meeting minutes, and ideas in a clean, distraction-free markdown environment.",
    icon: FileText,
    color: "bg-[#e74c3c]", // Bold Red
  },
];

const howItWorks = [
  {
    step: "01",
    title: "Create a Canvas",
    desc: "Start with a blank slate. Our editor supports rich Markdown, slash commands, and code blocks out of the box.",
  },
  {
    step: "02",
    title: "Invite Your Team",
    desc: "Click 'Share', copy your unique User ID, and add collaborators. Control access with Read/Write permissions.",
  },
  {
    step: "03",
    title: "Build Together",
    desc: "See changes happen in real-time. Co-author documents, debug code snippets, and refine content simultaneously.",
  },
];

const features = [
  {
    title: "Real-time Sync",
    desc: "Modifications appear instantly across all connected devices via WebSockets.",
    icon: Zap,
  },
  {
    title: "Gemini AI Powered",
    desc: "Ask the AI to write code, summarize text, or generate ideas directly in the editor.",
    icon: Cpu,
  },
  {
    title: "Code Highlighting",
    desc: "Support for JS, TS, Python, Java, and more with beautiful syntax coloring.",
    icon: Code,
  },
  {
    title: "Secure Sharing",
    desc: "Granular control over who views or edits your intellectual property.",
    icon: Users,
  },
];

export default function LandingPage() {
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Theme Management
  useEffect(() => {
    const savedMode = localStorage.getItem("darkMode");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    
    if (savedMode !== null) {
      setIsDarkMode(savedMode === "true");
    } else {
      setIsDarkMode(prefersDark);
    }
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

  return (
    <main 
      style={{ fontFamily: "'Poppins', sans-serif" }}
      className="w-full min-h-screen bg-[#F0F0F0] dark:bg-[#111111] text-[#111111] dark:text-[#F0F0F0] transition-colors duration-300"
    >
      
      {/* --- Navigation --- */}
      <header className="fixed top-0 left-0 right-0 z-50 flex justify-between items-center p-4 px-8 bg-[#F0F0F0]/90 dark:bg-[#111111]/90 backdrop-blur-sm border-b-2 border-black dark:border-white">
        <Link href="/" className="text-2xl font-black cursor-pointer tracking-tighter">
          PageSmith.
        </Link>
        
        <nav className="hidden md:flex items-center gap-8 font-bold text-sm uppercase tracking-wider">
          <a href="#use-cases" className="hover:underline decoration-2 underline-offset-4">Use Cases</a>
          <a href="#how-it-works" className="hover:underline decoration-2 underline-offset-4">How it Works</a>
          <a href="#features" className="hover:underline decoration-2 underline-offset-4">Features</a>
        </nav>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-2 border-2 border-transparent hover:border-black dark:hover:border-white transition-all rounded-full"
            aria-label="Toggle theme"
          >
            {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
          <Link href="/sign-in">
            <Button className="rounded-none border-2 border-black dark:border-white bg-black text-white hover:bg-white hover:text-black dark:bg-white dark:text-black dark:hover:bg-black dark:hover:text-white transition-all font-bold uppercase tracking-wide">
              Sign In
            </Button>
          </Link>
        </div>
      </header>

      {/* --- Sidebar Decoration --- */}
      <div className="fixed top-0 left-0 z-40 h-full hidden md:flex items-center justify-center border-r-2 border-black dark:border-white bg-[#F0F0F0] dark:bg-[#111111] w-16">
        <span className="font-black text-xl [writing-mode:vertical-rl] tracking-widest uppercase whitespace-nowrap">
          COLLABORATE • CREATE • CONQUER
        </span>
      </div>

      <div className="md:ml-16 pt-24">
        
        {/* --- Hero Section --- */}
        <section className="min-h-[85vh] flex flex-col justify-center px-6 md:px-20 border-b-2 border-black dark:border-white relative overflow-hidden">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-5xl z-10"
          >
            <div className="inline-block mb-6 px-4 py-2 border-2 border-black dark:border-white bg-[#FF4136] text-white font-bold text-sm uppercase tracking-wider shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
              Rediscover the joy of writing
            </div>
            <h1 className="text-6xl md:text-8xl lg:text-9xl font-black tracking-tighter leading-[0.9] mb-8">
              THE ALL-IN-ONE<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 animate-gradient-x">WORKSPACE</span>
            </h1>
            <p className="text-xl md:text-2xl font-bold max-w-2xl mb-12 opacity-80 leading-normal">
              PageSmith is where technical teams write docs, manage tasks, 
              and write code together in real-time. No fluff, just focus.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/sign-up">
                <Button size="lg" className="h-16 px-10 rounded-none text-xl font-black bg-black text-white hover:bg-white hover:text-black border-2 border-black dark:bg-white dark:text-black dark:hover:bg-black dark:hover:text-white dark:border-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_rgba(255,255,255,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] transition-all">
                  GET STARTED FREE <ArrowUpRight className="ml-2 h-6 w-6" />
                </Button>
              </Link>
              <Link href="#how-it-works">
                <Button size="lg" variant="ghost" className="h-16 px-10 rounded-none text-xl font-bold border-2 border-black dark:border-white hover:bg-black/5 dark:hover:bg-white/10">
                  HOW IT WORKS
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Decorative Grid Background */}
          <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none" 
               style={{ backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '40px 40px' }} 
          />
        </section>

        {/* --- Use Cases Section --- */}
        <section id="use-cases" className="border-b-2 border-black dark:border-white">
          <div className="grid grid-cols-1 lg:grid-cols-3">
            {useCases.map((useCase, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className={cn(
                  "p-12 border-b-2 lg:border-b-0 lg:border-r-2 border-black dark:border-white last:border-r-0 hover:bg-black/5 dark:hover:bg-white/5 transition-colors group",
                  index === 0 && "bg-[#F0F0F0] dark:bg-[#111111]", 
                  index === 1 && "bg-[#F0F0F0] dark:bg-[#111111]",
                  index === 2 && "bg-[#F0F0F0] dark:bg-[#111111]"
                )}
              >
                <div className={cn("w-16 h-16 flex items-center justify-center border-2 border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] mb-8", useCase.color)}>
                  <useCase.icon className="h-8 w-8 text-black dark:text-white" />
                </div>
                <h3 className="text-3xl font-black mb-4 group-hover:underline decoration-4 underline-offset-4">{useCase.title}</h3>
                <p className="text-lg font-medium opacity-80 leading-relaxed">
                  {useCase.description}
                </p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* --- How It Works Section --- */}
        <section id="how-it-works" className="py-24 px-6 md:px-20 border-b-2 border-black dark:border-white bg-white dark:bg-[#0a0a0a]">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-5xl md:text-7xl font-black mb-16 uppercase tracking-tight text-center md:text-left">
              Workflow <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF4136] to-[#FF851B]">Simplicity.</span>
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              {howItWorks.map((item, index) => (
                <div key={index} className="relative group">
                  <div className="text-9xl font-black text-black/5 dark:text-white/5 absolute -top-10 -left-6 z-0 group-hover:text-black/10 dark:group-hover:text-white/10 transition-colors select-none">
                    {item.step}
                  </div>
                  <div className="relative z-10 border-l-4 border-black dark:border-white pl-6 py-2">
                    <h3 className="text-2xl font-black mb-4 uppercase">{item.title}</h3>
                    <p className="text-lg font-medium opacity-80">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* --- Features Grid --- */}
        <section id="features" className="border-b-2 border-black dark:border-white bg-[#FF4136] dark:bg-[#8B0000] text-white">
          <div className="p-12 md:p-24">
            <h2 className="text-5xl md:text-8xl font-black mb-16 text-center leading-none">
              EVERYTHING<br/>YOU NEED.
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((f, i) => (
                <motion.div
                  key={i}
                  whileHover={{ scale: 1.02, rotate: 1 }}
                  className="bg-black border-2 border-white p-6 shadow-[8px_8px_0px_0px_rgba(255,255,255,1)]"
                >
                  <f.icon className="h-10 w-10 mb-4 text-white" />
                  <h3 className="text-xl font-black mb-2 uppercase">{f.title}</h3>
                  <p className="opacity-80 text-sm font-medium">{f.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* --- CTA Section --- */}
        <section className="py-32 px-6 text-center bg-[#F0F0F0] dark:bg-[#111111]">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl md:text-6xl font-black mb-8 tracking-tighter uppercase">
              Ready to ship faster?
            </h2>
            <p className="text-xl md:text-2xl font-bold mb-12 opacity-70">
              Join thousands of developers organizing their digital life with PageSmith.
            </p>
            <Link href="/sign-up">
              <Button size="lg" className="h-20 px-16 rounded-none text-2xl font-black bg-black text-white hover:bg-[#FF4136] hover:text-white border-4 border-black dark:border-white dark:bg-white dark:text-black dark:hover:bg-[#FF4136] dark:hover:text-white transition-all shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
                START BUILDING NOW
              </Button>
            </Link>
          </div>
        </section>

        {/* --- Footer --- */}
        <footer className="border-t-2 border-black dark:border-white py-12 px-8 bg-black text-white dark:bg-white dark:text-black">
          <div className="container mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white dark:bg-black rounded-none flex items-center justify-center">
                 <span className="text-black dark:text-white font-black text-lg">P</span>
              </div>
              <span className="font-black text-2xl tracking-tighter">PAGESMITH</span>
            </div>
            
            <div className="flex gap-8 text-sm font-bold uppercase tracking-widest">
              <a href="#" className="hover:underline decoration-2 underline-offset-4">Twitter</a>
              <a href="#" className="hover:underline decoration-2 underline-offset-4">GitHub</a>
              <a href="#" className="hover:underline decoration-2 underline-offset-4">Discord</a>
            </div>

            <p className="text-xs font-bold opacity-60 uppercase">
              © {new Date().getFullYear()} Valhalla Brush. All rights reserved.
            </p>
          </div>
        </footer>

      </div>
    </main>
  );
}
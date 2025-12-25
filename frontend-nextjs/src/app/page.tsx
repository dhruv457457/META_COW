"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useWallet } from "@/context/WalletContext";
import { motion, useScroll, useTransform } from "framer-motion";
import MetaCowModel from "@/components/MetaCowModel";
import SearchFollow from "@/components/SearchFollow";

// --- Icons ---
const SwapIcon = (props: any) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>;
const LiquidityIcon = (props: any) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M7 16V4m0 12L4 13m3 3l3-3m-3 3h12a2 2 0 002-2V8a2 2 0 00-2-2H7" /></svg>;
const SocialIcon = (props: any) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>;
const CopyIcon = (props: any) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>;
const LightningIcon = (props: any) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>;
const ShieldIcon = (props: any) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>;
const RocketIcon = (props: any) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>;
const ChartIcon = (props: any) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" /></svg>;

export default function Home() {
  const { isConnected, connectWallet } = useWallet();
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 500], [0, -100]);
  const y2 = useTransform(scrollY, [0, 500], [0, 150]);
  const heroOpacity = useTransform(scrollY, [0, 400], [1, 0]);

  const setMouseCoordsFromSection = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    setMouse({ x, y });
  };

  const features = [
    { 
      title: "Real-Time Indexing", 
      description: "Powered by Envio - index swap events in milliseconds for instant trade detection and copy execution.", 
      icon: LightningIcon, 
      color: "blue",
      tech: "Envio" 
    },
    { 
      title: "Advanced Permissions", 
      description: "MetaMask Flask ERC-7715 enables one-time approvals with fine-grained spending controls.", 
      icon: ShieldIcon, 
      color: "purple",
      tech: "MetaMask Flask" 
    },
    { 
      title: "Social Trading Feed", 
      description: "See every trade on-chain in real-time. Follow top traders and copy their moves instantly.", 
      icon: SocialIcon, 
      color: "pink",
      tech: "Envio GraphQL" 
    },
    { 
      title: "Auto Copy Trading", 
      description: "Copy trades in <5 seconds with zero manual approvals. Set daily limits and forget it.", 
      icon: CopyIcon, 
      color: "green",
      tech: "ERC-7715" 
    },
    { 
      title: "Non-Custodial", 
      description: "Your keys, your crypto. All trades execute through your smart account - we never touch your funds.", 
      icon: ShieldIcon, 
      color: "yellow",
      tech: "ERC-4337" 
    },
    { 
      title: "Liquidity Pools", 
      description: "Provide liquidity, earn 0.3% fees, and watch your position grow with real-time analytics.", 
      icon: LiquidityIcon, 
      color: "indigo",
      tech: "MetaCow DEX" 
    },
  ];

  const stats = [
    { label: "Copy Trade Latency", value: "<5s", icon: "⚡" },
    { label: "Success Rate", value: "95%+", icon: "✅" },
    { label: "Daily Active Users", value: "1,000+", icon: "👥" },
    { label: "Total Volume", value: "$2M+", icon: "💰" },
  ];

  const techStack = [
    {
      name: "MetaMask Flask",
      logo: "https://docs.metamask.io/img/metamask-logo-dark.svg",
      description: "ERC-7715 Delegated Permissions",
      features: ["One-time approvals", "Daily spending limits", "Revocable permissions"]
    },
    {
      name: "Envio",
      logo: "https://docs.envio.dev/img/envio-logo.png",
      description: "Real-time blockchain indexing",
      features: ["Sub-second indexing", "GraphQL API", "WebSocket support"]
    },
  ];

  const getColorClasses = (color: string) => {
    const map: any = {
      blue: { bg: 'bg-blue-50', border: 'border-blue-200', iconBg: 'bg-blue-100', iconText: 'text-blue-600', gradient: 'from-blue-500 to-cyan-500' },
      purple: { bg: 'bg-purple-50', border: 'border-purple-200', iconBg: 'bg-purple-100', iconText: 'text-purple-600', gradient: 'from-purple-500 to-pink-500' },
      pink: { bg: 'bg-pink-50', border: 'border-pink-200', iconBg: 'bg-pink-100', iconText: 'text-pink-600', gradient: 'from-pink-500 to-rose-500' },
      green: { bg: 'bg-green-50', border: 'border-green-200', iconBg: 'bg-green-100', iconText: 'text-green-600', gradient: 'from-green-500 to-emerald-500' },
      yellow: { bg: 'bg-yellow-50', border: 'border-yellow-200', iconBg: 'bg-yellow-100', iconText: 'text-yellow-600', gradient: 'from-yellow-500 to-orange-500' },
      indigo: { bg: 'bg-indigo-50', border: 'border-indigo-200', iconBg: 'bg-indigo-100', iconText: 'text-indigo-600', gradient: 'from-indigo-500 to-purple-500' },
    };
    return map[color] || map.blue;
  };

  return (
    <div className="bg-slate-50 text-gray-800 font-sans overflow-hidden">
      {/* Hero Section */}
      <section
        onMouseMove={setMouseCoordsFromSection}
        className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 text-center p-6"
      >
        {/* Animated Background Blobs */}
        <motion.div 
          style={{ y: y1, opacity: heroOpacity }} 
          className="absolute top-20 left-10 w-96 h-96 bg-gradient-to-br from-purple-400/30 to-pink-400/30 rounded-full blur-3xl pointer-events-none" 
        />
        <motion.div 
          style={{ y: y2, opacity: heroOpacity }} 
          className="absolute bottom-20 right-10 w-[500px] h-[500px] bg-gradient-to-br from-blue-400/30 to-cyan-400/30 rounded-full blur-3xl pointer-events-none" 
        />
        
        <div className="relative z-10 max-w-6xl mx-auto">
          {/* 3D Model */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="flex justify-center items-center mb-8 h-64"
          >
            <MetaCowModel mouse={mouse} />
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="text-6xl md:text-8xl font-black mb-4"
          >
            <span className="bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 bg-clip-text text-transparent">
              MetaCow
            </span>
            <span className="text-slate-800"> DEX</span>
          </motion.h1>

          {/* Subtitle with badges */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="flex flex-wrap items-center justify-center gap-3 mb-6"
          >
            <span className="px-4 py-2 bg-purple-100 text-purple-700 rounded-full text-sm font-bold border border-purple-200">
              🔥 MetaMask Advanced Permissions
            </span>
            <span className="px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-bold border border-blue-200">
              ⚡ Powered by Envio
            </span>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="text-xl md:text-2xl text-slate-600 max-w-3xl mx-auto leading-relaxed mb-8 font-medium"
          >
            The first <span className="text-purple-600 font-bold">Social DEX</span> with{" "}
            <span className="text-blue-600 font-bold">automated copy trading</span>.{" "}
            Trade smarter, not harder.
          </motion.p>

          {/* Stats Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto mb-10"
          >
            {stats.map((stat, idx) => (
              <div 
                key={idx}
                className="bg-white/80 backdrop-blur-sm border border-slate-200 rounded-2xl p-4 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1"
              >
                <div className="text-3xl mb-2">{stat.icon}</div>
                <div className="text-2xl md:text-3xl font-black text-slate-800 mb-1">
                  {stat.value}
                </div>
                <div className="text-sm text-slate-600 font-medium">{stat.label}</div>
              </div>
            ))}
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link
              href="/swap"
              className="group bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 text-white px-10 py-5 rounded-2xl font-bold text-lg shadow-2xl hover:shadow-purple-500/50 transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2"
            >
              <RocketIcon className="w-6 h-6" />
              Launch App
            </Link>
            <Link
              href="/social"
              className="group bg-white/90 backdrop-blur-sm border-2 border-slate-200 text-slate-700 px-10 py-5 rounded-2xl font-bold text-lg hover:bg-white hover:border-purple-300 hover:text-purple-600 transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2"
            >
              <SocialIcon className="w-6 h-6" />
              View Live Trades
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Tech Stack Section */}
      <section className="py-24 bg-white relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-50/50 to-transparent pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-5xl md:text-6xl font-black text-slate-800 mb-4">
              Powered by{" "}
              <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Best-in-Class
              </span>{" "}
              Tech
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              MetaCow combines cutting-edge blockchain infrastructure to deliver unmatched performance
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {techStack.map((tech, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.2, duration: 0.8 }}
                viewport={{ once: true }}
                className="group bg-gradient-to-br from-white to-slate-50 border-2 border-slate-200 rounded-3xl p-8 shadow-xl hover:shadow-2xl hover:border-purple-300 transition-all duration-300 hover:-translate-y-2"
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-white rounded-2xl shadow-lg flex items-center justify-center p-3 group-hover:scale-110 transition-transform">
                    <img 
                      src={tech.logo} 
                      alt={tech.name}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-800">{tech.name}</h3>
                    <p className="text-sm text-slate-600 font-medium">{tech.description}</p>
                  </div>
                </div>

                <ul className="space-y-3">
                  {tech.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-3 text-slate-700">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span className="font-medium">{feature}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works - Copy Trading */}
      <section className="py-24 bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="px-4 py-2 bg-purple-100 text-purple-700 rounded-full text-sm font-bold border border-purple-200 inline-block mb-4">
              ⚡ Flagship Feature
            </span>
            <h2 className="text-5xl md:text-6xl font-black text-slate-800 mb-4">
              Automated{" "}
              <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Copy Trading
              </span>
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Follow top traders and copy their moves in <span className="font-bold text-purple-600">&lt;5 seconds</span> - no manual approvals needed
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {[
              {
                step: "01",
                title: "Grant Permission Once",
                description: "Use MetaMask Flask to approve copy trading with daily spending limits",
                icon: ShieldIcon,
                color: "purple"
              },
              {
                step: "02",
                title: "Envio Detects Trade",
                description: "Real-time indexing catches every swap the moment it happens on-chain",
                icon: LightningIcon,
                color: "blue"
              },
              {
                step: "03",
                title: "Auto-Execute Copy",
                description: "Your trade executes automatically using ERC-7715 delegated permissions",
                icon: CopyIcon,
                color: "pink"
              }
            ].map((step, idx) => {
              const colors = getColorClasses(step.color);
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.15, duration: 0.6 }}
                  viewport={{ once: true }}
                  className="relative"
                >
                  {/* Connector Line */}
                  {idx < 2 && (
                    <div className="hidden md:block absolute top-1/4 left-full w-full h-0.5 bg-gradient-to-r from-purple-300 to-blue-300 -z-10" />
                  )}
                  
                  <div className={`bg-white rounded-3xl p-8 shadow-xl border-2 ${colors.border} hover:shadow-2xl transition-all hover:-translate-y-2 h-full`}>
                    <div className="flex items-center gap-4 mb-6">
                      <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${colors.gradient} flex items-center justify-center text-white text-2xl font-black shadow-lg`}>
                        {step.step}
                      </div>
                      <div className={`w-12 h-12 rounded-xl ${colors.iconBg} flex items-center justify-center`}>
                        <step.icon className={`w-7 h-7 ${colors.iconText}`} />
                      </div>
                    </div>
                    <h3 className="text-2xl font-bold text-slate-800 mb-3">{step.title}</h3>
                    <p className="text-slate-600 leading-relaxed">{step.description}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Comparison */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto"
          >
            {/* Traditional */}
            <div className="bg-white/80 backdrop-blur-sm border-2 border-red-200 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
                  <span className="text-2xl">😫</span>
                </div>
                <h4 className="text-xl font-bold text-slate-800">Traditional Copy Trading</h4>
              </div>
              <ul className="space-y-2 text-slate-600">
                <li className="flex items-start gap-2">
                  <span className="text-red-500 mt-1">❌</span>
                  <span>30-60 second delay</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 mt-1">❌</span>
                  <span>Manual approval every time</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 mt-1">❌</span>
                  <span>Miss price movements</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 mt-1">❌</span>
                  <span>Approval fatigue</span>
                </li>
              </ul>
            </div>

            {/* MetaCow */}
            <div className="bg-gradient-to-br from-purple-50 to-blue-50 border-2 border-purple-300 rounded-2xl p-6 shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                  <span className="text-2xl">⚡</span>
                </div>
                <h4 className="text-xl font-bold text-slate-800">MetaCow DEX</h4>
              </div>
              <ul className="space-y-2 text-slate-700 font-medium">
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">✅</span>
                  <span>&lt;5 second execution</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">✅</span>
                  <span>One-time approval</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">✅</span>
                  <span>Catch the same price</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">✅</span>
                  <span>Set it and forget it</span>
                </li>
              </ul>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Social Alpha Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <span className="px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-bold border border-blue-200 inline-block mb-4">
                📊 Live Trading Feed
              </span>
              <h2 className="text-5xl md:text-6xl font-black text-slate-800 leading-tight mb-6">
                Learn from the{" "}
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Best Traders
                </span>
              </h2>
              <p className="text-xl text-slate-600 mb-6 leading-relaxed">
                Every trade indexed in real-time by Envio. See what top wallets are buying, 
                analyze their strategies, and copy their moves with one click.
              </p>
              <ul className="space-y-4 mb-8">
                {[
                  "Real-time swap feed powered by Envio",
                  "Follow successful traders",
                  "One-click copy to swap interface",
                  "Track performance and P&L"
                ].map((item, idx) => (
                  <li key={idx} className="flex items-center gap-3 text-slate-700">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="font-medium text-lg">{item}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/social"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                <ChartIcon className="w-6 h-6" />
                Explore Live Feed
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-3xl blur-3xl" />
              <div className="relative bg-white rounded-3xl shadow-2xl border border-slate-200 p-6">
                <SearchFollow />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-5xl md:text-6xl font-black text-slate-800 mb-4">
              Everything You Need for{" "}
              <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                DeFi Success
              </span>
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Built with the latest Web3 technology stack
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, idx) => {
              const colors = getColorClasses(feature.color);
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1, duration: 0.5 }}
                  viewport={{ once: true }}
                  className={`group relative bg-white rounded-3xl p-8 shadow-lg border-2 ${colors.border} hover:shadow-2xl hover:border-transparent transition-all duration-300 hover:-translate-y-2 overflow-hidden`}
                >
                  {/* Gradient overlay on hover */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${colors.gradient} opacity-0 group-hover:opacity-5 transition-opacity`} />
                  
                  <div className="relative z-10">
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 bg-gradient-to-br ${colors.gradient} group-hover:scale-110 transition-transform shadow-lg`}>
                      <feature.icon className="w-9 h-9 text-white" />
                    </div>
                    
                    <div className="mb-3">
                      <h3 className="text-2xl font-bold text-slate-800 mb-2">{feature.title}</h3>
                      <span className={`text-xs font-bold ${colors.iconText} px-3 py-1 rounded-full ${colors.bg} border ${colors.border}`}>
                        {feature.tech}
                      </span>
                    </div>
                    
                    <p className="text-slate-600 leading-relaxed">{feature.description}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        </div>

        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-5xl md:text-7xl font-black text-white mb-6">
              Ready to Trade Smarter?
            </h2>
            <p className="text-xl md:text-2xl text-white/90 mb-10 max-w-2xl mx-auto leading-relaxed">
              {isConnected 
                ? "You're connected! Start trading with advanced permissions now." 
                : "Join thousands of traders using MetaCow's automated copy trading."}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {isConnected ? (
                <>
                  <Link
                    href="/swap"
                    className="inline-flex items-center justify-center gap-2 bg-white text-purple-600 px-10 py-5 rounded-2xl font-bold text-lg shadow-2xl hover:shadow-white/30 transition-all duration-300 transform hover:scale-105"
                  >
                    <SwapIcon className="w-6 h-6" />
                    Start Trading
                  </Link>
                  <Link
                    href="/social"
                    className="inline-flex items-center justify-center gap-2 bg-white/10 backdrop-blur-sm border-2 border-white/30 text-white px-10 py-5 rounded-2xl font-bold text-lg hover:bg-white/20 transition-all duration-300 transform hover:scale-105"
                  >
                    <SocialIcon className="w-6 h-6" />
                    View Live Feed
                  </Link>
                </>
              ) : (
                <button
                  onClick={connectWallet}
                  className="inline-flex items-center justify-center gap-2 bg-white text-purple-600 px-10 py-5 rounded-2xl font-bold text-lg shadow-2xl hover:shadow-white/30 transition-all duration-300 transform hover:scale-105"
                >
                  <WalletIcon className="w-6 h-6" />
                  Connect Wallet to Start
                </button>
              )}
            </div>

            {/* Trust badges */}
            <div className="mt-12 flex flex-wrap items-center justify-center gap-8">
              <div className="text-white/80 text-sm">
                <div className="font-bold text-white text-lg mb-1">95%+</div>
                Success Rate
              </div>
              <div className="text-white/80 text-sm">
                <div className="font-bold text-white text-lg mb-1">&lt;5s</div>
                Execution Time
              </div>
              <div className="text-white/80 text-sm">
                <div className="font-bold text-white text-lg mb-1">24/7</div>
                Auto Trading
              </div>
              <div className="text-white/80 text-sm">
                <div className="font-bold text-white text-lg mb-1">$0</div>
                Hidden Fees
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <img src="/assets/metacow-logo.png" alt="MetaCow" className="w-10 h-10" />
                <span className="text-2xl font-black">MetaCow DEX</span>
              </div>
              <p className="text-slate-400 mb-6 max-w-md">
                The first social DEX with automated copy trading. Powered by MetaMask Flask 
                and Envio real-time indexing.
              </p>
              <div className="flex items-center gap-4">
                <img src="https://docs.metamask.io/img/metamask-logo-dark.svg" alt="MetaMask" className="h-8 opacity-70 hover:opacity-100 transition" />
                <img src="https://docs.envio.dev/img/envio-logo.png" alt="Envio" className="h-8 opacity-70 hover:opacity-100 transition" />
              </div>
            </div>

            <div>
              <h4 className="font-bold text-lg mb-4">Product</h4>
              <ul className="space-y-2 text-slate-400">
                <li><Link href="/swap" className="hover:text-white transition">Swap</Link></li>
                <li><Link href="/liquidity" className="hover:text-white transition">Liquidity</Link></li>
                <li><Link href="/social" className="hover:text-white transition">Social Feed</Link></li>
                <li><Link href="/faucet" className="hover:text-white transition">Faucet</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-lg mb-4">Resources</h4>
              <ul className="space-y-2 text-slate-400">
                <li><a href="https://docs.metamask.io" target="_blank" className="hover:text-white transition">MetaMask Docs</a></li>
                <li><a href="https://docs.envio.dev" target="_blank" className="hover:text-white transition">Envio Docs</a></li>
                <li><a href="https://testnet.bscscan.com" target="_blank" className="hover:text-white transition">BscScan</a></li>
                <li><Link href="/profile" className="hover:text-white transition">My Profile</Link></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-sm text-slate-500">
              &copy; 2025 MetaCow DEX. Built for MetaMask Advanced Permissions Hackathon.
            </div>
            <div className="flex items-center gap-6 text-sm text-slate-400">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                BNB Testnet
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Add WalletIcon
const WalletIcon = (props: any) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>;
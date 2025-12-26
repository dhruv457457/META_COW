import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { useWallet } from "../contexts/WalletContext";
import metaCowLogo from "../assets/MetaCowLogo.png";
import { motion, useScroll, useTransform } from "framer-motion";
import MetaCowModel from "../components/MetaCowModel";

// --- SVG Icons (for a professional look) ---
const SwapIcon = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>;
const LiquidityIcon = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M7 16V4m0 12L4 13m3 3l3-3m-3 3h12a2 2 0 002-2V8a2 2 0 00-2-2H7" /></svg>;
const TrophyIcon = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 11l3-3m0 0l3 3m-3-3v8m0-13a9 9 0 110 18 9 9 0 010-18z" /></svg>;
const SocialIcon = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>;
const CopyIcon = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2v-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>;
const StarIcon = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.196-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.783-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>;
const ConnectIcon = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>;
const TradeIcon = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 13v-1m4 1v-3m4 3V8M8 21l4-4 4 4M3 4h18M4 4l4 4m0 0l4-4m-4 4v12" /></svg>;
const EarnIcon = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v.01" /></svg>;

// --- Self-Contained SearchFollow Component ---
const SearchFollow = ({ currentUserId }) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [following, setFollowing] = useState([]);

  useEffect(() => {
    if (!currentUserId) return;
    axios
      .get(`https://meta-cow.onrender.com/api/follow/following/${currentUserId}`)
      .then((res) => setFollowing(res.data.map((u) => u._id)))
      .catch((err) => console.error("Failed to fetch following list", err));
  }, [currentUserId]);

  const search = async () => {
    if (!query.trim()) return;
    const res = await axios.get(`https://meta-cow.onrender.com/api/users/search?query=${query}`);
    setResults(res.data || []);
  };

  const followUser = async (targetUserId) => {
    try {
      await axios.post(`https://meta-cow.onrender.com/api/follow/follow/${targetUserId}`, {
        followerId: currentUserId,
      });
      setFollowing((prev) => [...prev, targetUserId]);
    } catch (err) {
      console.error("Follow failed", err?.response?.data || err);
    }
  };

  const unfollowUser = async (targetUserId) => {
    try {
      await axios.delete(`https://meta-cow.onrender.com/api/follow/unfollow/${targetUserId}`, {
        data: { followerId: currentUserId },
      });
      setFollowing((prev) => prev.filter((id) => id !== targetUserId));
    } catch (err) {
      console.error("Unfollow failed", err?.response?.data || err);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-white/80 border border-purple-100 rounded-2xl shadow-lg backdrop-blur-sm">
      <h3 className="text-xl font-bold text-purple-800 mb-4 text-left">Discover & Follow Traders</h3>
      <div className="flex items-center gap-2 mb-4">
        <div className="relative w-full">
          <input
            type="text"
            className="w-full pl-4 pr-4 py-3 text-base border-2 border-purple-200 rounded-xl focus:ring-2 focus:ring-purple-400 outline-none bg-white shadow-inner"
            placeholder="Search by username..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <button
          onClick={search}
          className="px-5 py-3 font-semibold bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl hover:from-purple-600 hover:to-blue-600 transition-all duration-300 transform hover:scale-105"
        >
          Search
        </button>
      </div>
      {results.length > 0 ? (
        <ul className="mt-4 space-y-3 max-h-60 overflow-y-auto pr-2">
          {results.map((user) => (
            <li
              key={user._id}
              className="flex items-center justify-between bg-white border border-purple-100 px-4 py-3 rounded-xl shadow-sm"
            >
              <div className="flex items-center gap-3">
                <img
                  src={user.profileImage || `https://api.dicebear.com/7.x/identicon/svg?seed=${user.walletAddress}`}
                  alt="pfp"
                  className="w-10 h-10 rounded-full border-2 border-purple-200"
                />
                <span className="font-semibold text-gray-800">{user.username}</span>
              </div>
              {following.includes(user._id) ? (
                <button
                  onClick={() => unfollowUser(user._id)}
                  className="text-sm font-bold bg-slate-200 text-slate-600 px-4 py-2 rounded-lg hover:bg-slate-300 transition"
                >
                  Unfollow
                </button>
              ) : (
                <button
                  onClick={() => followUser(user._id)}
                  className="text-sm font-bold bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition"
                >
                  Follow
                </button>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-center text-sm text-gray-500 mt-4">Search for a user to see results.</p>
      )}
    </div>
  );
};


export default function Home() {
  const { walletData } = useWallet();
  const address = walletData?.address;
  const isConnected = !!address;
  const [userId, setUserId] = useState(null);
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 500], [0, -100]);
  const y2 = useTransform(scrollY, [0, 500], [0, 150]);
  const heroOpacity = useTransform(scrollY, [0, 400], [1, 0]);

  const setMouseCoordsFromSection = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    setMouse({ x, y });
  };

  const features = [
    { title: "On-Chain Swaps", description: "Instantly trade tokens on BNB Chain with our secure, upgradeable smart contracts.", icon: SwapIcon, color: "blue" },
    { title: "Liquidity Pools", description: "Provide liquidity to any pair, earn fees from trades, and track your performance.", icon: LiquidityIcon, color: "purple" },
    { title: "Social Feed", description: "Share your trades, discover insights from others, and engage with the community.", icon: SocialIcon, color: "pink" },
    { title: "Copy Trading", description: "See a trade you like? Copy it directly from the feed into the swap interface with one click.", icon: CopyIcon, color: "green" },
    { title: "Reputation Score", description: "Build your on-chain credibility based on trade volume, P&L, and social engagement.", icon: StarIcon, color: "yellow" },
    { title: "Seamless Earning", description: "Automatically earn real-time rewards for providing liquidity and enabling trades.", icon: TrophyIcon, color: "indigo" },
  ];

  const howItWorksSteps = [
    { num: '01', title: "Connect Your Wallet", description: "Securely connect your MetaMask or any Web3 wallet in seconds.", icon: ConnectIcon },
    { num: '02', title: "Explore & Trade", description: "Swap tokens, provide liquidity, or browse the social feed for alpha.", icon: TradeIcon },
    { num: '03', title: "Earn & Grow", description: "Collect rewards from your LP positions and build your on-chain reputation.", icon: EarnIcon },
  ];

  useEffect(() => {
    const fetchUser = async () => {
      if (!address) return;
      try {
        const res = await axios.get(`https://meta-cow.onrender.com/api/users/wallet/${address}`);
        setUserId(res.data._id);
      } catch (err) {
        console.error("Failed to fetch user ID", err);
      }
    };
    fetchUser();
  }, [address]);

  return (
    <div className="bg-slate-50 text-gray-800 font-sans">
      {/* Hero Section */}
      <section
        onMouseMove={setMouseCoordsFromSection}
        className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-b from-slate-50 to-blue-100/50 text-center p-6"
      >
        <motion.div
          style={{ y: y1, opacity: heroOpacity }}
          className="absolute top-10 left-10 w-72 h-72 bg-purple-300/30 rounded-full blur-3xl pointer-events-none"
        />
        <motion.div
          style={{ y: y2, opacity: heroOpacity }}
          className="absolute bottom-10 right-10 w-96 h-96 bg-blue-300/30 rounded-full blur-3xl pointer-events-none"
        />
        <div className="relative z-10 max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className="flex justify-center items-center mb-6 h-40"
          >
            <MetaCowModel mouse={mouse} />
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.8, ease: "easeInOut" }}
            className="text-6xl md:text-8xl font-black mb-6"
          >
            <span className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">
              MetaCow
            </span>
            <span className="text-slate-800"> DEX</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8, ease: "easeInOut" }}
            className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed mb-10"
          >
            Swap tokens, earn rewards, copy top wallets, and grow your DeFi reputation—all in one on-chain social DEX.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8, ease: "easeInOut" }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link
              to="/swap"
              className="group bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-purple-500/30 transition-all duration-300 transform hover:scale-105"
            >
              Start Trading
            </Link>
            <Link
              to="/social"
              className="group bg-white/70 backdrop-blur-sm border border-slate-200 text-slate-700 px-8 py-4 rounded-xl font-bold text-lg hover:bg-white hover:border-slate-300 transition-all duration-300 transform hover:scale-105"
            >
              Explore Alpha Feed
            </Link>
          </motion.div>
        </div>
      </section>

      {/* NEW Social Alpha Section */}
      <section className="py-24 bg-white/70 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                <motion.div
                    initial={{ opacity: 0, x: -50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    viewport={{ once: true }}
                >
                    <h2 className="text-4xl md:text-5xl font-bold text-slate-800 leading-tight">Learn from the Best, Trade with an <span className="text-purple-600">Edge.</span></h2>
                    <p className="mt-6 text-lg text-slate-600">
                        Don't just trade, trade smarter. Our Alpha Feed is a live stream of real trades from top wallets. Follow successful traders, discover new strategies, and get the insights you need to stay ahead of the market.
                    </p>
                    <Link
                        to="/social"
                        className="mt-8 inline-block bg-purple-100 text-purple-700 px-8 py-4 rounded-xl font-bold text-lg hover:bg-purple-200 transition-all duration-300"
                    >
                        See the Alpha
                    </Link>
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, x: 50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    viewport={{ once: true }}
                >
                    <SearchFollow currentUserId={userId} />
                </motion.div>
            </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-800">The All-in-One DeFi Hub</h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto mt-4">
              MetaCow combines the best of decentralized finance with the power of social networking.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, idx) => {
              const colorClasses = {
                blue: { bg: 'bg-blue-50', border: 'border-blue-200', iconBg: 'bg-blue-100', iconText: 'text-blue-600' },
                purple: { bg: 'bg-purple-50', border: 'border-purple-200', iconBg: 'bg-purple-100', iconText: 'text-purple-600' },
                pink: { bg: 'bg-pink-50', border: 'border-pink-200', iconBg: 'bg-pink-100', iconText: 'text-pink-600' },
                green: { bg: 'bg-green-50', border: 'border-green-200', iconBg: 'bg-green-100', iconText: 'text-green-600' },
                yellow: { bg: 'bg-yellow-50', border: 'border-yellow-200', iconBg: 'bg-yellow-100', iconText: 'text-yellow-600' },
                indigo: { bg: 'bg-indigo-50', border: 'border-indigo-200', iconBg: 'bg-indigo-100', iconText: 'text-indigo-600' },
              };
              const colors = colorClasses[feature.color] || colorClasses.blue;
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1, duration: 0.5 }}
                  viewport={{ once: true }}
                  className={`group p-8 rounded-2xl border ${colors.border} ${colors.bg} transition-all duration-300 hover:shadow-xl hover:border-transparent hover:-translate-y-2`}
                >
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-6 ${colors.iconBg} group-hover:scale-110 transition-transform`}>
                    <feature.icon className={`w-8 h-8 ${colors.iconText}`} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-3">{feature.title}</h3>
                  <p className="text-slate-600 leading-relaxed">{feature.description}</p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-800">Get Started in 3 Simple Steps</h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto mt-4">
              Joining the MetaCow ecosystem is fast, easy, and secure.
            </p>
          </div>
          <div className="relative">
            <div className="hidden lg:block absolute top-12 left-0 w-full h-px">
              <svg width="100%" height="2"><line x1="0" y1="1" x2="100%" y2="1" strokeWidth="2" strokeDasharray="8 8" className="stroke-slate-300" /></svg>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
              {howItWorksSteps.map((step, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.2, duration: 0.6 }}
                  viewport={{ once: true }}
                  className="text-center bg-white px-4"
                >
                  <div className="w-24 h-24 bg-slate-100 border-4 border-slate-200 rounded-full flex items-center justify-center mx-auto mb-6 shadow-md">
                    <step.icon className="w-12 h-12 text-purple-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-800 mb-3">{step.title}</h3>
                  <p className="text-slate-600">{step.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-slate-800">Ready to Join the Herd?</h2>
            <p className="text-lg text-slate-600 mt-4 mb-8 max-w-2xl mx-auto">
              {isConnected ? "You're connected and ready to go. Dive into the action now!" : "Connect your wallet to unlock the full power of social DeFi."}
            </p>
            <Link
              to="/swap"
              className="inline-block bg-gradient-to-r from-purple-600 to-blue-500 text-white px-10 py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-purple-500/30 transition-all duration-300 transform hover:scale-105"
            >
              {isConnected ? 'Go to App' : 'Connect Wallet'}
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="col-span-2 md:col-span-1 mb-8 md:mb-0">
              <Link to="/" className="flex items-center gap-2 mb-4">
                <img src={metaCowLogo} alt="MetaCow" className="w-10 h-10" />
                <span className="text-xl font-bold text-slate-800">MetaCow DEX</span>
              </Link>
              <p className="text-slate-600 text-sm">The Social DeFi Hub on BNB Chain.</p>
            </div>
            <div>
              <h3 className="font-bold text-slate-800 mb-4">Products</h3>
              <ul className="space-y-3">
                <li><Link to="/swap" className="text-slate-600 hover:text-purple-600 transition-colors">Swap</Link></li>
                <li><Link to="/liquidity" className="text-slate-600 hover:text-purple-600 transition-colors">Liquidity</Link></li>
                <li><Link to="/faucet" className="text-slate-600 hover:text-purple-600 transition-colors">Faucet</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-slate-800 mb-4">Community</h3>
              <ul className="space-y-3">
                <li><Link to="/social" className="text-slate-600 hover:text-purple-600 transition-colors">Alpha Feed</Link></li>
                <li><a href="#" className="text-slate-600 hover:text-purple-600 transition-colors">Discord</a></li>
                <li><a href="#" className="text-slate-600 hover:text-purple-600 transition-colors">Twitter</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-slate-800 mb-4">Legal</h3>
              <ul className="space-y-3">
                <li><a href="#" className="text-slate-600 hover:text-purple-600 transition-colors">Terms of Service</a></li>
                <li><a href="#" className="text-slate-600 hover:text-purple-600 transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="text-slate-600 hover:text-purple-600 transition-colors">Audits</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-16 pt-8 border-t border-slate-200 text-center text-sm text-slate-500">
            <p>&copy; 2025 MetaCow. All rights reserved. Not financial advice.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

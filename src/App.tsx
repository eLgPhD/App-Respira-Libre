/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, Suspense, lazy } from 'react';
import Form, { UserData } from './components/Form';
import { generateQuitPlan, PlanData } from './services/geminiService';
import { CloudOff, ShieldCheck, Sparkles, HeartPulse, LogIn, User as UserIcon, Globe, ChevronRight, Loader2, Coins } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { t } from './i18n';

const Dashboard = lazy(() => import('./components/Dashboard'));
const Auth = lazy(() => import('./components/Auth'));

export default function App() {
  const [plan, setPlan] = useState<PlanData | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quitDate, setQuitDate] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [activeModal, setActiveModal] = useState<'privacy' | 'terms' | 'contact' | 'avatar' | 'relapse' | null>(null);
  const [relapseReason, setRelapseReason] = useState('');
  const [relapseAction, setRelapseAction] = useState('');

  const avatars = React.useMemo(() => ['👤', '🧑‍🚀', '🦸‍♂️', '🥷', '🧙‍♂️', '🧛', '🧟', '🧞', '🦁', '🦊', '🐼', '🦄'], []);

  useEffect(() => {
    // Load saved user from local storage for session persistence
    const savedUser = localStorage.getItem('vape_quit_user');
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
      setPlan(parsedUser.planData);
      setQuitDate(parsedUser.quitDate);
      setUserData(parsedUser.userData);
    }
  }, []);

  const handleAuthSuccess = React.useCallback(async (userDataFromAuth: any) => {
    let finalUser = userDataFromAuth;
    
    // If we have a local plan but the server doesn't, save it to the server
    if (!userDataFromAuth.planData && plan && userData) {
      try {
        await fetch('/api/save-plan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: userDataFromAuth.id,
            userData: userData,
            planData: plan,
            quitDate: quitDate || new Date().toISOString()
          }),
        });
        finalUser = { 
          ...userDataFromAuth, 
          planData: plan, 
          userData: userData, 
          quitDate: quitDate || new Date().toISOString() 
        };
      } catch (err) {
        console.error("Error saving local plan to new account:", err);
      }
    }

    setUser(finalUser);
    setPlan(finalUser.planData);
    setQuitDate(finalUser.quitDate);
    setUserData(finalUser.userData);
    localStorage.setItem('vape_quit_user', JSON.stringify(finalUser));
    setShowAuth(false);
  }, [plan, userData, quitDate]);

  const handleGeneratePlan = React.useCallback(async (data: UserData) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await generateQuitPlan(
        data.age,
        data.weight,
        data.height,
        data.vapeFrequency,
        data.vapeDurationMonths,
        data.smokesCigarettes,
        data.hobbies,
        data.motivation,
        {
          vapeTriggers: data.vapeTriggers,
          previousAttempts: data.previousAttempts,
          commitmentLevel: data.commitmentLevel,
          dailyRoutine: data.dailyRoutine,
          biggestFear: data.biggestFear,
          socialVaping: data.socialVaping
        }
      );
      
      const now = new Date().toISOString();
      setPlan(result);
      setUserData(data);
      setQuitDate(now);

      // If logged in, save to backend
      if (user) {
        await fetch('/api/save-plan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.id,
            userData: data,
            planData: result,
            quitDate: now
          }),
        });
        // Update local state user object
        const updatedUser = { ...user, userData: data, planData: result, quitDate: now };
        setUser(updatedUser);
        localStorage.setItem('vape_quit_user', JSON.stringify(updatedUser));
      } else {
        // If not logged in, prompt to login/register to save
        setShowAuth(true);
      }
      
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error(err);
      setError('Hubo un error al generar tu plan. Por favor, inténtalo de nuevo.');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const handleReset = React.useCallback(async () => {
    if (window.confirm('¿Estás seguro de que quieres reiniciar? Tus puntos volverán a 0.')) {
      const now = new Date().toISOString();
      setQuitDate(now);
      
      if (user) {
        const updatedUser = { ...user, quitDate: now, points: 0, completedTasks: [] };
        setUser(updatedUser);
        localStorage.setItem('vape_quit_user', JSON.stringify(updatedUser));
        
        await fetch('/api/update-progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id, points: 0, maxPoints: user.maxPoints, completedTasks: [] }),
        });
      }
    }
  }, [user]);

  const handleLogout = React.useCallback(() => {
    setUser(null);
    setPlan(null);
    setQuitDate(null);
    setUserData(null);
    localStorage.removeItem('vape_quit_user');
  }, []);

  const handleRelapseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userData) return;
    
    setIsLoading(true);
    setActiveModal(null);
    setError(null);
    
    try {
      const result = await generateQuitPlan(
        userData.age,
        userData.weight,
        userData.height,
        userData.vapeFrequency,
        userData.vapeDurationMonths,
        userData.smokesCigarettes,
        userData.hobbies,
        userData.motivation,
        {
          vapeTriggers: userData.vapeTriggers,
          previousAttempts: userData.previousAttempts,
          commitmentLevel: userData.commitmentLevel,
          dailyRoutine: userData.dailyRoutine,
          biggestFear: userData.biggestFear,
          socialVaping: userData.socialVaping
        },
        { reason: relapseReason, action: relapseAction }
      );
      
      const now = new Date().toISOString();
      setPlan(result);
      setQuitDate(now);
      setRelapseReason('');
      setRelapseAction('');

      if (user) {
        const updatedUser = { ...user, planData: result, quitDate: now, points: 0, completedTasks: [] };
        setUser(updatedUser);
        localStorage.setItem('vape_quit_user', JSON.stringify(updatedUser));
        
        await fetch('/api/save-plan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id, userData, planData: result, quitDate: now }),
        });
        
        await fetch('/api/update-progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id, points: 0, maxPoints: user.maxPoints, completedTasks: [] }),
        });
      }
      
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error(err);
      setError('Hubo un error al actualizar tu plan. Por favor, inténtalo de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAvatarChange = async (avatar: string) => {
    if (!user) return;
    try {
      const response = await fetch('/api/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, avatar }),
      });
      if (response.ok) {
        const updatedUser = { ...user, avatar };
        setUser(updatedUser);
        localStorage.setItem('vape_quit_user', JSON.stringify(updatedUser));
        setActiveModal(null);
      }
    } catch (err) {
      console.error('Error updating avatar:', err);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] font-sans text-slate-100 selection:bg-emerald-500/30 selection:text-emerald-200 flex flex-col relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Cyberpunk Perspective Grid */}
        <div className="absolute inset-x-0 bottom-0 h-[70vh] opacity-30" style={{
          backgroundImage: `
            linear-gradient(to right, rgba(16, 185, 129, 0.2) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(16, 185, 129, 0.2) 1px, transparent 1px)
          `,
          backgroundSize: '4rem 4rem',
          transform: 'perspective(1000px) rotateX(60deg) translateY(100px) scale(2.5)',
          transformOrigin: 'bottom center',
          maskImage: 'linear-gradient(to top, black 10%, transparent 80%)',
          WebkitMaskImage: 'linear-gradient(to top, black 10%, transparent 80%)'
        }} />
        
        {/* Subtle Grid Pattern */}
        <div className="absolute inset-0 opacity-[0.08] bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] bg-[size:60px_60px]" />
        <div className="absolute inset-0 opacity-[0.04] bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:20px_20px]" />
        
        {/* Noise Texture Overlay */}
        <div className="absolute inset-0 opacity-[0.04] bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />

        {/* Decorative SVG Lines (Reinforced) */}
        <svg className="absolute inset-0 w-full h-full opacity-40" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="grad1" x1="0%" y1="0%" x2="100% " y2="0%">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0" />
              <stop offset="50%" stopColor="#10b981" stopOpacity="1" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="grad2" x1="0%" y1="0%" x2="100% " y2="0%">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0" />
              <stop offset="50%" stopColor="#06b6d4" stopOpacity="1" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="grad3" x1="0%" y1="0%" x2="100% " y2="0%">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0" />
              <stop offset="50%" stopColor="#6366f1" stopOpacity="1" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
            </linearGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="8" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>
          <motion.path
            d="M-100 100 Q 150 300 500 100 T 1100 300"
            fill="none"
            stroke="url(#grad1)"
            strokeWidth="3"
            filter="url(#glow)"
            animate={{ 
              d: [
                "M-100 100 Q 150 300 500 100 T 1100 300",
                "M-100 150 Q 200 250 550 150 T 1100 250",
                "M-100 100 Q 150 300 500 100 T 1100 300"
              ]
            }}
            transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.path
            d="M-100 600 Q 300 400 700 600 T 1300 400"
            fill="none"
            stroke="url(#grad2)"
            strokeWidth="3"
            filter="url(#glow)"
            animate={{ 
              d: [
                "M-100 600 Q 300 400 700 600 T 1300 400",
                "M-100 550 Q 350 450 750 550 T 1300 450",
                "M-100 600 Q 300 400 700 600 T 1300 400"
              ]
            }}
            transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.path
            d="M1200 100 Q 900 400 500 200 T -100 500"
            fill="none"
            stroke="url(#grad3)"
            strokeWidth="3"
            filter="url(#glow)"
            animate={{ 
              d: [
                "M1200 100 Q 900 400 500 200 T -100 500",
                "M1200 150 Q 850 350 450 250 T -100 450",
                "M1200 100 Q 900 400 500 200 T -100 500"
              ]
            }}
            transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
          />
        </svg>

        {/* Floating Geometric Shapes & Particles (Doubled & Glowing) */}
        <div className="absolute inset-0">
          {[...Array(50)].map((_, i) => (
            <div
              key={`particle-${i}`}
              style={{
                left: Math.random() * 100 + '%',
                animation: `float-particle ${8 + Math.random() * 15}s linear infinite`,
                animationDelay: `${Math.random() * 10}s`
              }}
              className={`absolute w-1.5 h-1.5 rounded-full ${
                i % 3 === 0 ? 'bg-emerald-400 shadow-[0_0_10px_#34d399]' : i % 3 === 1 ? 'bg-cyan-400 shadow-[0_0_10px_#22d3ee]' : 'bg-indigo-400 shadow-[0_0_10px_#818cf8]'
              }`}
            />
          ))}
          {[...Array(24)].map((_, i) => (
            <div
              key={`shape-${i}`}
              style={{
                left: Math.random() * 100 + '%',
                animation: `float-shape ${15 + Math.random() * 20}s linear infinite`,
                animationDelay: `${Math.random() * 10}s`
              }}
              className={`absolute w-5 h-5 ${
                i % 3 === 0 ? 'text-emerald-400' : i % 3 === 1 ? 'text-cyan-400' : 'text-indigo-400'
              }`}
            >
              {i % 2 === 0 ? (
                <div className="w-full h-full border-2 border-current rounded-full shadow-[0_0_12px_currentColor]" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="w-full h-[2px] bg-current absolute shadow-[0_0_12px_currentColor]" />
                  <div className="h-full w-[2px] bg-current absolute shadow-[0_0_12px_currentColor]" />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Light Streaks (Enhanced: Longer, Thinner, Colored) */}
        <div className="absolute inset-0 overflow-hidden opacity-[0.15]">
          {[...Array(12)].map((_, i) => (
            <div
              key={`streak-${i}`}
              style={{
                top: Math.random() * 100 + '%',
                animation: `light-streak ${15 + Math.random() * 15}s linear infinite`,
                animationDelay: `${Math.random() * 15}s`
              }}
              className={`absolute w-[3000px] h-[0.5px] bg-gradient-to-r from-transparent ${
                i % 3 === 0 ? 'via-emerald-400' : i % 3 === 1 ? 'via-cyan-400' : 'via-indigo-400'
              } to-transparent blur-[1px]`}
            />
          ))}
        </div>

        {/* Animated Glowing Orbs (Intensified) */}
        <div
          style={{ animation: 'orb-1 20s ease-in-out infinite' }}
          className="absolute -top-[15%] -left-[10%] w-[60%] h-[60%] bg-emerald-500/20 rounded-full blur-[140px]"
        />
        
        <div
          style={{ animation: 'orb-2 25s ease-in-out infinite' }}
          className="absolute top-[15%] -right-[10%] w-[50%] h-[50%] bg-cyan-500/20 rounded-full blur-[120px]"
        />

        <div
          style={{ animation: 'orb-3 22s ease-in-out infinite' }}
          className="absolute -bottom-[20%] left-[20%] w-[55%] h-[55%] bg-indigo-500/20 rounded-full blur-[130px]"
        />

        {/* Vapor Clouds Background - Multi-layered */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <div
              key={`cloud-l1-${i}`}
              style={{
                top: 10 + (i * 15) + '%',
                animation: `${i % 2 === 0 ? 'cloud-l1-even' : 'cloud-l1-odd'} ${50 + (i * 15)}s linear infinite`,
                animationDelay: `${i * 8}s`
              }}
              className="absolute w-[800px] h-[600px] bg-white/5 rounded-full blur-[140px]"
            />
          ))}
          {[...Array(4)].map((_, i) => (
            <div
              key={`cloud-l2-${i}`}
              style={{
                top: 5 + (i * 25) + '%',
                animation: `${i % 2 === 0 ? 'cloud-l2-even' : 'cloud-l2-odd'} ${35 + (i * 10)}s linear infinite`,
                animationDelay: `${i * 12}s`
              }}
              className="absolute w-[500px] h-[350px] bg-cyan-500/5 rounded-full blur-[100px]"
            />
          ))}
        </div>



        {/* Glow Points (Small points of light) */}
        <div className="absolute inset-0">
          {[...Array(40)].map((_, i) => (
            <div
              key={`glow-point-${i}`}
              style={{
                left: Math.random() * 100 + '%',
                top: Math.random() * 100 + '%',
                animation: `glow-point ${5 + Math.random() * 10}s ease-in-out infinite`,
                animationDelay: `${Math.random() * 5}s`
              }}
              className={`absolute w-1 h-1 rounded-full blur-[1px] ${
                i % 3 === 0 ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' : i % 3 === 1 ? 'bg-cyan-400 shadow-[0_0_8px_#22d3ee]' : 'bg-indigo-400 shadow-[0_0_8px_#818cf8]'
              }`}
            />
          ))}
        </div>

        {/* Radial Vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,transparent_0%,rgba(15,23,42,0.6)_100%)]" />
      </div>

      {/* Header */}
      <header className="bg-slate-900/50 backdrop-blur-xl border-b border-white/10 py-4 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-white font-black text-2xl tracking-tighter cursor-pointer" onClick={() => window.location.reload()}>
            <div className="bg-gradient-to-br from-emerald-500 to-cyan-500 p-1.5 rounded-lg">
              <CloudOff className="w-6 h-6 text-white" />
            </div>
            Respira<span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">Libre</span>
          </div>
          
          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-4">
                <div className="hidden md:flex flex-col items-end">
                  <span className="text-xs font-black text-slate-500 uppercase tracking-widest">{t('auth.username')}</span>
                  <span className="text-sm font-bold text-white">{user.username}</span>
                </div>
                <button 
                  onClick={() => setActiveModal('avatar')}
                  className="w-10 h-10 bg-slate-800 hover:bg-slate-700 rounded-xl border border-white/5 transition-colors flex items-center justify-center text-xl"
                  title={t('modal.avatar.title')}
                >
                  {user.avatar || '👤'}
                </button>
                <button 
                  onClick={handleLogout}
                  className="p-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl border border-white/5 transition-colors"
                  title={t('auth.logout')}
                >
                  <LogIn className="w-5 h-5 text-slate-400 rotate-180" />
                </button>
              </div>
            ) : (
              <button 
                onClick={() => setShowAuth(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-emerald-500/20"
              >
                <LogIn className="w-4 h-4" />
                {t('auth.login')}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center relative z-10">
        <AnimatePresence mode="wait">
          {!plan ? (
            <motion.div 
              key="landing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 min-h-[80vh] flex items-start"
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-start w-full pt-10 md:pt-20">
                <div className="space-y-10 text-center lg:text-left flex flex-col justify-start">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="inline-flex items-center gap-2 px-5 py-2 bg-emerald-500/10 text-emerald-300 rounded-full text-xs font-black uppercase tracking-[0.2em] border border-emerald-500/20 backdrop-blur-md"
                  >
                    <Sparkles className="w-4 h-4" />
                    {t('app.subtitle')}
                  </motion.div>
                  <h1 className="text-6xl md:text-8xl font-black text-white leading-[0.9] tracking-tighter font-display">
                    {t('app.hero1')} <br />
                    <span className="text-gradient">
                      {t('app.hero2')}
                    </span>
                  </h1>
                  <p className="text-xl text-slate-400 leading-relaxed max-w-xl mx-auto lg:mx-0 font-medium">
                    {t('app.desc')}
                  </p>
                  
                  <div className="flex flex-wrap items-center justify-center lg:justify-start gap-10 pt-6">
                    <div className="space-y-1">
                      <p className="text-4xl font-black text-white font-display">100%</p>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{t('app.custom').replace('100% ', '')}</p>
                    </div>
                    <div className="hidden sm:block w-px h-12 bg-white/10" />
                    <div className="space-y-1">
                      <p className="text-4xl font-black text-white font-display">24/7</p>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{t('app.ai').replace('24/7 ', '')}</p>
                    </div>
                  </div>

                  {/* Savings Calculator Preview */}
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="glass-morphism p-8 rounded-[2.5rem] border border-emerald-500/20 bg-emerald-500/5 max-w-md mx-auto lg:mx-0"
                  >
                    <div className="flex items-center gap-4 mb-4">
                      <div className="p-3 bg-emerald-500/20 rounded-xl text-emerald-400">
                        <Coins className="w-6 h-6" />
                      </div>
                      <h3 className="font-black text-white uppercase tracking-widest text-sm">Calculadora de Ahorro</h3>
                    </div>
                    <p className="text-slate-400 text-sm mb-6 font-medium">
                      Descubre cuánto dinero podrías ahorrar al año dejando el vapeo hoy mismo.
                    </p>
                    <div className="flex items-end gap-2">
                      <span className="text-4xl font-black text-emerald-400 font-display">~1.200€</span>
                      <span className="text-slate-500 text-xs font-black uppercase tracking-widest pb-1">/ año</span>
                    </div>
                  </motion.div>
                </div>

                <div className="relative space-y-10 flex flex-col justify-start">
                  <div className="text-center lg:text-left">
                    <motion.div 
                      initial={{ scale: 0.9 }}
                      animate={{ scale: 1 }}
                      className="inline-flex items-center gap-2 px-5 py-2 bg-emerald-500/10 rounded-full text-[10px] font-black uppercase tracking-[0.2em] text-emerald-300 border border-emerald-500/20 mb-8"
                    >
                      <Sparkles className="w-4 h-4" />
                      {t('app.start')}
                    </motion.div>
                    <h2 className="text-6xl md:text-8xl font-black text-white mb-8 font-display leading-[0.9] tracking-tighter">
                      {t('app.design')} <br />
                      <span className="text-gradient">{t('app.freedom')}</span>
                    </h2>
                  </div>
                  
                  <Form onSubmit={handleGeneratePlan} isLoading={isLoading} />
                  {error && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="absolute -bottom-20 left-0 right-0 bg-rose-500/10 text-rose-400 p-5 rounded-[2rem] border border-rose-500/20 text-center font-black text-sm shadow-2xl backdrop-blur-xl"
                    >
                      {error}
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="w-full px-4 sm:px-6 lg:px-8 py-12"
            >
              <Suspense fallback={
                <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
                  <Loader2 className="w-12 h-12 animate-spin text-emerald-500" />
                  <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Cargando Dashboard...</p>
                </div>
              }>
                <Dashboard 
                  plan={plan} 
                  onReset={handleReset} 
                  onRelapse={() => setActiveModal('relapse')}
                  quitDate={quitDate!} 
                  userData={userData!} 
                  user={user} 
                  setUser={setUser}
                />
              </Suspense>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Auth Modal */}
      <AnimatePresence>
        {showAuth && (
          <Suspense fallback={<div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 backdrop-blur-sm"><Loader2 className="w-12 h-12 animate-spin text-emerald-500" /></div>}>
            <Auth onAuthSuccess={handleAuthSuccess} onClose={() => setShowAuth(false)} />
          </Suspense>
        )}
      </AnimatePresence>

      {/* Modals */}
      <AnimatePresence>
        {isLoading && plan && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-slate-950/90 backdrop-blur-xl"
          >
            <div className="relative">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="w-24 h-24 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full"
              />
              <motion.div
                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <Sparkles className="w-8 h-8 text-cyan-500" />
              </motion.div>
            </div>
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mt-8 text-center space-y-2"
            >
              <h3 className="text-2xl font-black text-white font-display">Ajustando tu Plan...</h3>
              <p className="text-slate-400 font-medium">Nuestra IA está analizando tu situación para darte el mejor apoyo.</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {activeModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="glass-morphism w-full max-w-2xl p-10 rounded-[3rem] relative overflow-hidden max-h-[90vh] overflow-y-auto"
            >
              <button 
                onClick={() => setActiveModal(null)}
                className="absolute top-8 right-8 p-2 text-slate-400 hover:text-white transition-colors"
              >
                <LogIn className="w-6 h-6 rotate-45" />
              </button>

              {activeModal === 'relapse' && (
                <form onSubmit={handleRelapseSubmit} className="space-y-8">
                  <div className="space-y-4">
                    <h2 className="text-3xl font-black text-white font-display">No pasa nada, estamos contigo</h2>
                    <p className="text-slate-400 font-medium leading-relaxed">
                      Una recaída es parte del proceso. Lo importante es aprender de ella. Cuéntanos qué ha pasado para que podamos ajustar tu plan.
                    </p>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">
                        ¿Por qué has recaído?
                      </label>
                      <textarea
                        value={relapseReason}
                        onChange={(e) => setRelapseReason(e.target.value)}
                        placeholder="Ej: Mucho estrés en el trabajo, estaba de fiesta con amigos..."
                        className="w-full bg-slate-800/50 border border-white/10 rounded-2xl px-5 py-4 text-white focus:ring-2 focus:ring-rose-500 transition-all outline-none font-medium h-28 resize-none leading-relaxed"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">
                        ¿Qué has hecho al respecto?
                      </label>
                      <textarea
                        value={relapseAction}
                        onChange={(e) => setRelapseAction(e.target.value)}
                        placeholder="Ej: He tirado el vaper, he salido a caminar..."
                        className="w-full bg-slate-800/50 border border-white/10 rounded-2xl px-5 py-4 text-white focus:ring-2 focus:ring-rose-500 transition-all outline-none font-medium h-28 resize-none leading-relaxed"
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-rose-500 to-cyan-500 text-white font-black py-5 rounded-2xl shadow-xl flex items-center justify-center gap-4 text-sm uppercase tracking-widest group transition-all"
                  >
                    Actualizar mi Plan
                    <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </form>
              )}

              {activeModal === 'avatar' && (
                <div className="space-y-6">
                  <h2 className="text-3xl font-black text-white font-display">{t('modal.avatar.title')}</h2>
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-4">
                    {avatars.map((avatar, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleAvatarChange(avatar)}
                        className={`text-4xl p-4 rounded-2xl border transition-all hover:scale-110 ${
                          user?.avatar === avatar 
                            ? 'bg-emerald-500/20 border-emerald-500' 
                            : 'bg-slate-800/50 border-white/5 hover:bg-slate-700'
                        }`}
                      >
                        {avatar}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {activeModal === 'privacy' && (
                <div className="space-y-6">
                  <h2 className="text-3xl font-black text-white font-display">{t('modal.privacy.title')}</h2>
                  <div className="space-y-4 text-slate-300 font-medium leading-relaxed">
                    <p>{'En Respira Libre, tu privacidad es nuestra prioridad. Todos los datos que proporcionas para generar tu plan (edad, peso, hábitos) se procesan de forma segura.'}</p>
                    <p>{'No compartimos tu información personal con terceros. Los datos se utilizan exclusivamente para personalizar tu experiencia y mejorar las recomendaciones de nuestra IA.'}</p>
                    <p>{'Puedes solicitar la eliminación de tu cuenta y todos tus datos asociados en cualquier momento desde tu perfil.'}</p>
                  </div>
                </div>
              )}

              {activeModal === 'terms' && (
                <div className="space-y-6">
                  <h2 className="text-3xl font-black text-white font-display">{t('modal.terms.title')}</h2>
                  <div className="space-y-4 text-slate-300 font-medium leading-relaxed">
                    <p>{'Al utilizar Respira Libre, aceptas que esta aplicación es una herramienta de apoyo y no sustituye el consejo médico profesional.'}</p>
                    <p>Las recomendaciones generadas por nuestra IA se basan en pautas generales de salud y bienestar. Siempre consulta con un profesional de la salud antes de realizar cambios drásticos en tu dieta o rutina de ejercicio.</p>
                    <p>Respira Libre no se hace responsable de las recaídas, pero estamos aquí para ayudarte a levantarte y seguir adelante.</p>
                  </div>
                </div>
              )}

              {activeModal === 'contact' && (
                <div className="space-y-8">
                  <h2 className="text-3xl font-black text-white font-display">{t('modal.contact.title')}</h2>
                  
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <p className="text-xs font-black text-emerald-400 uppercase tracking-widest">{t('modal.contact.support')}</p>
                      <p className="text-xl text-white font-bold">+34 600 000 000</p>
                      <p className="text-slate-400">soporte@vapeoff.app</p>
                    </div>

                    <div className="p-6 bg-rose-500/10 rounded-[2rem] border border-rose-500/20 space-y-4">
                      <p className="text-xs font-black text-rose-400 uppercase tracking-widest flex items-center gap-2">
                        <HeartPulse className="w-4 h-4" /> {t('modal.contact.helpLines')}
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                          <p className="text-white font-bold">Teléfono de la Esperanza</p>
                          <p className="text-2xl text-rose-300 font-black">717 003 717</p>
                        </div>
                        <div>
                          <p className="text-white font-bold">FAD Juventud</p>
                          <p className="text-2xl text-rose-300 font-black">900 16 15 15</p>
                        </div>
                        <div>
                          <p className="text-white font-bold">Ayuda para Dejar de Fumar</p>
                          <p className="text-2xl text-rose-300 font-black">900 124 365</p>
                        </div>
                        <div>
                          <p className="text-white font-bold">Emergencias</p>
                          <p className="text-2xl text-rose-300 font-black">112</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="bg-slate-900/80 border-t border-white/10 py-12 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-2.5 text-slate-500 font-bold text-xl tracking-tighter">
              <CloudOff className="w-6 h-6" />
              Respira Libre
            </div>
            <div className="flex gap-8 text-sm font-bold text-slate-500 uppercase tracking-widest">
              <button onClick={() => setActiveModal('privacy')} className="hover:text-white transition-colors">{t('footer.privacy')}</button>
              <button onClick={() => setActiveModal('terms')} className="hover:text-white transition-colors">{t('footer.terms')}</button>
              <button onClick={() => setActiveModal('contact')} className="hover:text-white transition-colors">{t('footer.contact')}</button>
            </div>
            <p className="text-slate-600 text-sm font-medium">
              &copy; {new Date().getFullYear()} Respira Libre. {t('footer.rights')}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PlanData, generateDailyRecommendation, getChatSession } from '../services/geminiService';
import { UserData } from './Form';
import { 
  Utensils, 
  Dumbbell, 
  Moon, 
  Lightbulb, 
  Heart, 
  ArrowLeft, 
  CalendarDays, 
  TrendingUp, 
  Coins, 
  Zap,
  CheckCircle2,
  MessageCircle,
  X,
  Send,
  Loader2,
  Trophy,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ShieldCheck,
  Activity,
  Target,
  CloudOff,
  Home,
  Sun,
  Scale,
  CloudSun,
  Sunrise,
  Coffee,
  Sunset,
  Bed
} from 'lucide-react';

import { t } from '../i18n';

interface DashboardProps {
  plan: PlanData;
  onReset: () => void;
  onRelapse: () => void;
  quitDate: string;
  userData: UserData;
  user: any;
  setUser: (user: any) => void;
}

const ProgressRing = React.memo(({ days }: { days: number }) => {
  const radius = 80;
  const stroke = 8;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const progress = Math.min(days / 30, 1);
  const strokeDashoffset = circumference - progress * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg height={radius * 2} width={radius * 2} className="transform -rotate-90">
        <circle
          stroke="rgba(255,255,255,0.1)"
          fill="transparent"
          strokeWidth={stroke}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        <motion.circle
          stroke="url(#gradient)"
          fill="transparent"
          strokeWidth={stroke}
          strokeDasharray={circumference + ' ' + circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
          strokeLinecap="round"
        />
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-4xl font-black font-display text-white">{days}</span>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Días</span>
      </div>
    </div>
  );
});

export default function Dashboard({ plan, onReset, onRelapse, quitDate, userData, user, setUser} : DashboardProps) {
  const [daysQuit, setDaysQuit] = useState(0);
  const [dailyRec, setDailyRec] = useState<{ activity: string; tip: string; motivation: string } | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'model'; text: string }[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [currentDayIndex, setCurrentDayIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<'home' | 'overview' | 'daily' | 'weekly' | 'milestones' | 'core' | 'survival'>('home');
  const chatSessionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const tabs = [
    { id: 'home', label: t('nav.home'), icon: Home },
    { id: 'overview', label: t('nav.overview'), icon: Activity },
    { id: 'daily', label: t('nav.mission'), icon: Zap },
    { id: 'weekly', label: t('nav.week'), icon: CalendarDays },
    { id: 'milestones', label: t('nav.milestones'), icon: Heart },
    { id: 'core', label: t('nav.core'), icon: Target },
    { id: 'survival', label: t('nav.survival'), icon: Lightbulb },
  ] as const;

  const weeklyDays = React.useMemo(() => [
    { day: 'Lun', fullDay: 'Lunes', content: plan.weeklyRoutine.monday },
    { day: 'Mar', fullDay: 'Martes', content: plan.weeklyRoutine.tuesday },
    { day: 'Mié', fullDay: 'Miércoles', content: plan.weeklyRoutine.wednesday },
    { day: 'Jue', fullDay: 'Jueves', content: plan.weeklyRoutine.thursday },
    { day: 'Vie', fullDay: 'Viernes', content: plan.weeklyRoutine.friday },
    { day: 'Sáb', fullDay: 'Sábado', content: plan.weeklyRoutine.saturday },
    { day: 'Dom', fullDay: 'Domingo', content: plan.weeklyRoutine.sunday },
  ], [plan.weeklyRoutine]);

  const handlePrevDay = React.useCallback(() => {
    setCurrentDayIndex((prev) => (prev === 0 ? 6 : prev - 1));
  }, []);

  const handleNextDay = React.useCallback(() => {
    setCurrentDayIndex((prev) => (prev === 6 ? 0 : prev + 1));
  }, []);

  // Get current date and day of week
  const today = React.useMemo(() => new Date(), []);
  const dayName = React.useMemo(() => new Intl.DateTimeFormat('es-ES', { weekday: 'long' }).format(today), [today]);
  const capitalizedDayName = React.useMemo(() => dayName.charAt(0).toUpperCase() + dayName.slice(1), [dayName]);
  const formattedDate = React.useMemo(() => new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'long' }).format(today), [today]);

  // Find today's routine in weeklyDays
  const todayRoutine = React.useMemo(() => weeklyDays.find(d => d.fullDay.toLowerCase() === dayName.toLowerCase()) || weeklyDays[0], [weeklyDays, dayName]);

  const isMilestoneReached = React.useCallback((timeStr: string) => {
    const time = timeStr.toLowerCase();
    if (time.includes('minuto') || time.includes('minute')) {
      return true; // Minutes are always reached if they are here
    }
    if (time.includes('hora') || time.includes('hour') || time.includes('heure')) {
      const hours = parseInt(time.replace(/\D/g, '')) || 1;
      return (daysQuit * 24) >= hours;
    }
    if (time.includes('día') || time.includes('dia') || time.includes('day') || time.includes('jour')) {
      const days = parseInt(time.replace(/\D/g, '')) || 1;
      return daysQuit >= days;
    }
    if (time.includes('semana') || time.includes('week') || time.includes('semaine')) {
      const weeks = parseInt(time.replace(/\D/g, '')) || 1;
      return daysQuit >= (weeks * 7);
    }
    if (time.includes('mes') || time.includes('month') || time.includes('mois')) {
      const months = parseInt(time.replace(/\D/g, '')) || 1;
      return daysQuit >= (months * 30);
    }
    if (time.includes('año') || time.includes('year') || time.includes('an')) {
      const years = parseInt(time.replace(/\D/g, '')) || 1;
      return daysQuit >= (years * 365);
    }
    return false;
  }, [daysQuit]);

  const getLeague = React.useCallback((pts: number) => {
    const leaguePoints = user?.maxPoints || pts;
    if (leaguePoints >= 1000) return { name: 'Diamante', color: 'text-cyan-400', bg: 'bg-cyan-500/20' };
    if (leaguePoints >= 600) return { name: 'Platino', color: 'text-slate-300', bg: 'bg-slate-400/20' };
    if (leaguePoints >= 300) return { name: 'Oro', color: 'text-yellow-400', bg: 'bg-yellow-500/20' };
    if (leaguePoints >= 100) return { name: 'Plata', color: 'text-slate-400', bg: 'bg-slate-500/20' };
    return { name: 'Bronce', color: 'text-amber-600', bg: 'bg-amber-600/20' };
  }, [user?.maxPoints]);

  const handleTaskComplete = React.useCallback(async (taskId: string, points: number) => {
    if (!user) return;
    
    const isCompleted = user.completedTasks?.includes(taskId);
    if (isCompleted) return; // Already completed

    const newCompletedTasks = [...(user.completedTasks || []), taskId];
    const newPoints = (user.points || 0) + points;
    const newMaxPoints = Math.max(user.maxPoints || 0, newPoints);

    try {
      const response = await fetch('/api/update-progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, points: newPoints, maxPoints: newMaxPoints, completedTasks: newCompletedTasks }),
      });
      
      if (response.ok) {
        const updatedUser = { ...user, points: newPoints, maxPoints: newMaxPoints, completedTasks: newCompletedTasks };
        setUser(updatedUser);
        localStorage.setItem('vape_quit_user', JSON.stringify(updatedUser));
      }
    } catch (err) {
      console.error('Error updating progress:', err);
    }
  }, [user, setUser]);

  useEffect(() => {
    const start = new Date(quitDate).getTime();
    const now = new Date().getTime();
    const diffTime = Math.abs(now - start);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    setDaysQuit(diffDays);

    const fetchRec = async () => {
      try {
        const rec = await generateDailyRecommendation(diffDays, userData.age, userData.hobbies, userData.motivation);
        setDailyRec(rec);
      } catch (error) {
        console.error("Error fetching daily rec:", error);
      }
    };
    fetchRec();
  }, [quitDate, userData]);

  useEffect(() => {
    if (isChatOpen && !chatSessionRef.current) {
      chatSessionRef.current = getChatSession();
      setChatMessages([{ role: 'model', text: '¡Hola! Estoy aquí para apoyarte. ¿Cómo te sientes hoy con respecto a dejar de vapear?' }]);
    }
  }, [isChatOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleSendMessage = async (e?: React.FormEvent, manualMsg?: string) => {
    if (e) e.preventDefault();
    const userMsg = manualMsg || chatInput.trim();
    if (!userMsg || !chatSessionRef.current) return;

    if (!manualMsg) setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsChatLoading(true);

    try {
      const response = await chatSessionRef.current.sendMessage({ message: userMsg });
      setChatMessages(prev => [...prev, { role: 'model', text: response.text }]);
    } catch (error) {
      console.error("Chat error:", error);
      setChatMessages(prev => [...prev, { role: 'model', text: 'Lo siento, tuve un problema al procesar tu mensaje. ¿Puedes intentarlo de nuevo?' }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-7xl w-full mx-auto space-y-8 pb-24 px-4 sm:px-6 relative"
    >
      {/* Top Navigation Menu */}
      <div className="sticky top-20 z-40 py-4">
        <div className="glass-morphism p-2 rounded-[2rem] flex items-center justify-center gap-2 overflow-x-auto no-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all whitespace-nowrap ${
                activeTab === tab.id 
                  ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-lg shadow-emerald-500/20' 
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="space-y-12"
        >
          {activeTab === 'home' && (
            <section className="space-y-12">
              <div className="text-center space-y-4">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="inline-flex items-center gap-2 px-6 py-2 bg-emerald-500/10 rounded-full text-emerald-300 border border-emerald-500/20 font-black uppercase tracking-widest text-xs"
                >
                  <CalendarDays className="w-4 h-4" />
                  {capitalizedDayName}, {formattedDate}
                </motion.div>
                <h2 className="text-5xl md:text-6xl font-black text-white font-display leading-tight">
                  {t('dashboard.today')} <span className="text-gradient">{t('dashboard.today.highlight')}</span>
                </h2>
                {user && (
                  <div className="flex justify-center items-center gap-4 pt-4">
                    <div className="bg-slate-800/50 px-6 py-3 rounded-2xl border border-white/5 flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{t('dashboard.points')}</p>
                        <p className="text-white font-bold text-xl">{user.points || 0}</p>
                      </div>
                      <div className="w-px h-8 bg-white/10" />
                      <div className="text-left">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{t('dashboard.league')}</p>
                        <p className={`font-bold text-xl ${getLeague(user.points || 0).color}`}>{getLeague(user.points || 0).name}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {[
                  { key: 'earlyMorning', label: 'Madrugada', icon: Sunrise, color: 'emerald', points: 5 },
                  { key: 'morning', label: 'Mañana', icon: Sun, color: 'emerald', points: 10 },
                  { key: 'noon', label: 'Mediodía', icon: Coffee, color: 'blue', points: 10 },
                  { key: 'afternoon', label: 'Tarde', icon: CloudSun, color: 'blue', points: 15 },
                  { key: 'lateAfternoon', label: 'Tarde-Noche', icon: Sunset, color: 'cyan', points: 15 },
                  { key: 'evening', label: 'Cena/Noche', icon: Moon, color: 'cyan', points: 20 },
                  { key: 'night', label: 'Antes de dormir', icon: Bed, color: 'indigo', points: 10 }
                ].map((slot) => (
                  <motion.div 
                    key={slot.key}
                    whileHover={{ y: -5 }}
                    className={`glass-morphism p-8 rounded-[2.5rem] border relative overflow-hidden group transition-all ${
                      user?.completedTasks?.includes(`${formattedDate}-${slot.key}`) 
                        ? `border-${slot.color}-500/30 bg-${slot.color}-500/5` 
                        : 'border-white/5'
                    }`}
                  >
                    <div className="relative z-10 space-y-5 flex flex-col h-full">
                      <div className="flex items-center justify-between">
                        <div className={`p-3 bg-${slot.color}-500/20 text-${slot.color}-400 rounded-xl`}>
                          <slot.icon className="w-6 h-6" />
                        </div>
                        <span className={`text-[10px] font-black text-${slot.color}-500/50 uppercase tracking-[0.2em]`}>{slot.label}</span>
                      </div>
                      <p className="text-lg text-slate-200 font-medium leading-relaxed flex-1">
                        {(todayRoutine.content as any)[slot.key]}
                      </p>
                      {user && (
                        <button
                          onClick={() => handleTaskComplete(`${formattedDate}-${slot.key}`, slot.points)}
                          disabled={user.completedTasks?.includes(`${formattedDate}-${slot.key}`)}
                          className={`w-full py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${
                            user.completedTasks?.includes(`${formattedDate}-${slot.key}`)
                              ? `bg-${slot.color}-500/20 text-${slot.color}-400 cursor-default`
                              : `bg-slate-800 hover:bg-${slot.color}-500/20 text-slate-300 hover:text-${slot.color}-400 border border-white/5 hover:border-${slot.color}-500/30`
                          }`}
                        >
                          {user.completedTasks?.includes(`${formattedDate}-${slot.key}`) ? (
                            <span className="flex items-center justify-center gap-2"><CheckCircle2 className="w-3 h-3" /> {t('dashboard.completed')}</span>
                          ) : (
                            <span className="flex items-center justify-center gap-2">+{slot.points} {t('dashboard.points')}</span>
                          )}
                        </button>
                      )}
                    </div>
                    <div className={`absolute -right-4 -bottom-4 w-24 h-24 bg-${slot.color}-500/5 blur-3xl rounded-full group-hover:bg-${slot.color}-500/10 transition-colors`} />
                  </motion.div>
                ))}
              </div>
            </section>
          )}

          {activeTab === 'overview' && (
            <section className="relative overflow-hidden glass-morphism rounded-[3rem] p-8 md:p-14 text-white shadow-2xl">
              <div className="relative z-10 flex flex-col lg:flex-row items-center gap-12">
                <div className="flex-1 space-y-8 text-center lg:text-left">
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="inline-flex items-center gap-2 px-5 py-2 bg-emerald-500/20 rounded-full text-xs font-black uppercase tracking-[0.2em] border border-emerald-500/30 text-emerald-300"
                  >
                    <Sparkles className="w-4 h-4" />
                    Tu Transformación
                  </motion.div>
                  <h1 className="text-5xl md:text-7xl font-black leading-tight">
                    Recupera tu <span className="text-gradient">Libertad.</span>
                  </h1>
                  <p className="text-slate-300 text-xl leading-relaxed font-medium max-w-xl mx-auto lg:mx-0">
                    {plan.encouragingMessage}
                  </p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
                    <motion.div 
                      whileHover={{ scale: 1.02 }}
                      className="glass p-6 rounded-[2rem] flex items-center gap-5"
                    >
                      <div className="p-4 bg-emerald-500/20 rounded-2xl">
                        <Coins className="w-8 h-8 text-emerald-400" />
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1">Ahorro Mensual</p>
                        <p className="text-3xl font-black font-display">~{plan.moneySavedPerMonth}€</p>
                      </div>
                    </motion.div>
                    <motion.div 
                      whileHover={{ scale: 1.02 }}
                      className="glass p-6 rounded-[2rem] flex items-center gap-5 border border-emerald-500/30 bg-emerald-500/5"
                    >
                      <div className="p-4 bg-emerald-500/20 rounded-2xl">
                        <Scale className="w-8 h-8 text-emerald-400" />
                      </div>
                      <div>
                        <p className="text-[10px] text-emerald-300 uppercase font-black tracking-widest mb-1">Ahorro Total</p>
                        <p className="text-3xl font-black font-display text-emerald-400">
                          {Math.max(0, Math.round((plan.moneySavedPerMonth / 30) * daysQuit))}€
                        </p>
                      </div>
                    </motion.div>
                    <motion.div 
                      whileHover={{ scale: 1.02 }}
                      className="glass p-6 rounded-[2rem] flex items-center gap-5"
                    >
                      <div className="p-4 bg-blue-500/20 rounded-2xl">
                        <Activity className="w-8 h-8 text-blue-400" />
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1">Estado de Salud</p>
                        <p className="text-3xl font-black font-display">Mejorando</p>
                      </div>
                    </motion.div>
                  </div>
                </div>

                <div className="flex flex-col items-center gap-6">
                  <ProgressRing days={daysQuit} />
                  <div className="text-center space-y-4">
                    <div>
                      <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">Próximo Hito</p>
                      <p className="text-white font-black text-lg">30 Días de Libertad</p>
                    </div>
                    
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={onRelapse}
                      className="px-6 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-full border border-rose-500/20 backdrop-blur-md transition-all font-black text-[10px] uppercase tracking-widest flex items-center gap-2 group"
                    >
                      <CloudOff className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                      He recaído (Reiniciar)
                    </motion.button>
                  </div>
                </div>
              </div>
              
              {/* Background Accents */}
              <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/10 blur-[120px] rounded-full -mr-64 -mt-64" />
              <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-cyan-500/10 blur-[100px] rounded-full -ml-48 -mb-48" />
            </section>
          )}

          {activeTab === 'daily' && dailyRec && (
            <motion.section 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="group relative"
            >
              <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-[2.5rem] blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
              <div className="relative bg-slate-900 rounded-[2.5rem] p-10 md:p-12 text-white overflow-hidden border border-white/5">
                <div className="relative z-10 flex flex-col lg:flex-row gap-12 items-center">
                  <div className="flex-1 space-y-6">
                    <div className="inline-flex items-center gap-3 px-4 py-1.5 bg-white/10 rounded-full text-xs font-black uppercase tracking-widest text-white/80">
                      <Target className="w-4 h-4 text-rose-400" /> Misión del Día {daysQuit}
                    </div>
                    <h3 className="text-3xl md:text-4xl font-black font-display leading-tight">{dailyRec.activity}</h3>
                    <div className="bg-white/5 backdrop-blur-md p-6 rounded-3xl border border-white/10 space-y-3">
                      <p className="text-emerald-300 text-xs font-black uppercase tracking-widest">Estrategia recomendada</p>
                      <p className="text-slate-200 text-lg font-medium leading-relaxed">
                        {dailyRec.tip}
                      </p>
                    </div>
                  </div>
                  <div className="lg:w-1/3 text-center lg:text-right">
                    <motion.div
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ duration: 4, repeat: Infinity }}
                      className="text-4xl md:text-5xl font-black font-display italic text-gradient leading-tight"
                    >
                      "{dailyRec.motivation}"
                    </motion.div>
                  </div>
                </div>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(99,102,241,0.1),transparent_70%)]" />
              </div>
            </motion.section>
          )}

          {activeTab === 'milestones' && (
            <section className="space-y-12">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-rose-500/20 text-rose-400 rounded-2xl">
                    <Heart className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-black font-display text-white">Tu Cuerpo se Recupera</h2>
                    <p className="text-slate-400 font-medium">Seguimiento de tu evolución física</p>
                  </div>
                </div>
                <div className="bg-slate-800/50 px-6 py-3 rounded-2xl border border-white/5 flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Progreso Actual</p>
                    <p className="text-white font-bold">{daysQuit} Días Libre</p>
                  </div>
                  <div className="w-px h-8 bg-white/10" />
                  <Trophy className="w-6 h-6 text-yellow-500" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {plan.healthMilestones.map((milestone, idx) => {
                  const reached = isMilestoneReached(milestone.time);
                  return (
                    <motion.div
                      key={idx}
                      whileHover={{ y: -10 }}
                      className={`glass-morphism p-8 rounded-[2.5rem] relative group border transition-all duration-500 ${
                        reached 
                          ? 'border-emerald-500/30 bg-emerald-500/5' 
                          : 'border-white/5 opacity-60 grayscale-[0.5]'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className={`${reached ? 'text-emerald-400' : 'text-cyan-400'} font-black font-display text-lg`}>
                          {milestone.time}
                        </div>
                        {reached && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="bg-emerald-500/20 p-1.5 rounded-full"
                          >
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          </motion.div>
                        )}
                      </div>
                      <h3 className={`font-black text-xl mb-3 leading-tight transition-colors ${
                        reached ? 'text-white' : 'text-slate-300'
                      }`}>
                        {milestone.benefit}
                      </h3>
                      <p className="text-sm text-slate-400 leading-relaxed font-medium">
                        {milestone.description}
                      </p>
                      
                      {!reached && (
                        <div className="mt-6 pt-6 border-t border-white/5">
                          <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                            <Zap className="w-3 h-3" /> {t('dashboard.comingSoon')}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </section>
          )}

          {activeTab === 'core' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
              {/* Diet Section */}
              <motion.div 
                whileHover={{ y: -5 }}
                className="glass-morphism rounded-[3rem] p-10 shadow-xl flex flex-col"
              >
                <div className="flex items-center gap-5 mb-10">
                  <div className="p-5 bg-orange-500/20 text-orange-400 rounded-[1.5rem]">
                    <Utensils className="w-8 h-8" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black font-display text-white">{t('dashboard.nutrition')}</h2>
                    <p className="text-sm text-slate-400 font-bold uppercase tracking-widest">{t('dashboard.allies')}</p>
                  </div>
                </div>
                <div className="space-y-10 flex-1">
                  {plan.diet.map((item, idx) => (
                    <div key={idx} className="space-y-3">
                      <h3 className="font-black text-white text-lg flex items-center gap-3">
                        <span className="w-2 h-2 rounded-full bg-orange-400 shadow-[0_0_10px_rgba(251,146,60,0.5)]" />
                        {item.title}
                      </h3>
                      <p className="text-slate-400 text-sm leading-relaxed font-medium">{item.description}</p>
                      <div className="bg-orange-500/5 p-5 rounded-2xl border border-orange-500/10">
                        <p className="text-[10px] font-black text-orange-400 uppercase tracking-[0.2em] mb-2">{t('dashboard.impact')}</p>
                        <p className="text-orange-200/80 text-xs font-medium leading-relaxed">{item.benefits}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Exercise Section */}
              <motion.div 
                whileHover={{ y: -5 }}
                className="glass-morphism rounded-[3rem] p-10 shadow-xl flex flex-col"
              >
                <div className="flex items-center gap-5 mb-10">
                  <div className="p-5 bg-blue-500/20 text-blue-400 rounded-[1.5rem]">
                    <Dumbbell className="w-8 h-8" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black font-display text-white">{t('dashboard.exercise')}</h2>
                    <p className="text-sm text-slate-400 font-bold uppercase tracking-widest">{t('dashboard.energy')}</p>
                  </div>
                </div>
                <div className="space-y-10 flex-1">
                  {plan.exercise.map((item, idx) => (
                    <div key={idx} className="space-y-3">
                      <h3 className="font-black text-white text-lg flex items-center gap-3">
                        <span className="w-2 h-2 rounded-full bg-blue-400 shadow-[0_0_10px_rgba(96,165,250,0.5)]" />
                        {item.title}
                      </h3>
                      <p className="text-slate-400 text-sm leading-relaxed font-medium">{item.description}</p>
                      <div className="flex items-center gap-3 bg-blue-500/5 p-4 rounded-2xl border border-blue-500/10">
                        <Zap className="w-4 h-4 text-blue-400" />
                        <p className="text-blue-200/80 text-xs font-bold">{item.duration}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Rest Section */}
              <motion.div 
                whileHover={{ y: -5 }}
                className="glass-morphism rounded-[3rem] p-10 shadow-xl flex flex-col"
              >
                <div className="flex items-center gap-5 mb-10">
                  <div className="p-5 bg-emerald-500/20 text-emerald-400 rounded-[1.5rem]">
                    <Moon className="w-8 h-8" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black font-display text-white">{t('dashboard.rest')}</h2>
                    <p className="text-sm text-slate-400 font-bold uppercase tracking-widest">{t('dashboard.calm')}</p>
                  </div>
                </div>
                <div className="space-y-10 flex-1">
                  {plan.rest.map((item, idx) => (
                    <div key={idx} className="space-y-3">
                      <h3 className="font-black text-white text-lg flex items-center gap-3">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                        {item.title}
                      </h3>
                      <p className="text-slate-400 text-sm leading-relaxed font-medium">{item.description}</p>
                      <div className="bg-emerald-500/5 p-5 rounded-2xl border border-emerald-500/10">
                        <p className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em] mb-2">{t('dashboard.when')}</p>
                        <p className="text-emerald-200/80 text-xs font-medium leading-relaxed">{item.when}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          )}

          {activeTab === 'weekly' && (
            <section className="glass-morphism rounded-[4rem] p-10 md:p-16 shadow-2xl relative overflow-hidden">
              <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-16">
                <div className="flex items-center gap-6">
                  <div className="p-5 bg-emerald-500/20 text-emerald-400 rounded-[2rem]">
                    <CalendarDays className="w-10 h-10" />
                  </div>
                  <div>
                    <h2 className="text-4xl font-black font-display text-white">{t('nav.week')}</h2>
                    <p className="text-slate-400 text-lg font-medium">{'Planificación semanal estratégica'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <button 
                    onClick={handlePrevDay}
                    className="p-5 rounded-full glass hover:bg-white/10 text-white transition-all active:scale-90"
                  >
                    <ChevronLeft className="w-8 h-8" />
                  </button>
                  <button 
                    onClick={handleNextDay}
                    className="p-5 rounded-full glass hover:bg-white/10 text-white transition-all active:scale-90"
                  >
                    <ChevronRight className="w-8 h-8" />
                  </button>
                </div>
              </div>
              
              <div className="flex justify-center">
                <div className="w-full max-w-2xl">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentDayIndex}
                      initial={{ opacity: 0, scale: 0.9, x: 20 }}
                      animate={{ opacity: 1, scale: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.9, x: -20 }}
                      transition={{ type: "spring", damping: 20, stiffness: 100 }}
                      className="bg-slate-900/80 rounded-[3.5rem] border border-white/10 shadow-2xl overflow-hidden flex flex-col"
                    >
                      <div className="bg-gradient-to-r from-emerald-500 to-cyan-500 py-8 px-10 text-center">
                        <h3 className="font-black text-white uppercase tracking-[0.3em] text-2xl font-display">
                          {weeklyDays[currentDayIndex].fullDay}
                        </h3>
                      </div>
                      <div className="p-10 md:p-14 space-y-10">
                        {[
                          { key: 'earlyMorning', label: 'Madrugada', icon: 'M', color: 'emerald' },
                          { key: 'morning', label: 'Mañana', icon: 'M', color: 'emerald' },
                          { key: 'noon', label: 'Mediodía', icon: 'C', color: 'blue' },
                          { key: 'afternoon', label: 'Tarde', icon: 'T', color: 'blue' },
                          { key: 'lateAfternoon', label: 'Tarde-Noche', icon: 'TN', color: 'cyan' },
                          { key: 'evening', label: 'Cena/Noche', icon: 'N', color: 'cyan' },
                          { key: 'night', label: 'Antes de dormir', icon: 'Z', color: 'violet' }
                        ].map((slot, idx) => (
                          <div key={slot.key} className="flex gap-8">
                            <div className="flex flex-col items-center gap-2">
                              <div className={`w-12 h-12 rounded-2xl bg-${slot.color}-500/20 flex items-center justify-center text-${slot.color}-400 font-black`}>
                                {slot.icon}
                              </div>
                              {idx < 6 && <div className={`w-0.5 h-full bg-gradient-to-b from-${slot.color}-500/50 to-transparent`} />}
                            </div>
                            <div className="space-y-2 pt-2">
                              <span className={`text-xs font-black text-${slot.color}-400 uppercase tracking-widest block`}>{slot.label}</span>
                              <p className="text-slate-200 text-xl leading-relaxed font-medium">
                                {(weeklyDays[currentDayIndex].content as any)[slot.key]}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            </section>
          )}

          {activeTab === 'survival' && (
            <section className="bg-slate-900 rounded-[4rem] p-10 md:p-16 text-white shadow-2xl relative overflow-hidden border border-white/5">
              <div className="relative z-10">
                <div className="flex items-center gap-6 mb-16">
                  <div className="p-5 bg-yellow-500/20 text-yellow-400 rounded-[2rem]">
                    <Lightbulb className="w-10 h-10" />
                  </div>
                  <div>
                    <h2 className="text-4xl font-black font-display">{t('nav.survival')}</h2>
                    <p className="text-slate-400 text-lg font-medium">{'Tácticas de respuesta inmediata'}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {plan.tips.map((tip, idx) => (
                    <motion.div 
                      key={idx} 
                      whileHover={{ scale: 1.02, x: 10 }}
                      className="flex gap-6 items-start glass p-8 rounded-[2.5rem] transition-all"
                    >
                      <div className="w-14 h-14 rounded-[1.5rem] bg-emerald-500/20 flex items-center justify-center shrink-0 border border-emerald-500/20">
                        <span className="text-emerald-400 font-black font-display text-xl">{idx + 1}</span>
                      </div>
                      <span className="text-slate-200 text-lg leading-relaxed font-medium">{tip}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-emerald-500/5 blur-[150px] pointer-events-none" />
            </section>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Chatbot Floating UI */}
      <div className="fixed bottom-8 right-8 z-50 flex flex-col items-end">
        <AnimatePresence>
          {isChatOpen && (
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.9 }}
              className="bg-slate-900 border border-white/10 rounded-[3rem] shadow-2xl w-[95vw] sm:w-[32rem] md:w-[36rem] h-[600px] max-h-[80vh] mb-6 flex flex-col overflow-hidden"
            >
              <div className="bg-gradient-to-r from-emerald-500 to-cyan-500 p-6 flex items-center justify-between">
                <div className="flex items-center gap-4 text-white">
                  <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-md">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black font-display">{t('dashboard.chat.title')}</h3>
                    <p className="text-emerald-100 text-[10px] font-bold uppercase tracking-widest">{t('dashboard.chat.subtitle')}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsChatOpen(false)} 
                  className="p-2 hover:bg-white/20 rounded-xl transition-colors text-white"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-800/50 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                {chatMessages.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] p-5 rounded-[1.5rem] text-base leading-relaxed font-medium ${
                      msg.role === 'user' 
                        ? 'bg-emerald-500 text-white rounded-tr-none shadow-lg' 
                        : 'bg-slate-700 text-slate-100 rounded-tl-none shadow-md'
                    }`}>
                      {msg.text.replace(/\*\*/g, '')}
                    </div>
                  </div>
                ))}
                {isChatLoading && (
                  <div className="flex justify-start">
                    <div className="bg-slate-700 text-slate-100 p-5 rounded-[1.5rem] rounded-tl-none flex items-center gap-3 shadow-md">
                      <Loader2 className="w-5 h-5 animate-spin text-emerald-400" /> 
                      <span className="font-bold text-sm uppercase tracking-widest">{t('dashboard.analyzing')}</span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Actions */}
              <div className="px-6 py-3 bg-slate-900/80 border-t border-white/5 flex gap-2 overflow-x-auto no-scrollbar">
                {[
                  { label: '🔥 Tengo ganas', msg: 'Tengo muchas ganas de vapear ahora mismo, ¿qué hago?' },
                  { label: '😫 Estoy estresado', msg: 'Siento mucho estrés y me dan ganas de fumar, ¿alguna solución rápida?' },
                  { label: '💡 Consejo rápido', msg: 'Dame un consejo táctico para este momento del día.' }
                ].map((action, i) => (
                  <button
                    key={i}
                    onClick={() => handleSendMessage(undefined, action.msg)}
                    className="whitespace-nowrap px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-300 hover:text-white transition-all active:scale-95"
                  >
                    {action.label}
                  </button>
                ))}
              </div>

              <form onSubmit={handleSendMessage} className="p-6 bg-slate-900 border-t border-white/10 flex gap-4">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder={t('dashboard.chat.placeholder')}
                  className="flex-1 bg-slate-800 border border-white/10 rounded-2xl px-6 py-4 text-base text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-slate-500 transition-all"
                />
                <button 
                  type="submit"
                  disabled={!chatInput.trim() || isChatLoading}
                  className="bg-emerald-500 text-white p-4 rounded-2xl hover:bg-emerald-400 disabled:opacity-50 transition-all active:scale-95 shadow-lg shadow-emerald-500/20"
                >
                  <Send className="w-6 h-6" />
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="relative">
          {!isChatOpen && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.5, duration: 0.5 }}
              className="absolute right-full mr-6 top-1/2 -translate-y-1/2 bg-white text-emerald-500 px-6 py-3 rounded-[1.5rem] rounded-br-none shadow-2xl font-black whitespace-nowrap text-sm uppercase tracking-widest border-2 border-emerald-100"
            >
              {t('dashboard.chat.greeting')}
            </motion.div>
          )}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsChatOpen(!isChatOpen)}
            className="bg-gradient-to-br from-emerald-500 via-cyan-500 to-indigo-500 text-white p-6 rounded-full shadow-2xl shadow-emerald-500/40 hover:shadow-emerald-500/60 transition-all relative z-10 border-2 border-white/20"
          >
            {isChatOpen ? <X className="w-8 h-8" /> : <MessageCircle className="w-8 h-8" />}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

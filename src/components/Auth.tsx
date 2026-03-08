import React, { useState } from 'react';
import { motion } from 'motion/react';
import { User, Lock, LogIn, UserPlus, X, Loader2, Mail } from 'lucide-react';

import { t } from '../i18n';

interface AuthProps {
  onAuthSuccess: (user: any) => void;
  onClose: () => void;
}

export default function Auth({ onAuthSuccess, onClose} : AuthProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const endpoint = isLogin ? '/api/login' : '/api/register';
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password }),
      });

      const data = await response.json();
      if (response.ok) {
        if (isLogin) {
          onAuthSuccess(data.user);
        } else {
          // After register, auto login
          const loginRes = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
          });
          const loginData = await loginRes.json();
          onAuthSuccess(loginData.user);
        }
      } else {
        setError(data.error || 'Algo salió mal');
      }
    } catch (err) {
      setError('Error de conexión');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="glass-morphism w-full max-w-md p-8 rounded-[2.5rem] relative overflow-hidden"
      >
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="mb-8 text-center">
          <div className="inline-flex p-4 bg-emerald-500/20 text-emerald-400 rounded-2xl mb-4">
            {isLogin ? <LogIn className="w-8 h-8" /> : <UserPlus className="w-8 h-8" />}
          </div>
          <h2 className="text-3xl font-black text-white font-display">
            {isLogin ? t('auth.login') : t('auth.register')}
          </h2>
          <p className="text-slate-400 font-medium mt-2">
            {isLogin ? ('Inicia sesión para ver tu progreso') : ('Crea tu cuenta para guardar tu plan')}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
              <User className="w-3.5 h-3.5" /> {t('auth.username')}
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-slate-800/50 border border-white/10 rounded-2xl px-5 py-4 text-white focus:ring-2 focus:ring-emerald-500 transition-all outline-none font-bold"
              required
            />
          </div>

          {!isLogin && (
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                <Mail className="w-3.5 h-3.5" /> Correo Electrónico
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-800/50 border border-white/10 rounded-2xl px-5 py-4 text-white focus:ring-2 focus:ring-emerald-500 transition-all outline-none font-bold"
                required
              />
            </div>
          )}

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
              <Lock className="w-3.5 h-3.5" /> {t('auth.password')}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-800/50 border border-white/10 rounded-2xl px-5 py-4 text-white focus:ring-2 focus:ring-emerald-500 transition-all outline-none font-bold"
              required
            />
          </div>

          {error && (
            <p className="text-rose-400 text-sm font-bold text-center bg-rose-500/10 p-3 rounded-xl border border-rose-500/20">
              {error}
            </p>
          )}

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-black py-5 rounded-[1.5rem] shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-3 text-lg uppercase tracking-[0.2em] transition-all"
          >
            {isLoading ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              isLogin ? t('auth.login') : t('auth.register')
            )}
          </motion.button>
        </form>

        <div className="mt-8 text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-slate-400 hover:text-emerald-400 font-bold transition-colors text-sm"
          >
            {isLogin ? t('auth.noAccount') + ' ' + t('auth.register') : t('auth.hasAccount') + ' ' + t('auth.login')}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, 
  Wind, 
  Calendar, 
  Heart, 
  Sparkles, 
  Target, 
  Smile,
  ChevronRight,
  Loader2,
  Scale,
  Ruler,
  CloudOff,
  Gamepad2
} from 'lucide-react';

import { t } from '../i18n';

export interface UserData {
  age: number;
  weight: number;
  height: number;
  vapeFrequency: number;
  vapeDurationMonths: number;
  smokesCigarettes: boolean;
  hobbies: string;
  motivation: string;
  // New fields for the test
  vapeTriggers: string;
  previousAttempts: string;
  commitmentLevel: number;
  dailyRoutine: string;
  biggestFear: string;
  socialVaping: string;
}

interface FormProps {
  onSubmit: (data: UserData) => void;
  isLoading: boolean;
}

export default function Form({ onSubmit, isLoading} : FormProps) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<UserData>({
    age: 18,
    weight: 70,
    height: 170,
    vapeFrequency: 10,
    vapeDurationMonths: 12,
    smokesCigarettes: false,
    hobbies: '',
    motivation: '',
    vapeTriggers: '',
    previousAttempts: '',
    commitmentLevel: 10,
    dailyRoutine: '',
    biggestFear: '',
    socialVaping: 'both'
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData({ ...formData, [name]: checked });
      return;
    }

    if (type === 'number' || name === 'commitmentLevel') {
      const val = value === '' ? '' : Number(value);
      setFormData({ ...formData, [name]: val });
      return;
    }
    
    setFormData({ ...formData, [name]: value });
  };

  const nextStep = () => setStep(2);
  const prevStep = () => setStep(1);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1) {
      nextStep();
    } else {
      onSubmit(formData);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full"
    >
      <form onSubmit={handleSubmit} className="space-y-8">
        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-8"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Personal Info Section */}
                <motion.div 
                  whileHover={{ y: -5 }}
                  className="glass-morphism p-8 rounded-[2.5rem] flex flex-col h-full"
                >
                  <div className="flex items-center gap-4 mb-8">
                    <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-2xl">
                      <User className="w-6 h-6" />
                    </div>
                    <h2 className="text-xl font-black font-display text-white">{'Perfil Personal'}</h2>
                  </div>

                  <div className="space-y-6 flex-1">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5" /> {t('form.age')}
                      </label>
                      <input
                        type="number"
                        name="age"
                        value={formData.age}
                        onChange={handleChange}
                        className="w-full bg-slate-800/50 border border-white/10 rounded-2xl px-5 py-4 text-white focus:ring-2 focus:ring-emerald-500 transition-all outline-none font-bold"
                        required
                        min="12"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                          <Scale className="w-3.5 h-3.5" /> {t('form.weight')}
                        </label>
                        <input
                          type="number"
                          name="weight"
                          value={formData.weight}
                          onChange={handleChange}
                          className="w-full bg-slate-800/50 border border-white/10 rounded-2xl px-5 py-4 text-white focus:ring-2 focus:ring-emerald-500 transition-all outline-none font-bold"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                          <Ruler className="w-3.5 h-3.5" /> {t('form.height')}
                        </label>
                        <input
                          type="number"
                          name="height"
                          value={formData.height}
                          onChange={handleChange}
                          className="w-full bg-slate-800/50 border border-white/10 rounded-2xl px-5 py-4 text-white focus:ring-2 focus:ring-emerald-500 transition-all outline-none font-bold"
                          required
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Vaping Habits Section */}
                <motion.div 
                  whileHover={{ y: -5 }}
                  className="glass-morphism p-8 rounded-[2.5rem] flex flex-col h-full"
                >
                  <div className="flex items-center gap-4 mb-8">
                    <div className="p-3 bg-cyan-500/20 text-cyan-400 rounded-2xl">
                      <Wind className="w-6 h-6" />
                    </div>
                    <h2 className="text-xl font-black font-display text-white">{'Hábitos'}</h2>
                  </div>

                  <div className="space-y-6 flex-1">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                        <CloudOff className="w-3.5 h-3.5" /> {t('form.frequency')}
                      </label>
                      <input
                        type="number"
                        name="vapeFrequency"
                        value={formData.vapeFrequency}
                        onChange={handleChange}
                        className="w-full bg-slate-800/50 border border-white/10 rounded-2xl px-5 py-4 text-white focus:ring-2 focus:ring-cyan-500 transition-all outline-none font-bold"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5" /> {t('form.duration')}
                      </label>
                      <input
                        type="number"
                        name="vapeDurationMonths"
                        value={formData.vapeDurationMonths}
                        onChange={handleChange}
                        className="w-full bg-slate-800/50 border border-white/10 rounded-2xl px-5 py-4 text-white focus:ring-2 focus:ring-cyan-500 transition-all outline-none font-bold"
                        required
                      />
                    </div>

                    <div className="flex items-center gap-3 pt-2">
                      <div className="relative flex items-center">
                        <input
                          type="checkbox"
                          id="smokesCigarettes"
                          name="smokesCigarettes"
                          checked={formData.smokesCigarettes}
                          onChange={handleChange}
                          className="peer appearance-none w-6 h-6 border-2 border-white/20 rounded-lg bg-slate-800/50 checked:bg-cyan-500 checked:border-cyan-500 transition-all cursor-pointer"
                        />
                        <svg className="absolute w-4 h-4 text-white left-1 top-1 pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      </div>
                      <label htmlFor="smokesCigarettes" className="text-sm font-bold text-slate-300 cursor-pointer select-none">
                        También fumo cigarrillos
                      </label>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Motivation & Hobbies Section */}
              <motion.div 
                whileHover={{ y: -5 }}
                className="glass-morphism p-8 rounded-[2.5rem] space-y-8"
              >
                <div className="flex items-center gap-4 mb-2">
                  <div className="p-3 bg-indigo-500/20 text-indigo-400 rounded-2xl">
                    <Heart className="w-6 h-6" />
                  </div>
                  <h2 className="text-xl font-black font-display text-white">{t('form.motivation')}</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                      <Gamepad2 className="w-3.5 h-3.5" /> {t('form.hobbies')}
                    </label>
                    <textarea
                      name="hobbies"
                      value={formData.hobbies}
                      onChange={handleChange}
                      placeholder={t('form.placeholder.hobbies')}
                      className="w-full bg-slate-800/50 border border-white/10 rounded-2xl px-5 py-4 text-white focus:ring-2 focus:ring-indigo-500 transition-all outline-none font-medium h-28 resize-none leading-relaxed"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                      <Target className="w-3.5 h-3.5" /> {t('form.motivation')}
                    </label>
                    <textarea
                      name="motivation"
                      value={formData.motivation}
                      onChange={handleChange}
                      placeholder={t('form.placeholder.motivation')}
                      className="w-full bg-slate-800/50 border border-white/10 rounded-2xl px-5 py-4 text-white focus:ring-2 focus:ring-indigo-500 transition-all outline-none font-medium h-28 resize-none leading-relaxed"
                      required
                    />
                  </div>
                </div>
              </motion.div>

              <motion.button
                whileHover={{ scale: 1.01, y: -2 }}
                whileTap={{ scale: 0.99 }}
                type="submit"
                className="w-full bg-gradient-to-r from-emerald-500 via-cyan-500 to-indigo-500 text-white font-black py-6 rounded-[2rem] shadow-2xl shadow-emerald-500/20 flex items-center justify-center gap-4 text-lg uppercase tracking-[0.2em] group transition-all"
              >
                Continuar al Test de Adaptación
                <ChevronRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
              </motion.button>
            </motion.div>
          ) : (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <motion.div 
                whileHover={{ y: -5 }}
                className="glass-morphism p-8 rounded-[3rem] space-y-8"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-2xl">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <h2 className="text-xl font-black font-display text-white">Test de Adaptación Personalizada</h2>
                  </div>
                  <button 
                    type="button"
                    onClick={prevStep}
                    className="text-xs font-black text-slate-500 uppercase tracking-widest hover:text-white transition-colors"
                  >
                    Volver atrás
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">
                      1. ¿En qué momentos sientes más ganas de vapear?
                    </label>
                    <textarea
                      name="vapeTriggers"
                      value={formData.vapeTriggers}
                      onChange={handleChange}
                      placeholder="Ej: Al despertar, después de comer, con amigos..."
                      className="w-full bg-slate-800/50 border border-white/10 rounded-2xl px-5 py-4 text-white focus:ring-2 focus:ring-emerald-500 transition-all outline-none font-medium h-24 resize-none"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">
                      2. ¿Cuál es tu principal disparador emocional?
                    </label>
                    <select
                      name="dailyRoutine"
                      value={formData.dailyRoutine}
                      onChange={handleChange}
                      className="w-full bg-slate-800/50 border border-white/10 rounded-2xl px-5 py-4 text-white focus:ring-2 focus:ring-emerald-500 transition-all outline-none font-bold appearance-none"
                      required
                    >
                      <option value="">Selecciona una opción</option>
                      <option value="estres">Estrés laboral/estudios</option>
                      <option value="aburrimiento">Aburrimiento</option>
                      <option value="social">Presión social / Salidas</option>
                      <option value="ansiedad">Ansiedad general</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">
                      3. ¿Has intentado dejarlo antes? ¿Qué falló?
                    </label>
                    <textarea
                      name="previousAttempts"
                      value={formData.previousAttempts}
                      onChange={handleChange}
                      placeholder="Ej: Sí, duré 2 semanas pero recaí por estrés..."
                      className="w-full bg-slate-800/50 border border-white/10 rounded-2xl px-5 py-4 text-white focus:ring-2 focus:ring-emerald-500 transition-all outline-none font-medium h-24 resize-none"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">
                      4. Nivel de compromiso (1-10)
                    </label>
                    <div className="flex items-center gap-4">
                      <input
                        type="range"
                        name="commitmentLevel"
                        min="1"
                        max="10"
                        value={formData.commitmentLevel}
                        onChange={handleChange}
                        className="flex-1 accent-emerald-500"
                      />
                      <span className="text-2xl font-black text-emerald-400 w-8 text-center">{formData.commitmentLevel}</span>
                    </div>
                    <p className="text-[10px] text-slate-500 font-medium italic">Un mayor compromiso nos permite ser más exigentes con el plan.</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">
                      5. ¿Cuál es tu mayor miedo al dejarlo?
                    </label>
                    <textarea
                      name="biggestFear"
                      value={formData.biggestFear}
                      onChange={handleChange}
                      placeholder="Ej: Engordar, el mal humor, no saber qué hacer con las manos..."
                      className="w-full bg-slate-800/50 border border-white/10 rounded-2xl px-5 py-4 text-white focus:ring-2 focus:ring-emerald-500 transition-all outline-none font-medium h-24 resize-none"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">
                      6. ¿Cuándo vapeas más?
                    </label>
                    <select
                      name="socialVaping"
                      value={formData.socialVaping}
                      onChange={handleChange}
                      className="w-full bg-slate-800/50 border border-white/10 rounded-2xl px-5 py-4 text-white focus:ring-2 focus:ring-emerald-500 transition-all outline-none font-bold appearance-none"
                      required
                    >
                      <option value="alone">Cuando estoy solo/a</option>
                      <option value="social">En eventos sociales/con amigos</option>
                      <option value="both">En ambas situaciones por igual</option>
                    </select>
                  </div>
                </div>
              </motion.div>

              <motion.button
                whileHover={{ scale: 1.01, y: -2 }}
                whileTap={{ scale: 0.99 }}
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-emerald-500 via-cyan-500 to-indigo-500 text-white font-black py-6 rounded-[2rem] shadow-2xl shadow-emerald-500/20 flex items-center justify-center gap-4 text-lg uppercase tracking-[0.2em] group transition-all"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    {'Forjando tu Plan Maestro...'}
                  </>
                ) : (
                  <>
                    Generar Plan Adaptado
                    <ChevronRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
                  </>
                )}
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </form>
    </motion.div>
  );
}

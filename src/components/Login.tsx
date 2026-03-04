import React, { useState } from 'react';
import { motion } from 'motion/react';
import { CreditCard, Mail, Lock, Eye, EyeOff, ArrowRight, UserPlus } from 'lucide-react';
import { cn } from '../lib/utils';
import { translations, Language } from '../translations';
import { supabase } from '../lib/supabase';

interface LoginProps {
  onBack?: () => void;
  language?: Language;
}

export default function Login({ onBack, language = 'fr' }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const t = (key: string) => {
    return (translations[language] as any)[key] || key;
  };

  const isRTL = language === 'ar';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });
        if (signUpError) throw signUpError;
        alert(language === 'fr' ? 'Vérifiez votre email pour confirmer votre compte !' : 'تحقق من بريدك الإلكتروني لتأكيد حسابك!');
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn(
      "min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans",
      isRTL ? "text-right" : "text-left"
    )} dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="w-full max-w-[1000px] bg-white rounded-[40px] shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[600px] border border-slate-100">
        {/* Left Side - Visual */}
        <div className="hidden md:flex md:w-1/2 bg-brand-600 p-12 flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-white rounded-full blur-[100px]" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-brand-400 rounded-full blur-[100px]" />
          </div>

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-12">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/30 shadow-xl">
                <CreditCard className="text-white" size={24} />
              </div>
              <h1 className="text-2xl font-bold text-white tracking-tight">ChequePrime</h1>
            </div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h2 className="text-4xl font-bold text-white leading-tight mb-6">
                {t('manageChecksSimplicity')}
              </h2>
              <p className="text-brand-100 text-lg leading-relaxed max-w-md">
                {t('solutionDescription')}
              </p>
            </motion.div>
          </div>

          <div className="relative z-10">
            <div className="flex gap-2 mb-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className={cn("h-1.5 rounded-full bg-white/30", i === 1 ? "w-8 bg-white" : "w-2")} />
              ))}
            </div>
            <p className="text-brand-200 text-sm font-medium">© 2024 ChequePrime. All rights reserved.</p>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="w-full md:w-1/2 p-8 md:p-16 flex flex-col justify-center relative">
          {onBack && (
            <button 
              onClick={onBack}
              className={cn(
                "absolute top-8 text-slate-400 hover:text-brand-600 transition-colors flex items-center gap-2 text-sm font-bold",
                isRTL ? "right-8" : "left-8"
              )}
            >
              <ArrowRight size={18} className={cn("rotate-180", isRTL && "rotate-0")} />
              {language === 'fr' ? 'Retour' : 'رجوع'}
            </button>
          )}
          <div className="max-w-md mx-auto w-full">
            <div className="mb-10">
              <motion.h3 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-3xl font-bold text-slate-900 mb-2"
              >
                {isSignUp ? (language === 'fr' ? 'Créer un compte' : 'إنشاء حساب') : t('welcomeBack')}
              </motion.h3>
              <motion.p 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-slate-500"
              >
                {isSignUp ? (language === 'fr' ? 'Inscrivez-vous pour commencer' : 'سجل للبدء') : t('loginSubtitle')}
              </motion.p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-rose-50 border border-rose-100 text-rose-600 text-sm rounded-2xl font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block">
                  {t('email')}
                </label>
                <div className="relative group">
                  <div className={cn(
                    "absolute top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-500 transition-colors",
                    isRTL ? "right-4" : "left-4"
                  )}>
                    <Mail size={20} />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={cn(
                      "w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 text-sm focus:outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 transition-all",
                      isRTL ? "pr-12 pl-4" : "pl-12 pr-4"
                    )}
                    placeholder="admin@chequeprime.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block">
                    {t('password')}
                  </label>
                  {!isSignUp && (
                    <button type="button" className="text-xs font-bold text-brand-600 hover:text-brand-700 transition-colors">
                      {t('forgotPassword')}
                    </button>
                  )}
                </div>
                <div className="relative group">
                  <div className={cn(
                    "absolute top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-500 transition-colors",
                    isRTL ? "right-4" : "left-4"
                  )}>
                    <Lock size={20} />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={cn(
                      "w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 text-sm focus:outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 transition-all",
                      isRTL ? "pr-12 pl-12" : "pl-12 pr-12"
                    )}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={cn(
                      "absolute top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors",
                      isRTL ? "left-4" : "right-4"
                    )}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="remember"
                  className="w-4 h-4 text-brand-600 border-slate-300 rounded focus:ring-brand-500"
                  defaultChecked
                />
                <label htmlFor="remember" className="text-sm text-slate-600 cursor-pointer">
                  {t('rememberMe')}
                </label>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-brand-600 text-white rounded-2xl py-4 font-bold text-sm shadow-xl shadow-brand-200 hover:bg-brand-700 hover:shadow-brand-300 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed group"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    {isSignUp ? (language === 'fr' ? 'S\'inscrire' : 'تسجيل') : t('login')}
                    <ArrowRight size={18} className={cn("transition-transform group-hover:translate-x-1", isRTL && "rotate-180 group-hover:-translate-x-1")} />
                  </>
                )}
              </button>
            </form>

            <div className="mt-12 pt-8 border-t border-slate-100 text-center">
              <p className="text-slate-400 text-sm">
                {isSignUp ? (language === 'fr' ? 'Déjà un compte ?' : 'لديك حساب بالفعل؟') : t('noAccount')}
                <button 
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="text-brand-600 font-bold ml-1 hover:underline"
                >
                  {isSignUp ? (language === 'fr' ? 'Se connecter' : 'تسجيل الدخول') : (language === 'fr' ? 'S\'inscrire' : 'إنشاء حساب')}
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

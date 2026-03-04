import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CreditCard, 
  Shield, 
  Zap, 
  BarChart3, 
  CheckCircle2, 
  ArrowRight, 
  Globe, 
  Lock, 
  Smartphone,
  ChevronRight,
  Star
} from 'lucide-react';
import { cn } from './lib/utils';

interface LandingPageProps {
  onGetStarted: () => void;
  onLogin: () => void;
  language: 'fr' | 'ar';
}

export default function LandingPage({ onGetStarted, onLogin, language }: LandingPageProps) {
  const isRTL = language === 'ar';

  const t = (fr: string, ar: string) => language === 'fr' ? fr : ar;

  return (
    <div className={cn("min-h-screen bg-white font-sans text-slate-900", isRTL && "text-right")} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center shadow-lg shadow-brand-200">
                <CreditCard className="text-white" size={20} />
              </div>
              <span className="text-xl font-bold tracking-tight text-slate-900">ChequePrime</span>
            </div>
            
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm font-medium text-slate-600 hover:text-brand-600 transition-colors">
                {t('Fonctionnalités', 'المميزات')}
              </a>
              <a href="#how-it-works" className="text-sm font-medium text-slate-600 hover:text-brand-600 transition-colors">
                {t('Comment ça marche', 'كيف يعمل')}
              </a>
              <a href="#pricing" className="text-sm font-medium text-slate-600 hover:text-brand-600 transition-colors">
                {t('Tarifs', 'الأسعار')}
              </a>
            </div>

            <div className="flex items-center gap-4">
              <button 
                onClick={onLogin}
                className="text-sm font-bold text-slate-600 hover:text-brand-600 transition-colors px-4 py-2"
              >
                {t('Connexion', 'تسجيل الدخول')}
              </button>
              <button 
                onClick={onGetStarted}
                className="bg-brand-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-brand-200 hover:bg-brand-700 transition-all active:scale-95"
              >
                {t('Essai Gratuit', 'تجربة مجانية')}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-50 rounded-full blur-[120px] opacity-60" />
          <div className="absolute bottom-[10%] right-[-5%] w-[30%] h-[30%] bg-emerald-50 rounded-full blur-[100px] opacity-40" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-50 text-brand-600 text-xs font-bold uppercase tracking-widest mb-8">
              <Zap size={14} />
              {t('La gestion de chèques réinventée', 'إدارة الشيكات بحلة جديدة')}
            </span>
            <h1 className="text-5xl lg:text-7xl font-black text-slate-900 leading-[1.1] mb-8 tracking-tight">
              {t('Gérez vos chèques', 'إدارة شيكاتك')} <br />
              <span className="text-brand-600">{t('en toute sérénité.', 'بكل طمأنينة.')}</span>
            </h1>
            <p className="text-lg lg:text-xl text-slate-500 max-w-2xl mx-auto mb-12 leading-relaxed">
              {t(
                'La plateforme tout-en-un pour les entreprises marocaines. Suivez vos encaissements, gérez vos fournisseurs et ne ratez plus jamais une échéance.',
                'المنصة المتكاملة للمقاولات المغربية. تتبع تحصيلاتك، أدر مورديك ولا تفوت أي موعد استحقاق بعد الآن.'
              )}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button 
                onClick={onGetStarted}
                className="w-full sm:w-auto bg-brand-600 text-white px-8 py-4 rounded-2xl text-base font-bold shadow-2xl shadow-brand-200 hover:bg-brand-700 transition-all flex items-center justify-center gap-2 group"
              >
                {t('Démarrer maintenant', 'ابدأ الآن')}
                <ArrowRight size={20} className={cn("transition-transform group-hover:translate-x-1", isRTL && "rotate-180 group-hover:-translate-x-1")} />
              </button>
              <button className="w-full sm:w-auto bg-white text-slate-600 border border-slate-200 px-8 py-4 rounded-2xl text-base font-bold hover:bg-slate-50 transition-all">
                {t('Voir la démo', 'مشاهدة العرض')}
              </button>
            </div>
          </motion.div>

          {/* App Preview / Animation */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="mt-20 relative"
          >
            <div className="relative mx-auto max-w-5xl rounded-[32px] border border-slate-200 bg-white shadow-2xl overflow-hidden p-4 lg:p-8 min-h-[400px] lg:min-h-[500px] flex flex-col">
              {/* Mock Dashboard Header */}
              <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-100">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-slate-100 rounded-xl animate-pulse" />
                  <div className="space-y-2">
                    <div className="w-32 h-4 bg-slate-100 rounded-full animate-pulse" />
                    <div className="w-20 h-3 bg-slate-50 rounded-full animate-pulse" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="w-8 h-8 bg-slate-100 rounded-full animate-pulse" />
                  <div className="w-8 h-8 bg-slate-100 rounded-full animate-pulse" />
                </div>
              </div>

              {/* Mock Dashboard Content */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
                {/* Left Column - Stats */}
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <motion.div 
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + (i * 0.1) }}
                      className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50"
                    >
                      <div className="w-8 h-8 bg-white rounded-lg mb-3 shadow-sm" />
                      <div className="w-full h-2 bg-slate-200 rounded-full mb-2" />
                      <div className="w-2/3 h-2 bg-slate-100 rounded-full" />
                    </motion.div>
                  ))}
                </div>

                {/* Center Column - Animated Check Flow */}
                <div className="lg:col-span-2 relative bg-slate-50/30 rounded-3xl border border-dashed border-slate-200 p-6 flex flex-col items-center justify-center overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center opacity-20">
                    <div className="w-full h-px bg-gradient-to-r from-transparent via-brand-500 to-transparent" />
                  </div>

                  <AnimatePresence mode="popLayout">
                    <motion.div
                      key="active-check"
                      initial={{ y: 50, opacity: 0, scale: 0.8 }}
                      animate={{ y: 0, opacity: 1, scale: 1 }}
                      exit={{ y: -50, opacity: 0, scale: 0.8 }}
                      transition={{ 
                        duration: 2,
                        repeat: Infinity,
                        repeatDelay: 1
                      }}
                      className="relative z-10 w-full max-w-sm bg-white rounded-2xl shadow-xl border border-slate-100 p-6"
                    >
                      <div className="flex justify-between items-start mb-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-brand-200">
                            <CreditCard size={20} />
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('Chèque N°', 'شيك رقم')}</p>
                            <p className="text-sm font-bold text-slate-900">CHQ-2024-0892</p>
                          </div>
                        </div>
                        <motion.div 
                          animate={{ 
                            backgroundColor: ["#fef3c7", "#dcfce7"],
                            color: ["#d97706", "#16a34a"]
                          }}
                          transition={{ duration: 1, delay: 0.8 }}
                          className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-amber-50 text-amber-600"
                        >
                          {t('Traitement...', 'جاري المعالجة...')}
                        </motion.div>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="flex justify-between items-end">
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{t('Bénéficiaire', 'المستفيد')}</p>
                            <p className="text-sm font-semibold text-slate-700">Sidi Ali S.A.</p>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{t('Montant', 'المبلغ')}</p>
                            <p className="text-lg font-black text-brand-600">4,500.00 DH</p>
                          </div>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: "0%" }}
                            animate={{ width: "100%" }}
                            transition={{ duration: 1.5, ease: "easeInOut" }}
                            className="h-full bg-brand-500"
                          />
                        </div>
                      </div>
                    </motion.div>
                  </AnimatePresence>

                  {/* Background decorative elements */}
                  <div className="absolute top-4 left-4 w-24 h-24 bg-brand-500/5 rounded-full blur-2xl" />
                  <div className="absolute bottom-4 right-4 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl" />
                </div>
              </div>
            </div>
            {/* Floating Elements */}
            <div className="absolute -top-10 -right-10 hidden lg:block">
              <motion.div 
                animate={{ y: [0, -10, 0] }}
                transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                className="bg-white p-4 rounded-2xl shadow-xl border border-slate-100 flex items-center gap-3"
              >
                <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                  <CheckCircle2 size={20} />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t('Encaissé', 'تم التحصيل')}</p>
                  <p className="text-sm font-bold text-slate-900">12,450.00 DH</p>
                </div>
              </motion.div>
            </div>
            <div className="absolute -bottom-6 -left-10 hidden lg:block">
              <motion.div 
                animate={{ y: [0, 10, 0] }}
                transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
                className="bg-white p-4 rounded-2xl shadow-xl border border-slate-100 flex items-center gap-3"
              >
                <div className="w-10 h-10 bg-brand-50 text-brand-600 rounded-xl flex items-center justify-center">
                  <BarChart3 size={20} />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t('Croissance', 'النمو')}</p>
                  <p className="text-sm font-bold text-slate-900">+24% {t('ce mois', 'هذا الشهر')}</p>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-6">
              {t('Tout ce dont vous avez besoin pour gérer votre trésorerie', 'كل ما تحتاجه لإدارة سيولتك النقدية')}
            </h2>
            <p className="text-slate-500 text-lg">
              {t(
                'Oubliez les fichiers Excel et les carnets de notes. ChequePrime automatise votre suivi bancaire.',
                'انسَ ملفات Excel ودفاتر الملاحظات. ChequePrime يقوم بأتمتة تتبعك البنكي.'
              )}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Shield,
                title: t('Sécurité Maximale', 'أمان أقصى'),
                desc: t('Vos données sont chiffrées et stockées en toute sécurité sur nos serveurs.', 'بياناتك مشفرة ومخزنة بأمان على خوادمنا.'),
                color: 'bg-blue-50 text-blue-600'
              },
              {
                icon: Zap,
                title: t('Alertes en Temps Réel', 'تنبيهات فورية'),
                desc: t('Recevez des notifications avant chaque échéance pour éviter les impayés.', 'تلقَ إشعارات قبل كل موعد استحقاق لتجنب عدم الدفع.'),
                color: 'bg-amber-50 text-amber-600'
              },
              {
                icon: BarChart3,
                title: t('Analyses Détaillées', 'تحليلات مفصلة'),
                desc: t('Visualisez votre flux de trésorerie avec des graphiques intuitifs.', 'شاهد تدفقك النقدي من خلال رسوم بيانية بديهية.'),
                color: 'bg-emerald-50 text-emerald-600'
              },
              {
                icon: Globe,
                title: t('Multi-Langues', 'متعدد اللغات'),
                desc: t('Une interface disponible en Français et en Arabe pour toute votre équipe.', 'واجهة متاحة بالفرنسية والعربية لجميع أفراد فريقك.'),
                color: 'bg-purple-50 text-purple-600'
              },
              {
                icon: Lock,
                title: t('Gestion des Droits', 'إدارة الصلاحيات'),
                desc: t('Contrôlez qui peut voir ou modifier les informations sensibles.', 'تحكم في من يمكنه رؤية أو تعديل المعلومات الحساسة.'),
                color: 'bg-rose-50 text-rose-600'
              },
              {
                icon: Smartphone,
                title: t('Accès Mobile', 'وصول عبر الهاتف'),
                desc: t('Gérez vos chèques où que vous soyez, depuis votre smartphone ou tablette.', 'أدر شيكاتك أينما كنت، من هاتفك الذكي أو جهازك اللوحي.'),
                color: 'bg-brand-50 text-brand-600'
              }
            ].map((feature, i) => (
              <motion.div
                key={i}
                whileHover={{ y: -5 }}
                className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-xl transition-all"
              >
                <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center mb-6", feature.color)}>
                  <feature.icon size={28} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-4">{feature.title}</h3>
                <p className="text-slate-500 leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-24 bg-brand-600 text-white overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
          <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-white rounded-full blur-[150px]" />
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-12 text-center">
            {[
              { label: t('Utilisateurs Actifs', 'مستخدم نشط'), value: '2,500+' },
              { label: t('Chèques Gérés', 'شيك مدار'), value: '150K+' },
              { label: t('Volume de Transactions', 'حجم المعاملات'), value: '2B+ DH' },
              { label: t('Satisfaction Client', 'رضا العملاء'), value: '99.9%' }
            ].map((stat, i) => (
              <div key={i}>
                <p className="text-4xl lg:text-5xl font-black mb-2 tracking-tight">{stat.value}</p>
                <p className="text-brand-100 font-medium uppercase tracking-widest text-xs">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">{t('Ils nous font confiance', 'يثقون بنا')}</h2>
            <div className="flex justify-center gap-1">
              {[1, 2, 3, 4, 5].map(i => <Star key={i} className="text-amber-400 fill-amber-400" size={20} />)}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: 'Ahmed Benani',
                role: 'CEO, TechMaroc',
                content: t(
                  'ChequePrime a radicalement changé notre façon de gérer les paiements. Plus aucun oubli, plus aucun stress.',
                  'لقد غير ChequePrime جذريًا طريقتنا في إدارة المدفوعات. لا مزيد من النسيان، لا مزيد من التوتر.'
                )
              },
              {
                name: 'Sara El Fassi',
                role: 'Directrice Financière',
                content: t(
                  'L\'interface en arabe est un vrai plus pour nos équipes comptables. Simple, efficace et sécurisé.',
                  'الواجهة باللغة العربية إضافة حقيقية لفرق المحاسبة لدينا. بسيطة وفعالة وآمنة.'
                )
              },
              {
                name: 'Youssef Mansouri',
                role: 'Entrepreneur',
                content: t(
                  'Le meilleur investissement pour ma petite entreprise. Je gagne des heures chaque semaine sur mon suivi bancaire.',
                  'أفضل استثمار لمقاولتي الصغيرة. أوفر ساعات كل أسبوع في تتبعي البنكي.'
                )
              }
            ].map((testimonial, i) => (
              <div key={i} className="bg-slate-50 p-8 rounded-[32px] border border-slate-100">
                <p className="text-slate-600 italic mb-8 leading-relaxed">"{testimonial.content}"</p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-brand-200 flex items-center justify-center text-brand-700 font-bold">
                    {testimonial.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">{testimonial.name}</p>
                    <p className="text-xs text-slate-400 font-medium uppercase tracking-widest">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-slate-900 rounded-[48px] p-8 lg:p-20 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-full h-full opacity-20 pointer-events-none">
              <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-brand-500 rounded-full blur-[120px]" />
            </div>
            
            <div className="relative z-10 max-w-3xl mx-auto">
              <h2 className="text-4xl lg:text-6xl font-bold text-white mb-8 leading-tight">
                {t('Prêt à simplifier votre gestion ?', 'هل أنت مستعد لتبسيط إدارتك؟')}
              </h2>
              <p className="text-slate-400 text-lg lg:text-xl mb-12">
                {t(
                  'Rejoignez des milliers d\'entreprises qui font confiance à ChequePrime pour leur suivi bancaire.',
                  'انضم إلى آلاف المقاولات التي تثق في ChequePrime لتتبعها البنكي.'
                )}
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <button 
                  onClick={onGetStarted}
                  className="w-full sm:w-auto bg-brand-600 text-white px-10 py-5 rounded-2xl text-lg font-bold hover:bg-brand-700 transition-all shadow-2xl shadow-brand-900/50"
                >
                  {t('Commencer gratuitement', 'ابدأ مجانًا')}
                </button>
                <button className="w-full sm:w-auto bg-white/10 text-white backdrop-blur-md border border-white/20 px-10 py-5 rounded-2xl text-lg font-bold hover:bg-white/20 transition-all">
                  {t('Contacter un expert', 'اتصل بخبير')}
                </button>
              </div>
              <p className="mt-8 text-slate-500 text-sm">
                {t('Aucune carte bancaire requise • Essai gratuit de 14 jours', 'لا يلزم بطاقة بنكية • تجربة مجانية لمدة 14 يومًا')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-100 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
                <CreditCard className="text-white" size={16} />
              </div>
              <span className="text-lg font-bold tracking-tight text-slate-900">ChequePrime</span>
            </div>
            
            <div className="flex flex-wrap justify-center gap-8 text-sm font-medium text-slate-500">
              <a href="#" className="hover:text-brand-600 transition-colors">{t('À propos', 'عن الشركة')}</a>
              <a href="#" className="hover:text-brand-600 transition-colors">{t('Confidentialité', 'الخصوصية')}</a>
              <a href="#" className="hover:text-brand-600 transition-colors">{t('Conditions', 'الشروط')}</a>
              <a href="#" className="hover:text-brand-600 transition-colors">{t('Contact', 'اتصل بنا')}</a>
            </div>

            <p className="text-slate-400 text-sm">
              © 2024 ChequePrime. {t('Tous droits réservés.', 'جميع الحقوق محفوظة.')}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

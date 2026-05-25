import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, FileText, Calendar, MessageSquare } from 'lucide-react';
import { Check } from '../types';
import { generateChecksPDF } from '../lib/pdfGenerator';
import { Language } from '../translations';

interface PDFReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  checks: Check[];
  type: 'client' | 'supplier';
  t: (key: string) => string;
  language: Language;
}

const MONTH_OPTIONS = [
  { value: 'all', labelKey: 'allYear' },
  { value: '01', label: 'Janvier' },
  { value: '02', label: 'Février' },
  { value: '03', label: 'Mars' },
  { value: '04', label: 'Avril' },
  { value: '05', label: 'Mai' },
  { value: '06', label: 'Juin' },
  { value: '07', label: 'Juillet' },
  { value: '08', label: 'Août' },
  { value: '09', label: 'Septembre' },
  { value: '10', label: 'Octobre' },
  { value: '11', label: 'Novembre' },
  { value: '12', label: 'Décembre' }
];

const MONTH_OPTIONS_AR = [
  { value: 'all', labelKey: 'allYear' },
  { value: '01', label: 'يناير' },
  { value: '02', label: 'فبراير' },
  { value: '03', label: 'مارس' },
  { value: '04', label: 'أبريل' },
  { value: '05', label: 'ماي' },
  { value: '06', label: 'يونيو' },
  { value: '07', label: 'يوليوز' },
  { value: '08', label: 'غشت' },
  { value: '09', label: 'شتمبر' },
  { value: '10', label: 'أكتوبر' },
  { value: '11', label: 'نونبر' },
  { value: '12', label: 'دجنبر' }
];

const YEAR_OPTIONS = ['2024', '2025', '2026', '2027'];

export const PDFReportModal: React.FC<PDFReportModalProps> = ({
  isOpen,
  onClose,
  checks,
  type,
  t,
  language
}) => {
  const [selectedMonth, setSelectedMonth] = useState('05'); // Default to May
  const [selectedYear, setSelectedYear] = useState('2026'); // Default to current system year

  if (!isOpen) return null;

  const isRTL = language === 'ar';
  const monthList = isRTL ? MONTH_OPTIONS_AR : MONTH_OPTIONS;

  // Filter count for preview
  const previewCount = checks.filter(c => {
    if (c.type !== type) return false;
    if (!c.dueDate) return false;
    const dateParts = c.dueDate.split('-'); // YYYY-MM-DD
    if (dateParts.length < 2) return false;
    const checkYear = dateParts[0];
    const checkMonth = dateParts[1];

    const matchYear = selectedYear === 'all' || checkYear === selectedYear;
    const matchMonth = selectedMonth === 'all' || checkMonth === selectedMonth;

    return matchYear && matchMonth;
  });

  const handleDownload = () => {
    // Generate pdf from parameters
    const checksOfType = checks.filter(c => c.type === type);
    const pdf = generateChecksPDF({
      checks: checksOfType,
      type,
      month: selectedMonth,
      year: selectedYear,
      language
    });
    pdf.doc.save(pdf.filename);
    onClose();
  };

  const handleShareWhatsApp = async () => {
    const checksOfType = checks.filter(c => c.type === type);
    const pdf = generateChecksPDF({
      checks: checksOfType,
      type,
      month: selectedMonth,
      year: selectedYear,
      language
    });

    const file = new File([pdf.blob], pdf.filename, { type: 'application/pdf' });

    // Use Web Share API if supported for direct PDF file sharing (ideal for mobiles / WhatsApp)
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: pdf.filename,
          text: `${t('shareWhatsAppText')} ${pdf.periodStr}`
        });
        onClose();
        return;
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.error('Share via Web Share API failed', err);
        } else {
          // User cancelled the share sheet, so just stop here
          return;
        }
      }
    }

    // Fallback if direct file sharing is unsupported (like on some WebViews or desktop browsers):
    // Download the PDF automatically and open WhatsApp with a beautiful text summary!
    pdf.doc.save(pdf.filename);

    const formattedTotalAmount = Math.round(pdf.totalAmount).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

    let whatsAppText = '';
    if (language === 'ar') {
      whatsAppText = `${t('shareWhatsAppText')} *${pdf.periodStr}*\n\n` +
        `📊 *ملخص التقرير*:\n` +
        `• *عدد الشيكات*: ${pdf.count}\n` +
        `• *المجموع الإجمالي*: ${formattedTotalAmount} درهم بنكي\n\n` +
        `_(تم تحميل ملف الـ PDF تلقائياً بنجاح على جهازك لتقديمه)_`;
    } else {
      whatsAppText = `${t('shareWhatsAppText')} *${pdf.periodStr}*\n\n` +
        `📊 *Résumé du rapport*:\n` +
        `• *Nombre de chèques*: ${pdf.count}\n` +
        `• *Montant Total*: ${formattedTotalAmount} DH\n\n` +
        `_(Le rapport PDF complet a été téléchargé sur votre appareil)_`;
    }

    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(whatsAppText)}`;
    window.open(whatsappUrl, '_blank');
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white w-full max-w-md rounded-[32px] shadow-2xl overflow-hidden flex flex-col"
          dir={isRTL ? 'rtl' : 'ltr'}
        >
          {/* Header */}
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center">
                <FileText size={20} />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 tracking-tight">
                  {t('downloadReportPdf')}
                </h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                  {type === 'client' ? t('clientChecks') : t('supplierChecks')}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all"
            >
              <X size={18} />
            </button>
          </div>

          {/* Form */}
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              {/* Month Selector */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  {t('month')}
                </label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all appearance-none cursor-pointer"
                >
                  {monthList.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.labelKey ? t(m.labelKey) : m.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Year Selector */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  {t('year')}
                </label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all appearance-none cursor-pointer"
                >
                  {YEAR_OPTIONS.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Preview Box */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-brand-50 text-brand-600 rounded-lg flex items-center justify-center">
                  <Calendar size={16} />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-700">
                    {previewCount.length} {t('checks').toLowerCase()}
                  </p>
                  <p className="text-[10px] text-slate-400 font-medium">
                    {previewCount.reduce((a, b) => a + b.amount, 0).toLocaleString()} DH total
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-slate-100 flex flex-col gap-3">
            {/* WhatsApp main option (vibrant green, perfect touch target) */}
            <button
              onClick={handleShareWhatsApp}
              className="w-full px-4 py-3 bg-emerald-600 text-white text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-emerald-700 active:scale-[0.98] transition-all shadow-lg shadow-emerald-200 flex items-center justify-center gap-2"
            >
              <MessageSquare size={16} />
              {t('shareWhatsApp')}
            </button>

            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-3 bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-slate-100 transition-all"
              >
                {t('cancel')}
              </button>
              <button
                onClick={handleDownload}
                className="flex-1 px-4 py-3 bg-rose-600 text-white text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-rose-700 active:scale-[0.98] transition-all shadow-lg shadow-rose-200 flex items-center justify-center gap-2"
              >
                <FileText size={16} />
                {t('generatePdf')}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

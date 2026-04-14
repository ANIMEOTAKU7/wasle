import React from 'react';
import { motion } from 'motion/react';

export default function PrivacyPolicyScreen({ onBack }: { onBack: () => void }) {
  return (
    <div className="flex flex-col min-h-[100dvh] max-w-[390px] mx-auto w-full relative bg-background overflow-hidden text-on-surface">
      {/* Top AppBar */}
      <header className="w-full top-0 sticky flex items-center justify-between px-6 h-20 bg-background/90 backdrop-blur-md z-50 border-b border-outline-variant shrink-0">
        <div className="flex items-center">
          <button onClick={onBack} className="w-10 h-10 rounded-xl bg-surface-container-high flex items-center justify-center hover:bg-surface-container-highest transition-all active:scale-95 border border-outline-variant text-on-surface-variant hover:text-on-surface">
            <span className="material-symbols-outlined text-xl rtl:rotate-180">arrow_back</span>
          </button>
        </div>
        <div className="flex flex-col items-center">
          <h1 className="font-bold text-sm text-on-surface tracking-tight">سياسة الخصوصية</h1>
          <span className="text-[9px] text-primary font-bold uppercase tracking-[0.2em]">Privacy Policy</span>
        </div>
        <div className="w-10"></div>
      </header>

      <main className="flex-1 px-6 py-8 w-full flex flex-col relative z-10 overflow-y-auto custom-scrollbar">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8 pb-10"
        >
          {/* Intro */}
          <section className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-4">
              <span className="material-symbols-outlined text-2xl">policy</span>
            </div>
            <h2 className="text-xl font-bold text-on-surface">نحن نحترم خصوصيتك</h2>
            <p className="text-sm text-on-surface-variant leading-relaxed font-medium">
              تم إعداد سياسة الخصوصية هذه لتوضيح كيفية جمعنا لبياناتك، استخدامها، وحمايتها، بما يتوافق مع القوانين المحلية (مثل قانون حماية البيانات الشخصية الأردني PDPL) والعالمية (مثل GDPR).
            </p>
          </section>

          {/* Data Collection */}
          <section className="space-y-3 bg-surface-container-low p-5 rounded-3xl border border-outline-variant">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-primary">database</span>
              <h3 className="font-bold text-on-surface">1. البيانات التي نجمعها</h3>
            </div>
            <ul className="space-y-2 text-sm text-on-surface-variant leading-relaxed list-disc list-inside marker:text-primary/50">
              <li><strong className="text-on-surface">معلومات الحساب:</strong> البريد الإلكتروني، الاسم المستعار، كلمة المرور (مشفرة).</li>
              <li><strong className="text-on-surface">بيانات الملف الشخصي:</strong> الصورة الشخصية، النبذة، والاهتمامات.</li>
              <li><strong className="text-on-surface">المحتوى:</strong> المقتطفات (المنشورات)، التعليقات، والرسائل الخاصة.</li>
              <li><strong className="text-on-surface">بيانات الاستخدام:</strong> سجل التفاعلات والإعجابات لتحسين تجربتك.</li>
            </ul>
          </section>

          {/* Data Usage */}
          <section className="space-y-3 bg-surface-container-low p-5 rounded-3xl border border-outline-variant">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-primary">psychology</span>
              <h3 className="font-bold text-on-surface">2. كيف نستخدم بياناتك؟</h3>
            </div>
            <p className="text-sm text-on-surface-variant leading-relaxed">
              نستخدم بياناتك حصرياً للأغراض التالية:
            </p>
            <ul className="space-y-2 text-sm text-on-surface-variant leading-relaxed list-disc list-inside marker:text-primary/50">
              <li>تقديم خدمات التطبيق الأساسية (المطابقة، المحادثات، النشر).</li>
              <li>تخصيص المحتوى واقتراح أشخاص يشاركونك نفس الاهتمامات.</li>
              <li>الحفاظ على أمان المجتمع عبر أنظمة الإشراف على المحتوى (Content Moderation).</li>
            </ul>
          </section>

          {/* User Rights */}
          <section className="space-y-3 bg-surface-container-low p-5 rounded-3xl border border-outline-variant">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-primary">gavel</span>
              <h3 className="font-bold text-on-surface">3. حقوقك (Privacy by Design)</h3>
            </div>
            <p className="text-sm text-on-surface-variant leading-relaxed">
              أنت تملك السيطرة الكاملة على بياناتك:
            </p>
            <ul className="space-y-3 text-sm text-on-surface-variant leading-relaxed mt-2">
              <li className="flex gap-2 items-start">
                <span className="material-symbols-outlined text-[16px] text-primary mt-0.5">delete</span>
                <span><strong>الحق في الحذف:</strong> يمكنك حذف حسابك وكافة بياناتك نهائياً من قسم "الأمان والخصوصية".</span>
              </li>
              <li className="flex gap-2 items-start">
                <span className="material-symbols-outlined text-[16px] text-primary mt-0.5">download</span>
                <span><strong>الحق في الوصول:</strong> يمكنك طلب نسخة من بياناتك في أي وقت (قريباً).</span>
              </li>
              <li className="flex gap-2 items-start">
                <span className="material-symbols-outlined text-[16px] text-primary mt-0.5">edit</span>
                <span><strong>الحق في التعديل:</strong> يمكنك تصحيح معلومات ملفك الشخصي متى شئت.</span>
              </li>
            </ul>
          </section>

          {/* Security */}
          <section className="space-y-3 bg-surface-container-low p-5 rounded-3xl border border-outline-variant">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-primary">shield_locked</span>
              <h3 className="font-bold text-on-surface">4. أمان البيانات</h3>
            </div>
            <p className="text-sm text-on-surface-variant leading-relaxed">
              نحن نستخدم أحدث تقنيات التشفير لحماية بياناتك. يتم تخزين كلمات المرور بشكل مشفر (Hashed)، ونطبق سياسات وصول صارمة (Row Level Security) لضمان عدم وصول أي شخص لبياناتك الخاصة.
            </p>
          </section>

          {/* Contact */}
          <section className="space-y-3 bg-primary/5 p-5 rounded-3xl border border-primary/20">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-primary">support_agent</span>
              <h3 className="font-bold text-primary">5. التواصل معنا</h3>
            </div>
            <p className="text-sm text-on-surface-variant leading-relaxed">
              إذا كان لديك أي استفسار حول خصوصيتك أو ترغب في ممارسة حقوقك، يرجى التواصل مع مسؤول حماية البيانات (DPO) عبر:
            </p>
            <div className="mt-2 inline-flex items-center gap-2 px-4 py-2 bg-background rounded-xl border border-outline-variant">
              <span className="material-symbols-outlined text-[16px] text-on-surface-variant">mail</span>
              <span className="text-sm font-bold text-on-surface" dir="ltr">privacy@wasel.app</span>
            </div>
          </section>

          <div className="pt-6 text-center">
            <p className="text-xs text-on-surface-variant font-medium">
              آخر تحديث: {new Date().toLocaleDateString('ar-SA')}
            </p>
          </div>
        </motion.div>
      </main>
    </div>
  );
}

// ==================================================================
// =================== ملف config.js (نسخة Supabase) ================
// ==================================================================
// يحتوي هذا الملف على إعدادات Supabase والمتغيرات الثابتة للتطبيق.

// --- 1. تهيئة Supabase ---
// استيراد مكتبة Supabase من شبكة توصيل المحتوى (CDN)
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

// استبدل هذه القيم بالقيم الخاصة بمشروعك في Supabase
// يمكنك العثور عليها في لوحة التحكم: Project Settings > API

const supabaseUrl = 'https://vbmcyxemoykdeswxqaoi.supabase.co'; // الصق هنا Project URL
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZibWN5eGVtb3lrZGVzd3hxYW9pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYwMjY0NzksImV4cCI6MjA3MTYwMjQ3OX0.vl39FLZdzIsCbv1a9L36V5YkrAWUL0kyaAYD0KCf9VY'; // الصق هنا anon public key

// إنشاء وتصدير عميل Supabase لاستخدامه في جميع أنحاء التطبيق
export const supabase = createClient(supabaseUrl, supabaseAnonKey);


// --- 2. ثوابت وإعدادات التطبيق ---

// تعريف الإنجازات
export const achievements = {
    'first_test': { title: "الخطوة الأولى", description: "أكملت أول اختبار لك بنجاح!" },
    'ten_tests': { title: "مثابر", description: "أكملت 10 اختبارات." },
    'perfect_score': { title: "إتقان", description: "حصلت على درجة كاملة في اختبار." },
    'first_purchase': { title: "داعم المعرفة", description: "قمت بأول عملية شراء من المتجر." }
};

// تعريف فترات المراجعة بالأيام (لنظام التكرار المتباعد)
export const reviewIntervals = {
    0: 1,  // المستوى 0 -> المراجعة بعد يوم
    1: 2,  // المستوى 1 -> المراجعة بعد يومين
    2: 4,  // المستوى 2 -> المراجعة بعد 4 أيام
    3: 7,  // المستوى 3 -> المراجعة بعد أسبوع
    4: 14, // المستوى 4 -> المراجعة بعد أسبوعين
    5: 30, // المستوى 5 -> المراجعة بعد شهر
    6: 90, // المستوى 6 -> المراجعة بعد 3 أشهر
    7: 180,// المستوى 7 -> المراجعة بعد 6 أشهر
    8: 365 // المستوى 8 -> المراجعة بعد سنة
};

// أسماء أنواع الأسئلة للعرض في الواجهة
export const questionTypeNames = {
    'complete_ayah': 'إكمال آية',
    'order_words': 'ترتيب كلمات',
    'order_ayahs': 'ترتيب آيات',
    'audio_next_ayah': 'تحديد الآية التالية (صوتي)',
    'multiple_choice': 'اختيار من متعدد (مخصص)'
};
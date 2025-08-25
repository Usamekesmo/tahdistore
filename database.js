// ==================================================================
// =================== ملف database.js (نسخة Supabase) =============
// ==================================================================
// يحتوي هذا الملف على جميع الدوال التي تتفاعل مع قاعدة بيانات Supabase (PostgreSQL)

import { supabase } from './config.js';

/**
 * إنشاء ملف شخصي جديد لمستخدم جديد في جدول 'profiles'.
 * يتم استدعاء هذه الدالة بعد تأكيد إنشاء حساب المستخدم في نظام المصادقة.
 * @param {object} user - كائن المستخدم من Supabase Auth.
 * @returns {Promise<object|null>} بيانات الملف الشخصي الجديد أو null في حالة الخطأ.
 */
export async function createNewUserProfile(user) {
    const { data, error } = await supabase
        .from('profiles')
        .insert([
            {
                id: user.id,
                email: user.email,
                // استرداد اسم المستخدم من البيانات الوصفية التي تم تمريرها أثناء التسجيل
                username: user.user_metadata.username || 'مستخدم جديد'
            }
        ])
        .select()
        .single(); // .single() لإرجاع كائن واحد بدلاً من مصفوفة

    if (error) {
        console.error("خطأ في إنشاء ملف المستخدم الشخصي:", error);
        return null;
    }
    return data;
}

/**
 * تحميل بيانات الملف الشخصي للمستخدم من جدول 'profiles'.
 * @param {string} uid - معرف المستخدم.
 * @returns {Promise<object|null>} كائن بيانات المستخدم أو null إذا لم يوجد.
 */
export async function loadUserData(uid) {
    const { data, error } = await supabase
        .from('profiles')
        .select('*') // '*' لجلب جميع الأعمدة
        .eq('id', uid) // eq = equals (يساوي)
        .single(); // نتوقع نتيجة واحدة فقط

    if (error) {
        // هذا الخطأ متوقع إذا كان المستخدم جديدًا ولم يتم إنشاء ملفه الشخصي بعد
        if (error.code !== 'PGRST116') { // PGRST116: "The result contains 0 rows"
             console.error("خطأ في تحميل بيانات المستخدم:", error);
        }
        return null;
    }
    return data;
}

/**
 * حفظ (تحديث) بيانات المستخدم الحالية في جدول 'profiles'.
 * @param {object} currentUser - كائن المستخدم الحالي الذي يحتوي على التعديلات.
 */
export async function saveUserData(currentUser) {
    if (!currentUser || !currentUser.id) return;

    const dataToSave = { ...currentUser };
    dataToSave.last_activity = new Date().toISOString();

    // في Supabase، لا نحتاج لحذف المعرف (id) لأنه يستخدم في شرط 'eq'
    const { error } = await supabase
        .from('profiles')
        .update(dataToSave)
        .eq('id', currentUser.id);

    if (error) {
        console.error("خطأ في تحديث بيانات المستخدم:", error);
    }
}

/**
 * جلب جميع منتجات المتجر من جدول 'store_items'.
 * @returns {Promise<Array>} مصفوفة تحتوي على جميع منتجات المتجر.
 */
export async function fetchStoreItems() {
    const { data, error } = await supabase
        .from('store_items')
        .select('*');

    if (error) {
        console.error("فشل في تحميل بضائع المتجر:", error);
        return [];
    }
    return data;
}

/**
 * جلب الآيات لصفحة معينة (هذه الدالة لا تتغير لأنها تعتمد على API خارجي).
 * @param {number} pageNumber - رقم الصفحة.
 * @returns {Promise<Array>} مصفوفة من كائنات الآيات.
 */
export async function getAyahsByPage(pageNumber) {
    try {
        // استخدام واجهة برمجة تطبيقات موثوقة ومفتوحة
        const response = await fetch(`https://api.alquran.cloud/v1/page/${pageNumber}/quran-uthmani`);
        const data = await response.json();
        if (data.code === 200 && data.data && data.data.ayahs) {
            return data.data.ayahs.map(a => ({
                text: a.text,
                page: pageNumber,
                numberInSurah: a.numberInSurah,
                number: a.number, // الرقم العالمي للآية
                surah: a.surah
            }));
        }
        return [];
    } catch (error) {
        console.error(`فشل في جلب آيات الصفحة ${pageNumber}:`, error);
        return [];
    }
}

/**
 * يتحقق مما إذا كان حساب المستخدم محظوراً.
 * @param {string} uid - معرف المستخدم.
 * @returns {Promise<boolean>} `true` إذا كان المستخدم محظوراً، وإلا `false`.
 */
export async function checkUserBlockedStatus(uid) {
    const { data, error } = await supabase
        .from('profiles')
        .select('is_blocked')
        .eq('id', uid)
        .single();

    if (error) {
        console.error("فشل التحقق من حالة حظر المستخدم:", error);
        return false; // افتراضياً غير محظور عند حدوث خطأ
    }
    return data ? data.is_blocked : false;
}



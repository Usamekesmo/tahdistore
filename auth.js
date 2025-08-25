// ==================================================================
// =================== ملف auth.js (نسخة Supabase) =================
// ==================================================================
// يحتوي هذا الملف على كل ما يتعلق بمصادقة المستخدم باستخدام Supabase.

import { supabase } from './config.js';
import * as UI from './ui.js';

// متغير لتتبع حالة النموذج (تسجيل دخول أو إنشاء حساب)
let isSignupMode = false;

/**
 * ترجمة رسائل الخطأ من Supabase إلى رسائل مفهومة للمستخدم.
 * @param {Error} error - كائن الخطأ من Supabase.
 * @returns {string} الرسالة المترجمة باللغة العربية.
 */
function translateAuthError(error) {
    if (!error || !error.message) {
        return 'حدث خطأ غير متوقع. الرجاء المحاولة مرة أخرى.';
    }
    
    const message = error.message.toLowerCase();
    
    if (message.includes("invalid login credentials")) {
        return "البريد الإلكتروني أو كلمة المرور غير صحيحة.";
    }
    if (message.includes("user already registered")) {
        return "هذا البريد الإلكتروني مستخدم بالفعل في حساب آخر.";
    }
    if (message.includes("password should be at least 6 characters")) {
        return "كلمة المرور ضعيفة جداً. يجب أن تتكون من 6 أحرف على الأقل.";
    }
    if (message.includes("unable to validate email address")) {
        return "البريد الإلكتروني الذي أدخلته غير صالح.";
    }
    
    // رسالة خطأ عامة في حالة عدم التعرف على الخطأ المحدد
    return 'حدث خطأ. الرجاء التحقق من البيانات المدخلة والمحاولة مرة أخرى.';
}

/**
 * تحديث واجهة نموذج المصادقة بناءً على الوضع الحالي (دخول/إنشاء).
 */
function updateAuthFormUI() {
    UI.authError.style.display = 'none';
    UI.emailInput.value = '';
    UI.passwordInput.value = '';
    UI.usernameInput.value = '';

    if (isSignupMode) {
        UI.authFormTitle.textContent = 'أنشئ حساباً جديداً للبدء';
        UI.usernameInput.style.display = 'block';
        UI.authActionButton.textContent = 'إنشاء حساب';
        UI.authToggleMessage.innerHTML = 'لديك حساب بالفعل؟ <a href="#" id="toggle-to-login">سجل الدخول</a>';
        // التأكد من أن المستمع مربوط بشكل صحيح
        const toggleLink = document.getElementById('toggle-to-login');
        if (toggleLink) {
            toggleLink.addEventListener('click', toggleAuthMode);
        }
    } else {
        UI.authFormTitle.textContent = 'الرجاء تسجيل الدخول للمتابعة';
        UI.usernameInput.style.display = 'none';
        UI.authActionButton.textContent = 'تسجيل الدخول';
        UI.authToggleMessage.innerHTML = 'ليس لديك حساب؟ <a href="#" id="toggle-to-signup">أنشئ حساباً جديداً</a>';
        // التأكد من أن المستمع مربوط بشكل صحيح
        const toggleLink = document.getElementById('toggle-to-signup');
        if (toggleLink) {
            toggleLink.addEventListener('click', toggleAuthMode);
        }
    }
}

/**
 * التبديل بين وضع تسجيل الدخول ووضع إنشاء حساب جديد.
 * @param {Event} e - كائن الحدث.
 */
function toggleAuthMode(e) {
    if (e) e.preventDefault();
    isSignupMode = !isSignupMode;
    updateAuthFormUI();
}

/**
 * التعامل مع إجراء المصادقة (تسجيل الدخول أو إنشاء حساب).
 */
async function handleAuthAction() {
    const email = UI.emailInput.value.trim();
    const password = UI.passwordInput.value.trim();
    const username = UI.usernameInput.value.trim();

    if (email === "" || password === "") {
        UI.authError.textContent = "الرجاء إدخال البريد الإلكتروني وكلمة المرور.";
        UI.authError.style.display = 'block';
        return;
    }
    if (isSignupMode && username === "") {
        UI.authError.textContent = "الرجاء إدخال اسم المستخدم.";
        UI.authError.style.display = 'block';
        return;
    }

    UI.authActionButton.disabled = true;
    UI.authActionButton.textContent = 'جارٍ التنفيذ...';
    UI.authError.style.display = 'none';

    try {
        // ... داخل دالة handleAuthAction ...

// --- أضف هذا الجزء للتشخيص ---
console.log("البيانات التي سيتم إرسالها إلى Supabase:");
console.log("Email:", email);
console.log("Password:", password);
console.log("Username (in signup mode):", username);
// ---------------------------------

try {
    let response;
    if (isSignupMode) {
// ... بقية الكود ...
        let response;
        if (isSignupMode) {
            // --- وضع إنشاء حساب جديد ---
            response = await supabase.auth.signUp({
                email: email,
                password: password,
                options: {
                    // نخزن اسم المستخدم في البيانات الوصفية ليتم استخدامه
                    // عند إنشاء الملف الشخصي في قاعدة البيانات.
                    data: {
                        username: username
                    }
                }
            });
        } else {
            // --- وضع تسجيل الدخول ---
            response = await supabase.auth.signInWithPassword({
                email: email,
                password: password,
            });
        }

        // التحقق من وجود خطأ في الاستجابة
        if (response.error) {
            throw response.error;
        }

        // ملاحظة: onAuthStateChange في main.js سيتولى بقية العملية
        // مثل إنشاء الملف الشخصي أو الانتقال للشاشة الرئيسية.

    } catch (error) {
        UI.authError.textContent = translateAuthError(error);
        UI.authError.style.display = 'block';
    } finally {
        UI.authActionButton.disabled = false;
        // إعادة النص الأصلي للزر بناءً على الوضع الحالي
        UI.authActionButton.textContent = isSignupMode ? 'إنشاء حساب' : 'تسجيل الدخول';
    }
}

/**
 * إعداد واجهة تسجيل الدخول/الإنشاء لأول مرة وربط الأحداث.
 */
export function setupAuthScreen() {
    // التأكد من عدم إضافة المستمع أكثر من مرة
    if (!UI.authActionButton.dataset.listener) {
        UI.authActionButton.addEventListener('click', handleAuthAction);
        const initialToggleLink = document.getElementById('toggle-to-signup');
        if (initialToggleLink) {
            initialToggleLink.addEventListener('click', toggleAuthMode);
        }
        UI.authActionButton.dataset.listener = 'true';
    }
    isSignupMode = false;
    updateAuthFormUI();
}

/**
 * التعامل مع تسجيل الخروج.
 */
export async function handleLogout() {
    const { error } = await supabase.auth.signOut();
    if (error) {
        console.error('خطأ أثناء تسجيل الخروج:', error);
        UI.showModal("خطأ", "حدث خطأ أثناء محاولة تسجيل الخروج.");
    }
    // سيقوم onAuthStateChange في main.js بالتعامل مع إعادة التوجيه إلى شاشة الدخول.
}



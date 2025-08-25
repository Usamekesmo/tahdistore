// ==================================================================
// =================== ملف ui.js (النسخة النهائية) ==================
// ==================================================================
// يحتوي هذا الملف على جميع متغيرات عناصر الواجهة (DOM Elements)
// والدوال المساعدة للتحكم في الواجهة الرسومية.

// --- 1. تعريف عناصر الواجهة (DOM Elements) ---

// الشاشات الرئيسية
export const splashScreen = document.getElementById('splash-screen');
export const loginScreen = document.getElementById('login-screen');
export const mainScreen = document.getElementById('main-screen');
export const customTestSetupScreen = document.getElementById('custom-test-setup-screen');
export const testScreen = document.getElementById('test-screen');
export const resultsScreen = document.getElementById('results-screen');
export const storeScreen = document.getElementById('store-screen');
export const profileScreen = document.getElementById('profile-screen');
export const hifzTreeScreen = document.getElementById('hifz-tree-screen');
export const leaderboardScreen = document.getElementById('leaderboard-screen');
export const planScreen = document.getElementById('plan-screen');
export const ringsScreen = document.getElementById('rings-screen');
export const ringDetailsScreen = document.getElementById('ring-details-screen');
export const adminPanelScreen = document.getElementById('admin-panel-screen');
export const adminUserDetailsScreen = document.getElementById('admin-user-details-screen');
export const adminRingDetailsScreen = document.getElementById('admin-ring-details-screen');

// عناصر المصادقة
export const usernameInput = document.getElementById('username-input');
export const emailInput = document.getElementById('email-input');
export const passwordInput = document.getElementById('password-input');
export const authFormTitle = document.getElementById('auth-form-title');
export const authActionButton = document.getElementById('auth-action-button');
export const authToggleMessage = document.getElementById('auth-toggle-message');
export const authError = document.getElementById('auth-error');

// عناصر الشاشة الرئيسية
export const welcomeMessage = document.getElementById('welcome-message');
export const userStats = document.getElementById('user-stats');
export const startTestButton = document.getElementById('start-test-button');
export const startReviewButton = document.getElementById('start-review-button');
export const profileButton = document.getElementById('profile-button');
export const storeButton = document.getElementById('store-button');
export const hifzTreeButton = document.getElementById('hifz-tree-button');
export const leaderboardButton = document.getElementById('leaderboard-button');
export const planButton = document.getElementById('plan-button');
export const ringsButton = document.getElementById('rings-button');
export const logoutButton = document.getElementById('logout-button');

// عناصر شاشة الاختبار
export const progressBar = document.getElementById('progress-bar');
export const questionTitle = document.getElementById('question-title');
export const questionContainer = document.getElementById('question-container');
export const optionsContainer = document.getElementById('options-container');
export const submitAnswerButton = document.getElementById('submit-answer-button');
export const nextQuestionButton = document.getElementById('next-question-button');

// عناصر شاشة النتائج
export const resultsSummary = document.getElementById('results-summary');
export const resultsXp = document.getElementById('results-xp');
export const resultsDiamonds = document.getElementById('results-diamonds');
export const backToMainButton = document.getElementById('back-to-main-button');

// عناصر المتجر
export const storeDiamondsBalance = document.getElementById('store-diamonds-balance');
export const storeItemsContainer = document.getElementById('store-items-container');

// عناصر الملف الشخصي
export const profileUsername = document.getElementById('profile-username');
export const profileLevelTitle = document.getElementById('profile-level-title');
export const profileTotalXp = document.getElementById('profile-total-xp');
export const profileDiamonds = document.getElementById('profile-diamonds');
export const profileOwnedItemsContainer = document.getElementById('profile-owned-items-container');
export const statsCorrectAnswers = document.getElementById('stats-correct-answers');
export const statsWrongAnswers = document.getElementById('stats-wrong-answers');

// عناصر أخرى
export const hifzTreeContainerMain = document.getElementById('hifz-tree-container-main');
export const leaderboardContainer = document.getElementById('leaderboard-container');
export const savePlanButton = document.getElementById('save-plan-button');

// عناصر النوافذ المنبثقة (Modals)
export const customModal = document.getElementById('custom-modal');
export const modalTitle = document.getElementById('modal-title');
export const modalMessage = document.getElementById('modal-message');
export const modalCloseButton = document.getElementById('modal-close-button');


// --- 2. دوال مساعدة عامة للتحكم في الواجهة ---

/**
 * يعرض شاشة محددة ويخفي الأخرى.
 * @param {HTMLElement} screenToShow - العنصر الخاص بالشاشة المراد عرضها.
 */
export function showScreen(screenToShow) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    screenToShow.classList.add('active');
}

/**
 * يعرض نافذة منبثقة (modal) بعنوان ورسالة محددة.
 * @param {string} title - عنوان النافذة.
 * @param {string} message - محتوى الرسالة (يمكن أن يحتوي على HTML).
 */
export function showModal(title, message) {
    modalTitle.innerHTML = title;
    modalMessage.innerHTML = message;
    customModal.style.display = 'flex';
}

/**
 * يطبق الثيم (الألوان) المحدد على التطبيق.
 * @param {string} themeId - معرف الثيم.
 * @param {Array} allStoreItems - مصفوفة جميع منتجات المتجر للبحث عن الثيم.
 */
export function applyTheme(themeId, allStoreItems) {
    // الألوان الافتراضية
    let themeColors = {
        '--primary-color': '#005B41',
        '--secondary-color': '#008170',
        '--accent-color': '#232D3F',
    };

    if (themeId && themeId !== 'default') {
        const themeItem = allStoreItems.find(item => item.id === themeId && item.type === 'theme');
        // يفترض أن بيانات الثيم مخزنة في حقل metadata
        if (themeItem && themeItem.metadata && themeItem.metadata.colors) {
            themeColors = { ...themeColors, ...themeItem.metadata.colors };
        }
    }

    // تطبيق الألوان على متغيرات CSS الجذرية
    for (const [key, value] of Object.entries(themeColors)) {
        document.documentElement.style.setProperty(key, value);
    }
}

/**
 * يحسب رقم الأسبوع في السنة لتاريخ معين.
 * @param {Date} d - التاريخ.
 * @returns {number} رقم الأسبوع.
 */
export function getWeekNumber(d) {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    // اضبط التاريخ على يوم الخميس من نفس الأسبوع
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    // بداية السنة
    var yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    // حساب عدد الأسابيع
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}
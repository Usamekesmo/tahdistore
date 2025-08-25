// ==================================================================
// =================== ملف main.js (نسخة Supabase) ==================
// ==================================================================
// هذا هو الملف الرئيسي للتطبيق. يقوم بتنسيق العمل بين جميع الوحدات
// الأخرى، وربط الأحداث، وإدارة حالة التطبيق العامة.

// --- 1. استيراد الوحدات (Modules) ---
import { supabase } from './config.js';
import * as UI from './ui.js';
import { setupAuthScreen, handleLogout } from './auth.js';
import * as Database from './database.js';
import * as Test from './test.js';
import * as Features from './features.js';
import * as Rings from './rings.js';
import * as Admin from './admin.js';
import { calculateLevel } from './utils.js';

// --- 2. متغيرات الحالة العامة للتطبيق ---
let currentUser = null;
let allStoreItems = [];
let availableAyahs = [];

// --- 3. دوال إدارة حالة التطبيق ---

/**
 * الدالة الرئيسية التي تبدأ التطبيق وتراقب حالة المصادقة.
 */
async function initializeApp() {
    UI.showScreen(UI.splashScreen);

    // الاستماع لتغيرات حالة المصادقة (تسجيل دخول/خروج)
    supabase.auth.onAuthStateChange(async (event, session) => {
        const user = session?.user;

        if (user) {
            // --- حالة وجود مستخدم مسجل دخوله ---
            let profile = await Database.loadUserData(user.id);

            if (!profile) {
                // هذا مستخدم جديد لم يتم إنشاء ملفه الشخصي بعد
                profile = await Database.createNewUserProfile(user);
                if (!profile) {
                    UI.showModal("خطأ فادح", "لم نتمكن من إعداد حسابك. الرجاء المحاولة مرة أخرى.");
                    await handleLogout();
                    return;
                }
            }

            // التحقق إذا كان الحساب محظورًا
            if (profile.is_blocked) {
                UI.showModal("الحساب محظور", "تم حظر هذا الحساب من قبل الإدارة.");
                await handleLogout();
                return;
            }

            currentUser = profile;
            allStoreItems = await Database.fetchStoreItems();
            
            await processPeriodicUpdates();

            UI.applyTheme(currentUser.active_theme || 'default', allStoreItems);
            updateMainScreen();
            UI.showScreen(UI.mainScreen);

        } else {
            // --- حالة عدم وجود مستخدم (مسجل خروجه) ---
            currentUser = null;
            allStoreItems = [];
            setupAuthScreen();
            UI.showScreen(UI.loginScreen);
        }
    });
}

/**
 * تحديث محتوى الشاشة الرئيسية بناءً على بيانات المستخدم.
 */
function updateMainScreen() {
    if (!currentUser) return;
    UI.welcomeMessage.textContent = `أهلاً بك، ${currentUser.username}!`;
    UI.userStats.textContent = `المستوى ${currentUser.level} | ${currentUser.total_xp} XP | ${currentUser.diamonds} 💎`;

    // إظهار/إخفاء زر لوحة التحكم للمدير
    const oldAdminBtn = document.getElementById('admin-panel-button');
    if (oldAdminBtn) oldAdminBtn.remove();
    if (currentUser.is_admin) {
        const adminButton = document.createElement('button');
        adminButton.id = 'admin-panel-button';
        adminButton.className = 'button-secondary';
        adminButton.innerHTML = '<i class="fas fa-user-shield"></i> لوحة التحكم';
        UI.logoutButton.parentElement.insertBefore(adminButton, UI.logoutButton);
    }
}

/**
 * معالجة المكافآت والتحديثات الدورية (الدخول اليومي).
 */
async function processPeriodicUpdates() {
    const today = new Date().toISOString().split('T')[0];
    let needsUpdate = false;

    if (currentUser.last_login_date !== today) {
        currentUser.diamonds += 2;
        currentUser.last_login_date = today;
        UI.showModal("🎁 مكافأة الدخول اليومي", "لقد حصلت على 2 ألماسة لتسجيل دخولك اليوم!");
        needsUpdate = true;
    }

    if (needsUpdate) {
        await Database.saveUserData(currentUser);
    }
}

// --- 4. منطق بدء الاختبار ومعالجة النتائج والشراء ---

async function startNewTest(settings) {
    UI.showScreen(UI.testScreen);
    UI.questionContainer.innerHTML = "<div class='loading-spinner'></div><p>جارٍ تحضير الاختبار...</p>";
    
    const pagePromises = [];
    for (let i = parseInt(settings.startPage); i <= parseInt(settings.endPage); i++) {
        pagePromises.push(Database.getAyahsByPage(i));
    }
    availableAyahs = (await Promise.all(pagePromises)).flat();
    
    Test.resetTestState();
    await Test.generateTestQuestions(availableAyahs, settings.questionTypes, settings.questionCount);
    Test.displayQuestion();
}

async function handleTestCompletion() {
    const { score, totalQuestions } = Test.getTestResults();
    let xpGained = score * 3;
    let diamondsGained = 0;
    
    const isPerfectTest = (score === totalQuestions && totalQuestions > 0);
    if (isPerfectTest) {
        xpGained += 15;
    }

    currentUser.total_xp += xpGained;
    currentUser.diamonds += diamondsGained;
    currentUser.tests_completed += 1;
    currentUser.total_correct_answers += score;
    currentUser.total_questions_answered += totalQuestions;

    UI.resultsSummary.textContent = `لقد أجبت بشكل صحيح على ${score} من ${totalQuestions} أسئلة.`;
    UI.resultsXp.textContent = `لقد حصلت على ${xpGained} نقطة خبرة (XP).`;
    UI.resultsDiamonds.textContent = `لقد حصلت على ${diamondsGained} ألماسة 💎.`;
    UI.showScreen(UI.resultsScreen);

    const newLevelInfo = calculateLevel(currentUser.total_xp);
    if (newLevelInfo.level > currentUser.level) {
        currentUser.level = newLevelInfo.level;
        currentUser.title = newLevelInfo.title;
        UI.showModal(`🎉 ترقية!`, `تهانينا! لقد ترقيت إلى المستوى ${newLevelInfo.level}: ${newLevelInfo.title}`);
    }
    
    await Database.saveUserData(currentUser);
}

async function handleBuyItem(itemId, itemPrice) {
    if (currentUser.diamonds < itemPrice) {
        UI.showModal("رصيد غير كافٍ", "عفواً، لا تملك رصيداً كافياً من الألماس لإتمام هذه العملية.");
        return;
    }

    currentUser.diamonds -= itemPrice;

    const { error: insertError } = await supabase
        .from('user_owned_items')
        .insert({ user_id: currentUser.id, item_id: itemId });

    if (insertError) {
        console.error("خطأ في إضافة المنتج للمستخدم:", insertError);
        UI.showModal("خطأ", "حدث خطأ أثناء عملية الشراء. لم يتم خصم أي شيء.");
        currentUser.diamonds += itemPrice; 
        return;
    }

    await Database.saveUserData(currentUser);

    const purchasedItem = allStoreItems.find(item => item.id === itemId);
    UI.showModal("✅ نجحت العملية", `تهانينا! لقد اشتريت "${purchasedItem.name}" بنجاح.`);
    
    Features.displayStore(currentUser, allStoreItems);
    updateMainScreen();
}

// --- 5. ربط الأحداث (Event Listeners) ---

function bindEventListeners() {
    // --- التنقل الرئيسي والأحداث العامة ---
    UI.logoutButton.addEventListener('click', handleLogout);
    document.querySelectorAll('.back-button').forEach(button => {
        if (button.id === 'back-to-rings-list-btn' || button.id === 'back-to-admin-panel-btn') return;
        button.onclick = () => {
            updateMainScreen();
            UI.showScreen(UI.mainScreen);
        };
    });
    UI.backToMainButton.addEventListener('click', () => {
        updateMainScreen();
        UI.showScreen(UI.mainScreen);
    });
    UI.modalCloseButton.addEventListener('click', () => { UI.customModal.style.display = 'none'; });

    // --- أزرار الشاشة الرئيسية ---
    UI.storeButton.addEventListener('click', () => Features.displayStore(currentUser, allStoreItems));
    UI.profileButton.addEventListener('click', () => Features.displayProfile(currentUser, allStoreItems));
    UI.hifzTreeButton.addEventListener('click', () => Features.displayHifzTree(currentUser));
    UI.leaderboardButton.addEventListener('click', () => Features.displayLeaderboard('total_xp'));
    UI.startTestButton.addEventListener('click', () => Features.showCustomTestSetupScreen(currentUser, allStoreItems));
    UI.ringsButton.addEventListener('click', () => Rings.showRingsScreen(currentUser));

    // --- أحداث المتجر ---
    UI.storeItemsContainer.addEventListener('click', (e) => {
        if (e.target.matches('.buy-button') && !e.target.disabled) {
            const itemId = e.target.dataset.itemId;
            const itemPrice = parseInt(e.target.dataset.itemPrice, 10);
            handleBuyItem(itemId, itemPrice);
        }
    });

    // --- أحداث الاختبار ---
    document.getElementById('custom-test-setup-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const settings = {
            startPage: e.target.elements['test-start-page'].value || '582',
            endPage: e.target.elements['test-end-page'].value || '604',
            questionCount: parseInt(e.target.elements['test-question-count'].value),
            questionTypes: Array.from(e.target.elements['question_type']).filter(cb => cb.checked).map(cb => cb.value)
        };
        if (settings.questionTypes.length === 0) {
            UI.showModal("خطأ", "الرجاء اختيار نوع واحد على الأقل من الأسئلة.");
            return;
        }
        startNewTest(settings);
    });
    UI.nextQuestionButton.addEventListener('click', Test.nextQuestion);
    document.addEventListener('test-finished', handleTestCompletion);
    document.addEventListener('answer-checked', async (e) => {
        const { question, isCorrect } = e.detail;
        if (question.isCustom) return;
        const { error } = await supabase.rpc('upsert_page_performance', {
            p_user_id: currentUser.id,
            p_page_number: question.page,
            p_is_correct: isCorrect
        });
        if(error) console.error("Failed to update page performance:", error);
    });

    // --- أحداث الحلقات ---
    document.body.addEventListener('click', async (e) => {
        if (e.target.matches('#my-rings-list button[data-ring-id]')) {
            Rings.showRingDetails(e.target.dataset.ringId, currentUser);
        }
        if (e.target.matches('.join-ring-btn[data-ring-id]')) {
            const ringId = e.target.dataset.ringId;
            e.target.disabled = true;
            e.target.textContent = 'جارٍ الانضمام...';
            const { error } = await supabase.from('ring_members').insert({ ring_id: ringId, user_id: currentUser.id, username: currentUser.username });
            if (error) {
                UI.showModal("خطأ", "لم نتمكن من الانضمام للحلقة.");
                e.target.disabled = false;
                e.target.textContent = 'انضمام';
            } else {
                UI.showModal("نجاح", "لقد انضممت إلى الحلقة بنجاح!");
                Rings.showRingsScreen(currentUser);
            }
        }
        if (e.target.matches('#create-ring-btn')) {
            const ringName = prompt("الرجاء إدخال اسم للحلقة الجديدة:");
            if (!ringName || ringName.trim() === "") return;
            const { data, error } = await supabase.from('rings').insert({ name: ringName, creator_id: currentUser.id, creator_name: currentUser.username }).select().single();
            if (error || !data) {
                UI.showModal("خطأ", "فشل إنشاء الحلقة.");
            } else {
                await supabase.from('ring_members').insert({ ring_id: data.id, user_id: currentUser.id, username: currentUser.username });
                UI.showModal("نجاح", "تم إنشاء الحلقة بنجاح!");
                Rings.showRingDetails(data.id, currentUser);
            }
        }
    });
    document.querySelector('#back-to-rings-list-btn').addEventListener('click', () => {
        Rings.cleanupRingDetailsListeners();
        Rings.showRingsScreen(currentUser);
    });

    // --- أحداث لوحة التحكم ---
    document.body.addEventListener('click', (e) => {
        if (e.target.matches('#admin-panel-button')) {
            UI.showScreen(UI.adminPanelScreen);
            document.querySelector('.admin-tab-button[data-tab="admin-user-management"]').click();
        }
        if (e.target.matches('.admin-tab-button')) {
            document.querySelectorAll('.admin-tab-button').forEach(btn => btn.classList.remove('active'));
            document.querySelectorAll('.admin-tab-content').forEach(content => content.classList.remove('active'));
            e.target.classList.add('active');
            const tabId = e.target.dataset.tab;
            document.getElementById(tabId).classList.add('active');
            if (tabId === 'admin-user-management') Admin.loadUsersForAdmin();
            if (tabId === 'admin-store-management') Admin.loadStoreItemsForAdmin();
        }
        if (e.target.closest('.admin-user-info')) {
            const userId = e.target.closest('.admin-user-info').dataset.userId;
            Admin.showUserDetailsForAdmin(userId, currentUser);
        }
    });
    document.body.addEventListener('input', (e) => {
        if (e.target.matches('#admin-user-search')) {
            Admin.filterUsersForAdmin(e.target.value);
        }
    });
    document.getElementById('back-to-admin-panel-btn').addEventListener('click', () => {
        UI.showScreen(UI.adminPanelScreen);
    });
    document.body.addEventListener('submit', async (e) => {
        if (e.target.matches('#admin-item-form')) {
            e.preventDefault();
            const form = e.target;
            const itemData = { name: form.querySelector('#item-name').value, description: form.querySelector('#item-description').value, price: parseInt(form.querySelector('#item-price').value), type: form.querySelector('#item-type-select').value };
            const { error } = await supabase.from('store_items').insert(itemData);
            if (error) UI.showModal("خطأ", "فشل حفظ المنتج: " + error.message);
            else {
                UI.showModal("نجاح", "تم حفظ المنتج بنجاح.");
                Admin.loadStoreItemsForAdmin();
            }
        }
    });
}

// --- 6. بدء تشغيل التطبيق ---
document.addEventListener('DOMContentLoaded', () => {
    bindEventListeners();
    initializeApp();
});



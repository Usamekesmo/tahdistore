// ==================================================================
// =================== ملف features.js (نسخة Supabase) =============
// ==================================================================
// يحتوي هذا الملف على منطق الميزات الرئيسية للتطبيق مثل:
// - الملف الشخصي والإحصائيات.
// - المتجر وعمليات الشراء.
// - شجرة الحفظ.
// - لوحة الصدارة.
// - إعدادات الاختبار المخصص.

import { supabase } from './config.js';
import * as UI from './ui.js';
import { questionTypeNames } from './config.js';

// متغير لتخزين كائن الرسم البياني لتدميره قبل إعادة إنشائه
let answersPieChart = null;

// --- 1. دوال الملف الشخصي ---

function createAnswersPieChart(correct, wrong) {
    const ctx = document.getElementById('answers-pie-chart').getContext('2d');
    if (answersPieChart) {
        answersPieChart.destroy();
    }
    answersPieChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['صحيحة', 'خاطئة'],
            datasets: [{
                data: [correct, wrong],
                backgroundColor: ['rgba(39, 174, 96, 0.8)', 'rgba(192, 57, 43, 0.8)'],
                borderColor: ['#27AE60', '#C0392B'],
                borderWidth: 1
            }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top' } } }
    });
}

function displayPagesPerformance(pagesData) {
    const bestList = document.getElementById('best-pages-list');
    const worstList = document.getElementById('worst-pages-list');
    bestList.innerHTML = '<li>لا توجد بيانات كافية.</li>';
    worstList.innerHTML = '<li>لا توجد بيانات كافية.</li>';
    if (!pagesData || pagesData.length === 0) return;
    
    pagesData.forEach(page => page.accuracy = page.total > 0 ? (page.correct / page.total) : 0);
    pagesData.sort((a, b) => b.accuracy - a.accuracy);
    
    bestList.innerHTML = '';
    pagesData.slice(0, 3).forEach(page => {
        const li = document.createElement('li');
        li.textContent = `صفحة ${page.page_number} (دقة: ${(page.accuracy * 100).toFixed(0)}%)`;
        bestList.appendChild(li);
    });

    worstList.innerHTML = '';
    pagesData.slice(-3).reverse().forEach(page => {
        const li = document.createElement('li');
        li.textContent = `صفحة ${page.page_number} (دقة: ${(page.accuracy * 100).toFixed(0)}%)`;
        worstList.appendChild(li);
    });
}

export async function displayProfile(currentUser, allStoreItems) {
    UI.profileUsername.textContent = currentUser.username;
    UI.profileLevelTitle.textContent = `المستوى ${currentUser.level}: ${currentUser.title}`;
    UI.profileTotalXp.textContent = currentUser.total_xp;
    UI.profileDiamonds.textContent = currentUser.diamonds;
    
    const wrongAnswers = currentUser.total_questions_answered - currentUser.total_correct_answers;
    UI.statsCorrectAnswers.textContent = currentUser.total_correct_answers;
    UI.statsWrongAnswers.textContent = wrongAnswers;
    createAnswersPieChart(currentUser.total_correct_answers, wrongAnswers);
    
    // جلب أداء الصفحات من Supabase
    const { data: performanceData, error: performanceError } = await supabase
        .from('page_performance')
        .select('*')
        .eq('user_id', currentUser.id);
        
    if (performanceError) console.error("Error fetching page performance:", performanceError);
    
    displayPagesPerformance(performanceData);
    
    // جلب مقتنيات المستخدم
    const { data: ownedItemsData, error: ownedItemsError } = await supabase
        .from('user_owned_items')
        .select('item_id')
        .eq('user_id', currentUser.id);

    if (ownedItemsError) console.error("Error fetching owned items:", ownedItemsError);
    
    const ownedItemIds = ownedItemsData ? ownedItemsData.map(item => item.item_id) : [];

    // عرض المقتنيات
    UI.profileOwnedItemsContainer.innerHTML = "<h4>مقتنياتي قيد التطوير...</h4>";

    UI.showScreen(UI.profileScreen);
}

// --- 2. دوال المتجر ---

export async function displayStore(currentUser, allStoreItems) {
    UI.storeDiamondsBalance.textContent = currentUser.diamonds;
    UI.storeItemsContainer.innerHTML = '';
    if (allStoreItems.length === 0) {
        UI.storeItemsContainer.innerHTML = '<p>المتجر فارغ حالياً.</p>';
        return;
    }

    // جلب قائمة ID المنتجات التي يملكها المستخدم
    const { data: ownedItemsData, error } = await supabase
        .from('user_owned_items')
        .select('item_id')
        .eq('user_id', currentUser.id);
    
    const ownedItemIds = error ? [] : ownedItemsData.map(item => item.item_id);

    allStoreItems.forEach(item => {
        const isOwned = ownedItemIds.includes(item.id);
        const itemDiv = document.createElement('div');
        itemDiv.className = 'store-item';
        itemDiv.innerHTML = `
            <div><h4>${item.name}</h4><p>${item.description}</p></div>
            <button class="buy-button" data-item-id="${item.id}" data-item-price="${item.price}" ${isOwned ? 'disabled' : ''}>
                ${isOwned ? 'تم الشراء' : `${item.price} 💎`}
            </button>
        `;
        UI.storeItemsContainer.appendChild(itemDiv);
    });
    UI.showScreen(UI.storeScreen);
}

// --- 3. دوال شجرة الحفظ ---

export async function displayHifzTree(currentUser) {
    UI.showScreen(UI.hifzTreeScreen);
    UI.hifzTreeContainerMain.innerHTML = "<div class='loading-spinner'></div>";
    
    const { data: performanceData, error } = await supabase
        .from('page_performance')
        .select('page_number, total')
        .eq('user_id', currentUser.id);

    if (error) {
        UI.hifzTreeContainerMain.innerHTML = "<p>خطأ في تحميل بيانات الحفظ.</p>";
        return;
    }

    const hifzData = {};
    let maxTestCount = 0;
    performanceData.forEach(page => {
        hifzData[page.page_number] = { testCount: page.total };
        if (page.total > maxTestCount) maxTestCount = page.total;
    });

    UI.hifzTreeContainerMain.innerHTML = '';
    for (let i = 1; i <= 604; i++) {
        const pageInfo = hifzData[i];
        const pageCell = document.createElement('button');
        pageCell.className = 'page-cell';
        const span = document.createElement('span');
        span.textContent = i;
        pageCell.appendChild(span);
        pageCell.dataset.pageNumber = i;
        if (pageInfo && pageInfo.testCount > 0) {
            const opacity = 0.1 + 0.9 * (pageInfo.testCount / (maxTestCount || 1));
            pageCell.style.backgroundColor = `rgba(0, 91, 65, ${opacity})`;
            pageCell.style.color = 'white';
        }
        pageCell.title = `صفحة ${i} - اضغط لبدء اختبار مخصص`;
        UI.hifzTreeContainerMain.appendChild(pageCell);
    }
}

// --- 4. دوال لوحة الصدارة ---

export async function displayLeaderboard(filter) {
    UI.showScreen(UI.leaderboardScreen);
    UI.leaderboardContainer.innerHTML = "<div class='loading-spinner'></div>";
    
    document.querySelectorAll('#leaderboard-filters button').forEach(btn => btn.classList.remove('active'));
    const filterButtonId = `leaderboard-${filter === 'total_xp' ? 'all-time' : (filter === 'monthly_xp' ? 'monthly' : 'weekly')}-btn`;
    document.getElementById(filterButtonId)?.classList.add('active');
    
    const { data: leaderboardData, error } = await supabase
        .from('profiles')
        .select('username, level, title, total_xp, weekly_xp, monthly_xp')
        .order(filter, { ascending: false })
        .limit(50);

    if (error) {
        UI.leaderboardContainer.innerHTML = '<p>حدث خطأ أثناء تحميل لوحة الصدارة.</p>';
        console.error("Leaderboard error:", error);
        return;
    }

    UI.leaderboardContainer.innerHTML = leaderboardData.map((user, index) => `
        <div class="leaderboard-entry">
            <span class="leaderboard-rank">${index + 1}</span>
            <div class="leaderboard-user-info">
                <div class="leaderboard-avatar-container">
                    <i class="fas fa-user"></i>
                </div>
                <div>
                    <span class="leaderboard-username">${user.username}</span>
                    <span class="leaderboard-title">${user.title}</span>
                </div>
            </div>
            <span class="leaderboard-xp">${user[filter] || 0} XP</span>
        </div>
    `).join('') || '<p>لوحة الصدارة فارغة حالياً.</p>';
}

// --- 5. دوال الإعدادات والميزات الأخرى ---

export function showCustomTestSetupScreen(currentUser, allStoreItems) {
    const container = document.getElementById('test-question-types-container');
    container.innerHTML = ''; // تفريغ الحاوية

    // للتبسيط، سنفترض أن جميع الأنواع الأساسية متاحة حاليًا
    const availableTypes = ['complete_ayah', 'order_words'];

    availableTypes.forEach(typeId => {
        const label = document.createElement('label');
        label.className = 'checkbox-label';
        label.innerHTML = `
            <input type="checkbox" name="question_type" value="${typeId}" checked>
            <span>${questionTypeNames[typeId]}</span>
        `;
        container.appendChild(label);
    });

    UI.showScreen(UI.customTestSetupScreen);
}
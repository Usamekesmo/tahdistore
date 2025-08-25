// ==================================================================
// =================== ملف rings.js (نسخة Supabase) ================
// ==================================================================
// يحتوي هذا الملف على كل المنطق المتعلق بالحلقات الدراسية.

import { supabase } from './config.js';
import * as UI from './ui.js';

// متغير لتخزين اشتراك Realtime لإلغائه عند مغادرة الشاشة
let chatSubscription = null;

// --- دوال عرض الحلقات الرئيسية ---

async function loadMyRings(currentUser) {
    const myRingsList = document.getElementById('my-rings-list');
    myRingsList.innerHTML = '<div class="loading-spinner-small"></div>';
    
    // جلب الحلقات التي يكون المستخدم عضواً فيها
    // نستخدم استعلامًا متداخلاً لجلب الحلقة وعدد أعضائها
    const { data, error } = await supabase
        .from('ring_members')
        .select(`
            rings ( id, name, creator_name )
        `)
        .eq('user_id', currentUser.id);

    if (error) {
        console.error("Error fetching user's rings:", error);
        myRingsList.innerHTML = '<p>خطأ في تحميل حلقاتك.</p>';
        return;
    }

    myRingsList.innerHTML = '';
    if (!data || data.length === 0) {
        myRingsList.innerHTML = '<p>أنت لست عضواً في أي حلقة بعد.</p>';
        return;
    }

    data.forEach(item => {
        const ring = item.rings;
        const ringDiv = document.createElement('div');
        ringDiv.className = 'ring-entry';
        ringDiv.innerHTML = `
            <div class="ring-entry-details">
                <h5>${ring.name}</h5>
                <p>المشرف: ${ring.creator_name}</p>
            </div>
            <button class="button-secondary" style="width:auto; padding: 8px 15px;" data-ring-id="${ring.id}">عرض</button>
        `;
        myRingsList.appendChild(ringDiv);
    });
}

async function loadPublicRings(currentUser) {
    const publicRingsList = document.getElementById('public-rings-list');
    publicRingsList.innerHTML = '<div class="loading-spinner-small"></div>';
    
    // جلب IDs الحلقات التي انضم إليها المستخدم بالفعل
    const { data: userRingIds, error: userRingIdsError } = await supabase
        .from('ring_members')
        .select('ring_id')
        .eq('user_id', currentUser.id);

    const joinedRingIds = userRingIdsError ? [] : userRingIds.map(r => r.ring_id);

    // جلب الحلقات العامة التي لم ينضم إليها المستخدم
    const { data, error } = await supabase
        .from('rings')
        .select('id, name, creator_name')
        .eq('is_public', true)
        .not('id', 'in', `(${joinedRingIds.join(',') || "''"})`) // استثناء الحلقات المنضم إليها
        .limit(10);

    if (error) {
        console.error("Error fetching public rings:", error);
        publicRingsList.innerHTML = '<p>خطأ في تحميل الحلقات العامة.</p>';
        return;
    }

    publicRingsList.innerHTML = '';
    if (!data || data.length === 0) {
        publicRingsList.innerHTML = '<p>لا توجد حلقات عامة متاحة حالياً.</p>';
        return;
    }

    data.forEach(ring => {
        const ringDiv = document.createElement('div');
        ringDiv.className = 'ring-entry';
        ringDiv.innerHTML = `
            <div class="ring-entry-details">
                <h5>${ring.name}</h5>
                <p>المشرف: ${ring.creator_name}</p>
            </div>
            <button class="button-primary join-ring-btn" style="width:auto; padding: 8px 15px;" data-ring-id="${ring.id}">انضمام</button>
        `;
        publicRingsList.appendChild(ringDiv);
    });
}

export function showRingsScreen(currentUser) {
    UI.showScreen(UI.ringsScreen);
    loadMyRings(currentUser);
    loadPublicRings(currentUser);
}

// --- دوال تفاصيل الحلقة ---

function displayRingLeaderboard(members) {
    const container = document.getElementById('ring-leaderboard');
    members.sort((a, b) => (b.points_in_ring || 0) - (a.points_in_ring || 0));
    let rank = 1;
    container.innerHTML = members.map(member => `
        <div class="leaderboard-entry">
            <span class="leaderboard-rank">${rank++}</span>
            <span class="leaderboard-username">${member.username}</span>
            <span class="leaderboard-xp">${member.points_in_ring || 0} نقطة</span>
        </div>
    `).join('') || '<p>لا يوجد أعضاء في لوحة الصدارة بعد.</p>';
}

function setupRingChat(ringId, currentUser) {
    const messagesContainer = document.getElementById('ring-chat-messages');
    const chatForm = document.getElementById('ring-chat-form');

    // جلب الرسائل الأولية عند فتح المحادثة
    supabase.from('ring_chat_messages').select('*').eq('ring_id', ringId).order('timestamp', { ascending: true })
        .then(({ data: messages }) => {
            messagesContainer.innerHTML = '';
            messages.forEach(msg => {
                const msgDiv = document.createElement('div');
                msgDiv.className = `chat-message ${msg.user_id === currentUser.id ? 'mine' : ''}`;
                msgDiv.innerHTML = `<div class="chat-message-bubble"><div class="chat-message-sender">${msg.username}</div>${msg.text}</div>`;
                messagesContainer.appendChild(msgDiv);
            });
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        });

    // إلغاء أي اشتراك قديم لضمان عدم وجود مستمعات مكررة
    if (chatSubscription) {
        chatSubscription.unsubscribe();
    }

    // إنشاء اشتراك Realtime جديد للاستماع للرسائل الجديدة
    chatSubscription = supabase.channel(`ring-chat-${ringId}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'ring_chat_messages', filter: `ring_id=eq.${ringId}` }, payload => {
            const msg = payload.new;
            const msgDiv = document.createElement('div');
            msgDiv.className = `chat-message ${msg.user_id === currentUser.id ? 'mine' : ''}`;
            msgDiv.innerHTML = `<div class="chat-message-bubble"><div class="chat-message-sender">${msg.username}</div>${msg.text}</div>`;
            messagesContainer.appendChild(msgDiv);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        })
        .subscribe();

    chatForm.onsubmit = async (e) => {
        e.preventDefault();
        const input = document.getElementById('ring-chat-input');
        const text = input.value.trim();
        if (text === "") return;
        input.disabled = true;
        await supabase.from('ring_chat_messages').insert({
            ring_id: ringId,
            user_id: currentUser.id,
            username: currentUser.username,
            text: text
        });
        input.value = '';
        input.disabled = false;
        input.focus();
    };
}

export async function showRingDetails(ringId, currentUser) {
    UI.showScreen(UI.ringDetailsScreen);
    
    // جلب بيانات الحلقة والأعضاء معًا في استعلام واحد
    const { data: ringData, error } = await supabase
        .from('rings')
        .select(`
            *,
            members:ring_members ( user_id, username, points_in_ring )
        `)
        .eq('id', ringId)
        .single();

    if (error || !ringData) {
        UI.showModal("خطأ", "لم نتمكن من العثور على هذه الحلقة.");
        showRingsScreen(currentUser);
        return;
    }

    document.getElementById('ring-details-name').textContent = ringData.name;
    
    // عرض لوحة الصدارة
    displayRingLeaderboard(ringData.members);
    
    // إعداد المحادثة
    setupRingChat(ringId, currentUser);
    
    // تفعيل التبويب الأول افتراضياً
    document.querySelector('.ring-tab-button[data-ring-tab="ring-challenges"]').click();
}

/**
 * تنظيف مستمعات Realtime عند مغادرة شاشة تفاصيل الحلقة.
 */
export function cleanupRingDetailsListeners() {
    if (chatSubscription) {
        chatSubscription.unsubscribe();
        chatSubscription = null;
    }
}



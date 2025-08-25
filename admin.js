// ==================================================================
// =================== ملف admin.js (نسخة Supabase) ================
// ==================================================================
// يحتوي هذا الملف على وظائف لوحة تحكم المدير (Admin Panel).

import { supabase } from './config.js';
import * as UI from './ui.js';

// متغيرات لتخزين البيانات المجلوبة لتجنب إعادة تحميلها
let allUsersCache = [];
let allStoreItemsCache = [];

// --- 1. دوال إدارة المتجر ---

function displayStoreItemsInAdmin(items) {
    const container = document.getElementById('admin-item-list');
    container.innerHTML = '';
    items.forEach(item => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'admin-item-entry';
        itemDiv.innerHTML = `
            <span>${item.name} (${item.price}💎)</span>
            <div>
                <button data-item-id="${item.id}" class="edit-store-item-btn">تعديل</button>
                <button data-item-id="${item.id}" class="delete-store-item-btn logout-btn">حذف</button>
            </div>`;
        container.appendChild(itemDiv);
    });
}

export async function loadStoreItemsForAdmin() {
    const container = document.getElementById('admin-store-management');
    // إعادة بناء الواجهة في كل مرة لضمان عدم تكرار العناصر
    container.innerHTML = `
        <h3><i class="fas fa-store"></i> إدارة المتجر</h3>
        <form id="admin-item-form">
            <input type="hidden" id="item-id">
            <input type="text" id="item-name" placeholder="اسم المنتج" required>
            <textarea id="item-description" placeholder="وصف المنتج"></textarea>
            <input type="number" id="item-price" placeholder="السعر (بالألماس)" required>
            <select id="item-type-select" required>
                <option value="theme">ثيم</option>
                <option value="title">لقب</option>
                <option value="frame">إطار</option>
            </select>
            <button type="submit" class="button-primary">حفظ المنتج</button>
        </form>
        <hr>
        <h4>المنتجات الحالية</h4>
        <div id="admin-item-list"><div class="loading-spinner-small"></div></div>
    `;
    
    const { data, error } = await supabase.from('store_items').select('*').order('created_at');
    if (error) {
        document.getElementById('admin-item-list').innerHTML = '<p style="color: red;">فشل تحميل منتجات المتجر.</p>';
        return;
    }
    allStoreItemsCache = data;
    displayStoreItemsInAdmin(allStoreItemsCache);
}

// --- 2. دوال إدارة المستخدمين ---

function displayUsersInAdmin(users) {
    const container = document.getElementById('admin-user-list-container');
    container.innerHTML = '';
    if (!users || users.length === 0) {
        container.innerHTML = '<p>لم يتم العثور على مستخدمين.</p>';
        return;
    }
    users.forEach(user => {
        const userDiv = document.createElement('div');
        userDiv.className = 'admin-user-entry';
        userDiv.innerHTML = `
            <div class="admin-user-info" data-user-id="${user.id}">
                <p><strong>${user.username}</strong> ${user.is_admin ? '🛡️' : ''} ${user.is_blocked ? '🚫' : ''}</p>
                <p>${user.email}</p>
            </div>
            <div class="admin-user-stats">
                <p>XP: ${user.total_xp || 0} | 💎: ${user.diamonds || 0}</p>
            </div>`;
        container.appendChild(userDiv);
    });
}

export async function loadUsersForAdmin() {
    const container = document.getElementById('admin-user-management');
    container.innerHTML = `
        <h3><i class="fas fa-users"></i> إدارة المستخدمين</h3>
        <input type="text" id="admin-user-search" placeholder="ابحث بالاسم أو البريد الإلكتروني..." style="margin-bottom: 20px;">
        <div id="admin-user-list-container"><div class="loading-spinner"></div></div>
    `;
    
    const { data, error } = await supabase.from('profiles').select('*');
    if (error) {
        document.getElementById('admin-user-list-container').innerHTML = '<p style="color: red;">فشل في تحميل قائمة المستخدمين.</p>';
        return;
    }
    allUsersCache = data;
    displayUsersInAdmin(allUsersCache);
}

export function filterUsersForAdmin(searchTerm) {
    const lowercasedTerm = searchTerm.toLowerCase();
    const filteredUsers = allUsersCache.filter(user => 
        user.username.toLowerCase().includes(lowercasedTerm) || 
        (user.email && user.email.toLowerCase().includes(lowercasedTerm))
    );
    displayUsersInAdmin(filteredUsers);
}

export async function showUserDetailsForAdmin(userId, currentAdmin) {
    UI.showScreen(UI.adminUserDetailsScreen);
    const content = document.getElementById('admin-user-details-content');
    content.innerHTML = '<div class="loading-spinner"></div>';
    
    const { data: user, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (error || !user) {
        content.innerHTML = `<p style="color: red;">المستخدم غير موجود.</p>`;
        return;
    }

    document.getElementById('admin-user-details-title').textContent = `تفاصيل: ${user.username}`;
    content.innerHTML = `
        <div class="user-stat-item"><span>صلاحيات المدير 🛡️</span><button class="button-secondary" id="admin-toggle-admin-btn">${user.is_admin ? 'إزالة صلاحيات المدير' : 'ترقية إلى مدير'}</button></div>
        <div class="user-stat-item"><span>حالة الحساب</span><button class="button-secondary logout-btn" id="admin-toggle-block-btn">${user.is_blocked ? 'إلغاء حظر المستخدم' : 'حظر المستخدم'}</button></div>
    `;

    document.getElementById('admin-toggle-admin-btn').onclick = async () => {
        if (user.id === currentAdmin.id) { UI.showModal("تنبيه", "لا يمكنك تغيير صلاحياتك الخاصة."); return; }
        const { error } = await supabase.from('profiles').update({ is_admin: !user.is_admin }).eq('id', user.id);
        if (error) {
            UI.showModal("خطأ", "فشل تحديث صلاحيات المدير.");
            console.error(error);
        } else {
            UI.showModal("نجاح", "تم تحديث صلاحيات المدير.");
            showUserDetailsForAdmin(userId, currentAdmin); // إعادة تحميل لعرض التغيير
        }
    };
    
    document.getElementById('admin-toggle-block-btn').onclick = async () => {
        if (user.id === currentAdmin.id) { UI.showModal("تنبيه", "لا يمكنك حظر نفسك."); return; }
        const { error } = await supabase.from('profiles').update({ is_blocked: !user.is_blocked }).eq('id', user.id);
        if (error) {
            UI.showModal("خطأ", "فشل تحديث حالة الحظر.");
            console.error(error);

        } else {
            UI.showModal("نجاح", "تم تحديث حالة الحظر.");
            showUserDetailsForAdmin(userId, currentAdmin); // إعادة تحميل لعرض التغيير
        }
    };
}



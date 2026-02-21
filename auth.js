import { mockUsers, state, mockBookings } from './store.js';
import { utils, toast } from './utils.js';
import { calendar } from './calendar.js';
import { bookings_module } from './wardBooking.js';
import { auditLogs } from './logger.js';

export const navigation = {
    init() {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const page = item.dataset.page;
                this.goTo(page);
            });
        });
    },

    goTo(page) {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.page === page);
        });

        document.querySelectorAll('.content-page').forEach(p => {
            p.classList.remove('active');
        });
        const targetPage = document.getElementById(`${page}-page`);
        if (targetPage) targetPage.classList.add('active');

        const titles = {
            calendar: '排程月曆',
            bookings: '預約管理',
            reports: '報表中心',
            admin: '系統後台',
            medication: '訂藥管理',
            outpatient: '小劑量門診預約'
        };
        const titleEl = document.getElementById('page-title');
        if (titleEl) titleEl.textContent = titles[page];

        state.currentPage = page;

        // Render matching module
        if (page === 'calendar') calendar.render();
        if (page === 'bookings') bookings_module.render('');
        if (page === 'medication' && window.medication_module) window.medication_module.render();
        if (page === 'outpatient' && window.outpatient_module) window.outpatient_module.render();
        if (page === 'reports' && window.report_module) window.report_module.init();
    }
};

export const auth = {
    login(username, password) {
        const user = mockUsers.find(u => u.username === username && u.password === password && u.isActive);
        if (user) {
            state.currentUser = user;
            this.updateUI();
            return true;
        }
        return false;
    },

    logout() {
        state.currentUser = null;
        document.getElementById('dashboard').style.display = 'none';
        document.getElementById('login-page').style.display = 'flex';
    },

    updateUI() {
        document.getElementById('login-page').style.display = 'none';
        document.getElementById('dashboard').style.display = 'grid';

        document.getElementById('user-name').textContent = state.currentUser.name;

        let displayRole = '一般使用者';
        if (state.currentUser.role === 'admin') displayRole = '系統管理員';
        if (state.currentUser.role === 'med_admin') displayRole = '訂藥管理員';

        document.getElementById('user-role').textContent = displayRole;
        document.getElementById('user-avatar').textContent = state.currentUser.name.charAt(0);

        // Security rendering of Navigation Menu 
        const adminItems = document.querySelectorAll('.admin-only');
        adminItems.forEach(item => {
            item.classList.toggle('visible', state.currentUser.role === 'admin');
        });

        const medAdminItems = document.querySelectorAll('.med-admin-only');
        medAdminItems.forEach(item => {
            item.classList.toggle('visible', state.currentUser.role === 'admin' || state.currentUser.role === 'med_admin');
        });

        // Initialize core pages display logic
        calendar.render();
        calendar.renderUpcomingSlots();
        bookings_module.render();
        auditLogs.render();
        if (window.admin) window.admin.render();
        this.updateHeaderDate();
        this.updateStats();

        // 預設切換到月曆
        navigation.goTo('calendar');
    },

    updateHeaderDate() {
        const now = new Date();
        const header = document.getElementById('header-date');
        if (header) {
            header.textContent = now.toLocaleDateString('zh-TW', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                weekday: 'short'
            });
        }
    },

    updateStats() {
        const today = utils.formatDateShort(new Date());
        const todayBookings = mockBookings.filter(b => b.date === today && !b.isOutpatient).length;

        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        const monthBookings = mockBookings.filter(b => {
            if (b.isOutpatient) return false;
            const d = new Date(b.date);
            return d >= monthStart && d <= monthEnd;
        }).length;

        const tbEl = document.getElementById('today-bookings');
        const mbEl = document.getElementById('month-bookings');

        if (tbEl) tbEl.textContent = todayBookings;
        if (mbEl) mbEl.textContent = monthBookings;
    }
};

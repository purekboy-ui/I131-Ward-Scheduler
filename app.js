/**
 * I-131 Ward Scheduling System - Core Application
 * Pure frontend demo with mock data
 */

// ============================================
// Configuration & Constants
// ============================================
const CONFIG = {
    BEDS: ['5B', '6B'],
    BOOKING_DAYS: [2, 5], // Tuesday, Friday
    LOCK_DAYS_INPATIENT: 21,  // 住院預約鎖定天數
    LOCK_DAYS_OUTPATIENT: 21, // 小劑量預約鎖定天數
    HOLIDAYS_2026: [
        '2026-01-01', '2026-01-29', '2026-01-30', '2026-01-31', // 元旦, 春節
        '2026-02-01', '2026-02-02', '2026-02-03',
        '2026-02-28', // 和平紀念日
        '2026-04-04', '2026-04-05', '2026-04-06', // 清明節
        '2026-05-31', // 端午節
        '2026-10-01', '2026-10-02', // 中秋節
        '2026-10-10', // 國慶日
    ]
};

// ============================================
// Mock Data
// ============================================
let mockUsers = [
    { id: 1, username: 'admin', password: 'admin', role: 'admin', name: '系統管理員', isActive: true },
    { id: 2, username: 'user', password: 'user', role: 'user', name: '一般使用者', isActive: true },
    { id: 3, username: 'nurse01', password: 'nurse01', role: 'admin', name: '王護理師', isActive: true },
    { id: 4, username: 'doc01', password: 'doc01', role: 'user', name: '陳醫師', isActive: false },
    { id: 5, username: 'pharma', password: 'pharma', role: 'pharmacist', name: '藥師小王', isActive: true },
    { id: 6, username: 'phar', password: 'phar', role: 'pharmacist', name: '藥師Demo', isActive: true },
];

let mockBookings = [
    { id: 1, date: '2026-01-28', bed: '5B', chartNo: 'A123456789', patientName: '王小明', dose: 150, doctor: '王大明', createdBy: 'admin', createdAt: '2026-01-20 10:30', medType: '錠劑', thyrogen: false, medOrdered: false },
    { id: 2, date: '2026-01-28', bed: '6B', chartNo: 'B987654321', patientName: '李美麗', dose: 100, doctor: '李小華', createdBy: 'admin', createdAt: '2026-01-21 14:15', medType: '水劑', thyrogen: true, medOrdered: true },
    { id: 3, date: '2026-01-30', bed: '5B', chartNo: 'C246813579', patientName: '張大華', dose: 120, doctor: '陳建國', createdBy: 'user', createdAt: '2026-01-22 09:00', medType: '錠劑', thyrogen: false, medOrdered: false },
    { id: 4, date: '2026-02-03', bed: '5B', chartNo: 'D135792468', patientName: '陳小娟', dose: 180, doctor: '王大明', createdBy: 'admin', createdAt: '2026-01-23 11:45', medType: '水劑', thyrogen: false, medOrdered: false },
    { id: 5, date: '2026-02-03', bed: '6B', chartNo: 'E864209753', patientName: '林志明', dose: 130, doctor: '李小華', createdBy: 'user', createdAt: '2026-01-24 16:20', medType: '錠劑', thyrogen: true, medOrdered: true },
    { id: 6, date: '2026-02-06', bed: '5B', chartNo: 'F579135246', patientName: '黃美玲', dose: 110, doctor: '陳建國', createdBy: 'admin', createdAt: '2026-01-25 08:30', medType: '錠劑', thyrogen: false, medOrdered: false },
];

let mockAuditLogs = [
    { id: 1, userId: 'admin', action: 'CREATE', target: 'Booking', targetId: 1, detail: '新增預約：王小明 5B 2026-01-28', timestamp: '2026-01-20 10:30' },
    { id: 2, userId: 'admin', action: 'CREATE', target: 'Booking', targetId: 2, detail: '新增預約：李美麗 6B 2026-01-28', timestamp: '2026-01-21 14:15' },
    { id: 3, userId: 'admin', action: 'UPDATE', target: 'Booking', targetId: 1, detail: '修改劑量：100mCi → 150mCi', timestamp: '2026-01-22 09:30' },
    { id: 4, userId: 'user', action: 'CREATE', target: 'Booking', targetId: 3, detail: '新增預約：張大華 5B 2026-01-30', timestamp: '2026-01-22 09:00' },
];

// Admin overrides for specific dates/beds
let dateOverrides = {};

// ============================================
// State Management
// ============================================
let state = {
    currentUser: null,
    currentPage: 'calendar',
    currentMonth: new Date().getMonth(),
    currentYear: new Date().getFullYear(),
    selectedDate: null,
    editingBooking: null,
    editingUser: null,
    contextMenuBooking: null,
    movingBooking: null,
    logsFiltered: false,
};

// ============================================
// Utility Functions
// ============================================
const utils = {
    formatDate(date) {
        const d = new Date(date);
        return d.toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric' });
    },

    formatDateShort(date) {
        const d = new Date(date);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
    },

    formatWeekday(date) {
        const d = new Date(date);
        return d.toLocaleDateString('zh-TW', { weekday: 'short' });
    },

    isHoliday(dateStr) {
        return CONFIG.HOLIDAYS_2026.includes(dateStr);
    },

    isBookableDay(date, bed = null) {
        const day = date.getDay();
        const dateStr = this.formatDateShort(date);

        // Check bed-specific override
        if (dateOverrides[dateStr]) {
            if (bed && dateOverrides[dateStr][bed] !== undefined) {
                return dateOverrides[dateStr][bed];
            }
            if (dateOverrides[dateStr]['all'] !== undefined) {
                return dateOverrides[dateStr]['all'];
            }
        }

        // Holiday: default closed
        if (this.isHoliday(dateStr)) return false;

        // Default: Tuesday (2) or Friday (5)
        return CONFIG.BOOKING_DAYS.includes(day);
    },

    isBedOpen(dateStr, bed) {
        if (dateOverrides[dateStr] && dateOverrides[dateStr][bed] !== undefined) {
            return dateOverrides[dateStr][bed];
        }
        if (dateOverrides[dateStr] && dateOverrides[dateStr]['all'] !== undefined) {
            return dateOverrides[dateStr]['all'];
        }
        const date = new Date(dateStr);
        if (this.isHoliday(dateStr)) return false;
        return CONFIG.BOOKING_DAYS.includes(date.getDay());
    },

    isDayFullyClosed(dateStr) {
        // Check if ALL beds are closed for this date
        return CONFIG.BEDS.every(bed => !this.isBedOpen(dateStr, bed));
    },

    getBookingsForDate(dateStr) {
        return mockBookings.filter(b => b.date === dateStr);
    },

    getBedStatus(dateStr, bed) {
        return mockBookings.find(b => b.date === dateStr && b.bed === bed) || null;
    },

    generateId() {
        return Math.max(...mockBookings.map(b => b.id), 0) + 1;
    },

    generateUserId() {
        return Math.max(...mockUsers.map(u => u.id), 0) + 1;
    },

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    canUserModify(booking) {
        if (!state.currentUser) return false;

        // admin 擁有最高權限（可修改過去預約等）
        if (state.currentUser.role === 'admin') return true;

        // 防呆：過去的預約資料不允許修改（一般使用者與藥師）
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const bookingDate = new Date(booking.date);
        bookingDate.setHours(0, 0, 0, 0);
        if (bookingDate < today) return false;
        // 藥師不能修改預約
        if (state.currentUser.role === 'pharmacist') return false;
        // 一般使用者只能修改自己的預約
        if (booking.createdBy !== state.currentUser.username) return false;
        // 檢查鎖定期限
        const lockType = booking.isOutpatient ? 'outpatient' : 'inpatient';
        if (this.isLocked(booking.date, lockType)) return false;
        return true;
    },

    getUpcomingAvailableSlots(limit = 10) {
        const slots = [];
        const today = new Date();
        let checkDate = new Date(today);

        for (let i = 0; i < 90 && slots.length < limit; i++) {
            const dateStr = this.formatDateShort(checkDate);

            // 排除被鎖定的日期（住院型）
            if (!this.isLocked(dateStr, 'inpatient')) {
                CONFIG.BEDS.forEach(bed => {
                    if (slots.length >= limit) return;
                    if (this.isBedOpen(dateStr, bed) && !this.getBedStatus(dateStr, bed)) {
                        slots.push({
                            date: dateStr,
                            bed: bed,
                            weekday: this.formatWeekday(checkDate)
                        });
                    }
                });
            }

            checkDate.setDate(checkDate.getDate() + 1);
        }

        return slots;
    },

    // 防呆：距離入住日是否小於鎖定天數
    isLocked(dateStr, type = 'inpatient') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const targetDate = new Date(dateStr);
        targetDate.setHours(0, 0, 0, 0);
        const diffTime = targetDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const lockDays = type === 'outpatient' ? CONFIG.LOCK_DAYS_OUTPATIENT : CONFIG.LOCK_DAYS_INPATIENT;
        return diffDays < lockDays;
    },

    // 向後相容
    isLessThan21Days(dateStr) {
        return this.isLocked(dateStr, 'inpatient');
    }
};

// ============================================
// Toast Notifications
// ============================================
const toast = {
    container: null,

    init() {
        this.container = document.getElementById('toast-container');
    },

    show(message, type = 'success') {
        const icons = { success: '✓', error: '✕', warning: '⚠' };
        const toastEl = document.createElement('div');
        toastEl.className = `toast ${type}`;
        toastEl.innerHTML = `
            <span class="toast-icon">${icons[type]}</span>
            <span class="toast-message">${message}</span>
        `;
        this.container.appendChild(toastEl);
        setTimeout(() => {
            toastEl.style.animation = 'slideInRight 0.3s ease reverse';
            setTimeout(() => toastEl.remove(), 300);
        }, 3000);
    }
};

// ============================================
// Loading Screen
// ============================================
function hideLoadingScreen() {
    const loadingScreen = document.getElementById('loading-screen');
    setTimeout(() => {
        loadingScreen.style.opacity = '0';
        loadingScreen.style.transition = 'opacity 0.5s ease';
        setTimeout(() => {
            loadingScreen.style.display = 'none';
            document.getElementById('login-page').style.display = 'flex';
        }, 500);
    }, 1500);
}

// ============================================
// Authentication
// ============================================
const auth = {
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
        if (state.currentUser.role === 'pharmacist') displayRole = '藥師';
        document.getElementById('user-role').textContent = displayRole;
        document.getElementById('user-avatar').textContent = state.currentUser.name.charAt(0);

        const adminItems = document.querySelectorAll('.admin-only');
        adminItems.forEach(item => {
            item.classList.toggle('visible', state.currentUser.role === 'admin');
        });

        // 藥師可見訂藥管理
        const pharmaItems = document.querySelectorAll('.pharmacist-only');
        pharmaItems.forEach(item => {
            item.style.display = (state.currentUser.role === 'admin' || state.currentUser.role === 'pharmacist') ? '' : 'none';
        });

        calendar.render();
        calendar.renderUpcomingSlots();
        bookings_module.render();
        auditLogs.render();
        admin.render();
        this.updateHeaderDate();
        this.updateStats();
        navigation.goTo('calendar');
    },

    updateHeaderDate() {
        const now = new Date();
        document.getElementById('header-date').textContent = now.toLocaleDateString('zh-TW', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'short'
        });
    },

    updateStats() {
        const today = utils.formatDateShort(new Date());
        const todayBookings = mockBookings.filter(b => b.date === today).length;

        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        const monthBookings = mockBookings.filter(b => {
            const d = new Date(b.date);
            return d >= monthStart && d <= monthEnd;
        }).length;

        document.getElementById('today-bookings').textContent = todayBookings;
        document.getElementById('month-bookings').textContent = monthBookings;
    }
};

// ============================================
// Navigation
// ============================================
const navigation = {
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
        document.getElementById(`${page}-page`).classList.add('active');

        const titles = {
            calendar: '排程月曆',
            bookings: '預約管理',
            reports: '報表中心',
            admin: '系統後台',
            medication: '訂藥管理',
            outpatient: '小劑量預約'
        };
        document.getElementById('page-title').textContent = titles[page] || page;

        state.currentPage = page;

        // Render matching module
        if (page === 'calendar') calendar.render();
        if (page === 'bookings') bookings_module.render();
        if (page === 'medication' && typeof medication_module !== 'undefined') medication_module.render();
        if (page === 'outpatient' && typeof outpatient_module !== 'undefined') outpatient_module.render();
        if (page === 'reports' && typeof report_module !== 'undefined') report_module.init();
    }
};

// ============================================
// Calendar Module
// ============================================
const calendar = {
    init() {
        document.getElementById('prev-month').addEventListener('click', () => this.changeMonth(-1));
        document.getElementById('next-month').addEventListener('click', () => this.changeMonth(1));
        document.getElementById('today-btn').addEventListener('click', () => this.goToToday());
    },

    changeMonth(delta) {
        state.currentMonth += delta;
        if (state.currentMonth > 11) {
            state.currentMonth = 0;
            state.currentYear++;
        } else if (state.currentMonth < 0) {
            state.currentMonth = 11;
            state.currentYear--;
        }
        this.render();
    },

    goToToday() {
        const now = new Date();
        state.currentMonth = now.getMonth();
        state.currentYear = now.getFullYear();
        this.render();
    },

    renderUpcomingSlots() {
        const slots = utils.getUpcomingAvailableSlots(10);
        const container = document.getElementById('upcoming-slots-list');

        if (slots.length === 0) {
            container.innerHTML = '<span style="color: var(--text-muted); font-size: 0.85rem;">近期無可預約時段</span>';
            return;
        }

        container.innerHTML = slots.map(slot => `
            <div class="slot-chip bed-${slot.bed.toLowerCase()}" data-date="${slot.date}" data-bed="${slot.bed}">
                <span>${slot.date.slice(5)} ${slot.weekday}</span>
                <span class="bed">${slot.bed}</span>
            </div>
        `).join('');

        container.querySelectorAll('.slot-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                const date = chip.dataset.date;
                const bed = chip.dataset.bed;
                if (state.movingBooking) {
                    this.moveBookingTo(date, bed);
                } else {
                    modal.openNew(date, bed);
                }
            });
        });
    },

    render() {
        const year = state.currentYear;
        const month = state.currentMonth;

        document.getElementById('calendar-title').textContent = `${year}年 ${month + 1}月`;

        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startingDay = firstDay.getDay();
        const totalDays = lastDay.getDate();
        const prevMonthLastDay = new Date(year, month, 0).getDate();

        const container = document.getElementById('calendar-days');
        container.innerHTML = '';

        const today = utils.formatDateShort(new Date());

        // Previous month days
        for (let i = startingDay - 1; i >= 0; i--) {
            const dayNum = prevMonthLastDay - i;
            container.appendChild(this.createDayElement(dayNum, true, null));
        }

        // Current month days
        for (let day = 1; day <= totalDays; day++) {
            const date = new Date(year, month, day);
            const dateStr = utils.formatDateShort(date);
            const isToday = dateStr === today;
            const bookings = utils.getBookingsForDate(dateStr);
            const isFullyClosed = utils.isDayFullyClosed(dateStr);

            container.appendChild(this.createDayElement(day, false, {
                dateStr, isToday, bookings, date, isFullyClosed
            }));
        }

        // Next month days
        const totalCells = container.children.length;
        const remainingCells = (7 - (totalCells % 7)) % 7;
        for (let i = 1; i <= remainingCells; i++) {
            container.appendChild(this.createDayElement(i, true, null));
        }

        this.renderUpcomingSlots();
    },

    createDayElement(dayNum, isOtherMonth, data) {
        const dayEl = document.createElement('div');
        dayEl.className = 'calendar-day';

        if (isOtherMonth) {
            dayEl.classList.add('other-month');
            dayEl.innerHTML = `<div class="day-header"><span class="day-number">${dayNum}</span></div>`;
            return dayEl;
        }

        const { dateStr, isToday, bookings, date, isFullyClosed } = data;

        if (isToday) dayEl.classList.add('today');

        // Fully closed day - simplified display
        if (isFullyClosed && bookings.length === 0) {
            dayEl.classList.add('closed-day');
            // 即使全部關床仍顯示門診標記
            const opBookings = mockBookings.filter(b => b.date === dateStr && b.isOutpatient);
            let closedContent = `<span class="day-number-centered">${dayNum}</span>`;
            if (opBookings.length > 0) {
                closedContent += `<div class="outpatient-indicator" style="font-size:0.7rem;background:var(--accent);color:#fff;border-radius:8px;padding:1px 6px;margin-top:2px;text-align:center;cursor:default;" title="${opBookings.map(b => b.patientName + ' ' + b.dose + 'mCi').join(', ')}">💊 小劑量×${opBookings.length}</div>`;
            }
            dayEl.innerHTML = closedContent;

            // 任何非藥師使用者都可點擊（admin 管理床位，一般 user 看門診預約）
            if (state.currentUser?.role !== 'pharmacist') {
                dayEl.style.cursor = 'pointer';
                dayEl.addEventListener('click', () => {
                    dayModal.open(dateStr, utils.isHoliday(dateStr), bookings);
                });
            }
            return dayEl;
        }

        // Normal day with bed slots
        dayEl.addEventListener('click', (e) => {
            if (e.target.closest('.bed-slot')) return;

            if (state.movingBooking) {
                const availableBed = CONFIG.BEDS.find(bed =>
                    utils.isBedOpen(dateStr, bed) && !utils.getBedStatus(dateStr, bed)
                );
                if (availableBed) {
                    this.moveBookingTo(dateStr, availableBed);
                } else {
                    toast.show('該日期無可用床位', 'error');
                }
                return;
            }

            if (state.currentUser?.role !== 'pharmacist') {
                dayModal.open(dateStr, utils.isHoliday(dateStr), bookings);
            }
        });

        // Determine status
        let statusClass = 'closed';
        const anyOpen = CONFIG.BEDS.some(bed => utils.isBedOpen(dateStr, bed));

        if (anyOpen) {
            const availableCount = CONFIG.BEDS.filter(bed =>
                utils.isBedOpen(dateStr, bed) && !utils.getBedStatus(dateStr, bed)
            ).length;
            if (availableCount === 2) statusClass = 'available';
            else if (availableCount === 1) statusClass = 'partial';
            else statusClass = 'full';
        }

        // Create bed slots
        let bedsHTML = '';
        CONFIG.BEDS.forEach(bed => {
            const booking = bookings.find(b => b.bed === bed);
            const bedOpen = utils.isBedOpen(dateStr, bed);

            if (booking) {
                const canModify = utils.canUserModify(booking);
                const actionsHTML = canModify ? `
                    <div class="slot-actions">
                        <button class="slot-action-btn edit-slot" data-id="${booking.id}" title="編輯">✏️</button>
                        <button class="slot-action-btn delete delete-slot" data-id="${booking.id}" title="刪除">🗑️</button>
                    </div>
                ` : '';

                // 圖標：劑型 + Thyrogen + 醫師姓氏 + mCi
                const medIcon = booking.medType === '水劑' ? '💧' : '💊';
                const thyIcon = booking.thyrogen ? '<span title="Thyrogen" style="font-weight:800;color:#ff3b30;font-size:0.7rem;margin-left:2px;">T</span>' : '';
                const docChar = booking.doctor ? booking.doctor.charAt(0) : '';
                const infoHTML = `<div style="font-size:0.75rem;display:flex;gap:4px;align-items:center;opacity:0.95;margin-top:2px;width:100%;justify-content:space-between;">
                                    <span>${medIcon}${thyIcon}<span style="color:var(--text-secondary);margin-left:4px;font-weight:500;">${docChar}</span></span>
                                    <span style="font-weight:700;color:var(--text-primary);background:rgba(255,255,255,0.4);padding:1px 4px;border-radius:4px;">${booking.dose}mCi</span>
                                  </div>`;

                bedsHTML += `
                    <div class="bed-slot occupied-${bed.toLowerCase()}" 
                         data-booking-id="${booking.id}"
                         ${canModify ? 'data-can-modify="true"' : ''}
                         style="display:flex;flex-direction:column;align-items:flex-start;padding:6px 10px;color:var(--text-primary);border-left:4px solid var(--bed-${bed.toLowerCase()});">
                        <div style="display:flex;justify-content:space-between;width:100%;align-items:center;">
                            <span class="bed-label" style="font-weight:700;font-size:0.8rem;">${bed}</span>
                            <span class="bed-patient" style="font-weight:600;font-size:0.9rem;">${booking.patientName}</span>
                        </div>
                        ${infoHTML}
                        ${actionsHTML}
                    </div>
                `;
            } else if (bedOpen) {
                bedsHTML += `
                    <div class="bed-slot available" data-date="${dateStr}" data-bed="${bed}" style="opacity:0.7;border:1px dashed var(--border-color);">
                        <span class="bed-label" style="font-weight:700;color:var(--text-muted);">${bed}</span>
                        <span class="bed-patient" style="color:var(--text-muted);font-weight:500;">空床</span>
                    </div>
                `;
            }
        });
        // 取得當天小劑量門診預約
        const outpatientBookings = mockBookings.filter(b => b.date === dateStr && b.isOutpatient);
        let outpatientHTML = '';
        if (outpatientBookings.length > 0) {
            outpatientHTML = `<div class="outpatient-indicator" style="margin-top:6px;display:flex;flex-direction:column;gap:4px;">
                ${outpatientBookings.map(b => `
                    <div style="font-size:0.8rem;background:linear-gradient(135deg, var(--accent) 0%, var(--primary-dark) 100%);color:#fff;border-radius:6px;padding:4px 8px;display:flex;justify-content:space-between;align-items:center;box-shadow:0 2px 4px rgba(0,0,0,0.1);letter-spacing:0.5px;">
                        <span style="font-weight:600;display:flex;align-items:center;gap:4px;">💊 ${b.patientName}</span>
                        <span style="font-size:0.75rem;opacity:0.95;background:rgba(255,255,255,0.2);padding:1px 5px;border-radius:4px;font-weight:700;">${b.dose}mCi</span>
                    </div>
                `).join('')}
            </div>`;
        }

        dayEl.innerHTML = `
            <div class="day-header">
                <span class="day-number">${dayNum}</span>
                <span class="day-status ${statusClass}"></span>
            </div>
            <div class="day-beds">${bedsHTML}</div>
            ${outpatientHTML}
        `;

        // Click handlers
        dayEl.querySelectorAll('.bed-slot.available').forEach(slot => {
            slot.addEventListener('click', (e) => {
                e.stopPropagation();
                const slotDate = slot.dataset.date;
                const bed = slot.dataset.bed;
                // 鎖定檢查交由 modal.openNew 內的 canUserModify 處理或在此前已用 canUserModify 篩選，此處不再重複
                if (state.movingBooking) {
                    this.moveBookingTo(slotDate, bed);
                } else {
                    modal.openNew(slotDate, bed);
                }
            });
        });

        dayEl.querySelectorAll('.bed-slot[data-booking-id]').forEach(slot => {
            slot.addEventListener('click', (e) => {
                e.stopPropagation();
                if (e.target.closest('.slot-action-btn')) return;

                const bookingId = parseInt(slot.dataset.bookingId);
                const booking = mockBookings.find(b => b.id === bookingId);
                if (booking && utils.canUserModify(booking)) {
                    modal.openEdit(booking);
                }
            });

            slot.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const bookingId = parseInt(slot.dataset.bookingId);
                const booking = mockBookings.find(b => b.id === bookingId);
                if (booking && utils.canUserModify(booking)) {
                    contextMenu.show(e.clientX, e.clientY, booking);
                }
            });
        });

        dayEl.querySelectorAll('.edit-slot').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = parseInt(btn.dataset.id);
                const booking = mockBookings.find(b => b.id === id);
                if (booking) modal.openEdit(booking);
            });
        });

        dayEl.querySelectorAll('.delete-slot').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = parseInt(btn.dataset.id);
                bookings_module.delete(id);
            });
        });

        return dayEl;
    },

    moveBookingTo(newDate, newBed) {
        if (!state.movingBooking) return;

        const booking = state.movingBooking;
        const oldDate = booking.date;
        const oldBed = booking.bed;

        if (!utils.isBedOpen(newDate, newBed)) {
            toast.show('該床位未開放', 'error');
            this.cancelMove();
            return;
        }

        if (utils.getBedStatus(newDate, newBed)) {
            toast.show('該床位已被預約', 'error');
            this.cancelMove();
            return;
        }

        booking.date = newDate;
        booking.bed = newBed;
        booking.updatedAt = new Date().toLocaleString('zh-TW');

        mockAuditLogs.unshift({
            id: mockAuditLogs.length + 1,
            userId: state.currentUser.username,
            action: 'UPDATE',
            target: 'Booking',
            targetId: booking.id,
            detail: `移動預約：${booking.patientName} 從 ${oldDate} ${oldBed} 至 ${newDate} ${newBed}`,
            timestamp: new Date().toLocaleString('zh-TW')
        });

        state.movingBooking = null;
        document.body.style.cursor = 'default';

        this.render();
        bookings_module.render();
        auditLogs.render();
        auth.updateStats();
        toast.show(`已移動至 ${newDate} ${newBed}`, 'success');
    },

    cancelMove() {
        state.movingBooking = null;
        document.body.style.cursor = 'default';
    }
};

// ============================================
// Audit Logs Module (in calendar page)
// ============================================
const auditLogs = {
    init() {
        document.getElementById('search-logs-btn').addEventListener('click', () => this.filterLogs());
        document.getElementById('reset-logs-btn').addEventListener('click', () => this.resetFilter());
    },

    render(filteredLogs = null) {
        const container = document.getElementById('audit-list');
        const logs = filteredLogs || mockAuditLogs.slice(0, 10); // Default: last 10

        const icons = { CREATE: '➕', UPDATE: '✏️', DELETE: '🗑️', OVERRIDE: '🔧' };

        if (logs.length === 0) {
            container.innerHTML = '<div style="text-align:center; color: var(--text-muted); padding: var(--space-md);">無符合條件的紀錄</div>';
            return;
        }

        container.innerHTML = logs.map(log => `
            <div class="audit-item">
                <span class="audit-icon">${icons[log.action] || '📝'}</span>
                <div class="audit-content">
                    <div class="audit-detail">${log.detail}</div>
                    <div class="audit-meta">${log.userId} • ${log.timestamp}</div>
                </div>
            </div>
        `).join('');
    },

    filterLogs() {
        const startDate = document.getElementById('log-start-date').value;
        const endDate = document.getElementById('log-end-date').value;

        if (!startDate || !endDate) {
            toast.show('請選擇完整的日期區間', 'warning');
            return;
        }

        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59);

        const filtered = mockAuditLogs.filter(log => {
            const logDate = new Date(log.timestamp);
            return logDate >= start && logDate <= end;
        });

        state.logsFiltered = true;
        this.render(filtered);
        toast.show(`查詢到 ${filtered.length} 筆紀錄`, 'success');
    },

    resetFilter() {
        document.getElementById('log-start-date').value = '';
        document.getElementById('log-end-date').value = '';
        state.logsFiltered = false;
        this.render();
        toast.show('已重置篩選條件', 'success');
    }
};

// ============================================
// Day Modal (Admin bed management)
// ============================================
const dayModal = {
    element: null,

    init() {
        this.element = document.getElementById('day-modal');
        document.getElementById('day-modal-close').addEventListener('click', () => this.close());
        this.element.querySelector('.modal-backdrop').addEventListener('click', () => this.close());
    },

    open(dateStr, isHoliday, bookings) {
        const date = new Date(dateStr);
        const weekday = date.toLocaleDateString('zh-TW', { weekday: 'long' });

        document.getElementById('day-modal-title').textContent = `${utils.formatDate(dateStr)} 管理`;

        document.getElementById('day-info').innerHTML = `
            <h4>${utils.formatDate(dateStr)}</h4>
            <p>${weekday}${isHoliday ? ' • 國定假日' : ''}</p>
        `;

        const bedsControl = document.getElementById('day-beds-control');
        const isAdmin = state.currentUser?.role === 'admin';

        // 非 admin 隱藏床位控制區
        if (!isAdmin) {
            bedsControl.innerHTML = '';
            bedsControl.style.display = 'none';
        } else {
            bedsControl.style.display = '';
            bedsControl.innerHTML = CONFIG.BEDS.map(bed => {
                const isOpen = utils.isBedOpen(dateStr, bed);
                const booking = utils.getBedStatus(dateStr, bed);
                const disabled = booking ? 'disabled' : '';

                return `
                    <div class="bed-control-item">
                        <span class="bed-name">${bed} 床位</span>
                        <label class="toggle-switch">
                            <input type="checkbox" data-date="${dateStr}" data-bed="${bed}" 
                                   ${isOpen ? 'checked' : ''} ${disabled}>
                            <span class="toggle-slider"></span>
                        </label>
                    </div>
                `;
            }).join('');

            bedsControl.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
                checkbox.addEventListener('change', () => {
                    const d = checkbox.dataset.date;
                    const b = checkbox.dataset.bed;
                    this.toggleBed(d, b, checkbox.checked);
                });
            });
        }

        const bookingsList = document.getElementById('day-bookings-list');
        // 住院預約（只有 admin 才顯示）
        if (isAdmin && bookings.length > 0) {
            bookingsList.innerHTML = `
                <h5>當日住院預約</h5>
                ${bookings.map(b => `
                    <div class="day-booking-item">
                        <span class="bed-badge bed-${b.bed.toLowerCase()}">${b.bed}</span>
                        <span>${b.patientName}</span>
                        <span style="color: var(--text-muted)">${b.doctor}</span>
                    </div>
                `).join('')}
            `;
        } else if (isAdmin) {
            bookingsList.innerHTML = '<p style="color: var(--text-muted); font-size: 0.85rem; text-align: center;">尚無住院預約</p>';
        } else {
            bookingsList.innerHTML = '';
        }

        // 小劑量預約區塊
        const dateObj = new Date(dateStr);
        const dayOfWeek = dateObj.getDay(); // 0=Sun, 1=Mon, ...
        const isOutpatientDay = [1, 3, 4].includes(dayOfWeek); // 週一三四
        const opBookings = mockBookings.filter(b => b.date === dateStr && b.isOutpatient);
        const todayForOp = new Date();
        todayForOp.setHours(0, 0, 0, 0);
        dateObj.setHours(0, 0, 0, 0);
        const isPastDate = dateObj < todayForOp;

        let opHTML = '';
        if (opBookings.length > 0) {
            opHTML += `<h5 style="margin-top:12px;">💊 當日小劑量服藥</h5>`;
            opHTML += opBookings.map(b => `
                <div class="day-booking-item" style="justify-content:space-between;">
                    <span>${b.patientName} <span style="color:var(--text-muted);font-size:0.85rem;">${b.dose}mCi ${b.medType || '錠劑'}</span></span>
                    ${utils.canUserModify(b) ? `<button class="btn-sm delete delete-op-cal" data-id="${b.id}" style="padding:2px 6px;font-size:0.75rem;">刪除</button>` : ''}
                </div>
            `).join('');
        }

        if (isOutpatientDay && !isPastDate && state.currentUser?.role !== 'pharmacist') {
            opHTML += `<button class="btn-primary" id="add-op-from-cal" style="margin-top:8px;width:100%;padding:6px;font-size:0.85rem;">➕ 新增小劑量預約 (<30mCi)</button>`;
        } else if (!isOutpatientDay) {
            opHTML += `<p style="color:var(--text-muted);font-size:0.8rem;margin-top:8px;text-align:center;">小劑量預約僅開放週一、三、四</p>`;
        }

        bookingsList.insertAdjacentHTML('beforeend', opHTML);

        // 綁定小劑量刪除按鈕
        bookingsList.querySelectorAll('.delete-op-cal').forEach(btn => {
            btn.addEventListener('click', () => {
                outpatient_module.delete(parseInt(btn.dataset.id));
                this.close();
            });
        });

        // 綁定新增小劑量按鈕
        const addOpBtn = bookingsList.querySelector('#add-op-from-cal');
        if (addOpBtn) {
            addOpBtn.addEventListener('click', () => {
                this.close();
                outpatient_module.openModal(dateStr);
            });
        }

        this.element.classList.add('active');
    },

    toggleBed(dateStr, bed, isOpen) {
        if (!dateOverrides[dateStr]) {
            dateOverrides[dateStr] = {};
        }
        dateOverrides[dateStr][bed] = isOpen;

        mockAuditLogs.unshift({
            id: mockAuditLogs.length + 1,
            userId: state.currentUser.username,
            action: 'OVERRIDE',
            target: 'Bed',
            targetId: `${dateStr}-${bed}`,
            detail: `${isOpen ? '開放' : '關閉'}床位：${dateStr} ${bed}`,
            timestamp: new Date().toLocaleString('zh-TW')
        });

        calendar.render();
        auditLogs.render();
        toast.show(`${bed} 床位已${isOpen ? '開放' : '關閉'}`, 'success');
    },

    close() {
        this.element.classList.remove('active');
    }
};

// ============================================
// Context Menu
// ============================================
const contextMenu = {
    element: null,
    booking: null,

    init() {
        this.element = document.getElementById('context-menu');
        document.addEventListener('click', () => this.hide());

        this.element.querySelectorAll('.context-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                this.handleAction(item.dataset.action);
            });
        });
    },

    show(x, y, booking) {
        this.booking = booking;
        this.element.style.left = `${x}px`;
        this.element.style.top = `${y}px`;
        this.element.classList.add('active');
    },

    hide() {
        this.element.classList.remove('active');
        this.booking = null;
    },

    handleAction(action) {
        if (!this.booking) return;

        switch (action) {
            case 'edit':
                modal.openEdit(this.booking);
                break;
            case 'move':
                state.movingBooking = this.booking;
                document.body.style.cursor = 'move';
                toast.show('請點擊目標日期/床位', 'warning');
                break;
            case 'delete':
                bookings_module.delete(this.booking.id);
                break;
        }

        this.hide();
    }
};

// ============================================
// Bookings Module
// ============================================
const bookings_module = {
    init() {
        document.getElementById('search-input').addEventListener('input',
            utils.debounce((e) => this.search(e.target.value), 300)
        );
        // 日期區間篩選
        const startDateEl = document.getElementById('booking-filter-start');
        const endDateEl = document.getElementById('booking-filter-end');
        const filterBtn = document.getElementById('booking-filter-btn');
        const resetBtn = document.getElementById('booking-filter-reset');
        if (filterBtn) filterBtn.addEventListener('click', () => this.render());
        if (resetBtn) resetBtn.addEventListener('click', () => {
            if (startDateEl) startDateEl.value = '';
            if (endDateEl) endDateEl.value = '';
            document.getElementById('search-input').value = '';
            this.render();
        });
        // 包含小劑量門診 checkbox
        const opCheckbox = document.getElementById('booking-include-op');
        if (opCheckbox) opCheckbox.addEventListener('change', () => this.render());
    },

    render(filter = '') {
        const tbody = document.getElementById('bookings-tbody');
        const includeOp = document.getElementById('booking-include-op')?.checked;
        let data = [...mockBookings];
        if (!includeOp) data = data.filter(b => !b.isOutpatient);
        data.sort((a, b) => new Date(b.date) - new Date(a.date));

        // 日期區間篩選
        const startDateVal = document.getElementById('booking-filter-start')?.value;
        const endDateVal = document.getElementById('booking-filter-end')?.value;
        if (startDateVal) data = data.filter(b => b.date >= startDateVal);
        if (endDateVal) data = data.filter(b => b.date <= endDateVal);

        if (!filter) filter = document.getElementById('search-input')?.value || '';
        if (filter) {
            const f = filter.toLowerCase();
            data = data.filter(b =>
                b.patientName.toLowerCase().includes(f) ||
                b.chartNo.toLowerCase().includes(f) ||
                b.doctor.toLowerCase().includes(f) ||
                (b.createdBy || '').toLowerCase().includes(f)
            );
        }

        tbody.innerHTML = data.map(booking => {
            const canModify = utils.canUserModify(booking);
            const typeBadge = booking.isOutpatient
                ? '<span class="bed-badge" style="background:#f0fff4;color:#38a169;">小劑量</span>'
                : `<span class="bed-badge bed-${booking.bed.toLowerCase()}">${booking.bed}</span>`;
            const createdByUser = mockUsers.find(u => u.username === booking.createdBy);
            const createdByName = createdByUser ? createdByUser.name : (booking.createdBy || '-');
            return `
                <tr>
                    <td>${utils.formatDate(booking.date)}</td>
                    <td>${typeBadge}</td>
                    <td>${booking.chartNo}</td>
                    <td>${booking.patientName}</td>
                    <td>${booking.dose} mCi</td>
                    <td>${booking.medType === '水劑' ? '<span style="color:#e53e3e;font-weight:700;">💧 水劑</span>' : (booking.medType || '錠劑')}</td>
                    <td>${booking.isOutpatient ? '-' : (booking.thyrogen ? '✅' : '-')}</td>
                    <td>${booking.isOutpatient ? '-' : `<span class="status-badge ${booking.medOrdered ? 'active' : 'inactive'}">${booking.medOrdered ? '已訂藥' : '未訂藥'}</span>`}</td>
                    <td>${booking.doctor}</td>
                    <td><span style="font-size:0.85rem;color:var(--text-muted);">${createdByName}</span></td>
                    <td>
                        <div class="action-btns">
                            ${canModify && !booking.isOutpatient ? `
                                <button class="btn-sm edit-btn" data-id="${booking.id}" title="編輯">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                                    </svg>
                                </button>
                                <button class="btn-sm move-btn" data-id="${booking.id}" title="移動">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M5 9l-3 3 3 3"/>
                                        <path d="M9 5l3-3 3 3"/>
                                        <path d="M15 19l3-3-3-3"/>
                                        <path d="M19 9l-3 3 3 3"/>
                                        <path d="M2 12h20"/>
                                        <path d="M12 2v20"/>
                                    </svg>
                                </button>
                                <button class="btn-sm delete delete-btn" data-id="${booking.id}" title="刪除">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <polyline points="3 6 5 6 21 6"/>
                                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                                    </svg>
                                </button>
                            ` : (canModify && booking.isOutpatient ? `
                                <button class="btn-sm delete delete-btn" data-id="${booking.id}" title="刪除">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <polyline points="3 6 5 6 21 6"/>
                                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                                    </svg>
                                </button>
                            ` : '<span style="color: var(--text-muted); font-size: 0.75rem;">無權限</span>')}
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

        tbody.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = parseInt(btn.dataset.id);
                const booking = mockBookings.find(b => b.id === id);
                if (booking) modal.openEdit(booking);
            });
        });

        tbody.querySelectorAll('.move-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = parseInt(btn.dataset.id);
                const booking = mockBookings.find(b => b.id === id);
                if (booking) {
                    state.movingBooking = booking;
                    document.body.style.cursor = 'move';
                    navigation.goTo('calendar');
                    toast.show('請在月曆上點擊目標日期/床位', 'warning');
                }
            });
        });

        tbody.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.delete(parseInt(btn.dataset.id));
            });
        });
    },

    search(query) {
        this.render(query);
    },

    delete(id) {
        const booking = mockBookings.find(b => b.id === id);
        if (!booking) return;

        if (!utils.canUserModify(booking)) {
            toast.show('您沒有權限刪除此預約', 'error');
            return;
        }

        // 鎖定檢查已由 canUserModify 處理

        if (confirm(`確定要刪除 ${booking.patientName} 的預約嗎？`)) {
            mockBookings = mockBookings.filter(b => b.id !== id);

            const isPast = new Date(booking.date) < new Date(new Date().setHours(0, 0, 0, 0));
            mockAuditLogs.unshift({
                id: mockAuditLogs.length + 1,
                userId: state.currentUser.username,
                action: 'DELETE',
                target: 'Booking',
                targetId: id,
                detail: `刪除${isPast ? '【歷史】' : ''}預約：${booking.patientName} ${booking.bed} ${booking.date}`,
                timestamp: new Date().toLocaleString('zh-TW')
            });

            this.render();
            calendar.render();
            auditLogs.render();
            auth.updateStats();
            toast.show('預約已刪除', 'success');
        }
    }
};

const bookings = bookings_module;

// ============================================
// Modal Module
// ============================================
const modal = {
    element: null,
    form: null,

    init() {
        this.element = document.getElementById('booking-modal');
        this.form = document.getElementById('booking-form');

        document.getElementById('modal-close').addEventListener('click', () => this.close());
        document.getElementById('modal-cancel').addEventListener('click', () => this.close());
        this.element.querySelector('.modal-backdrop').addEventListener('click', () => this.close());

        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.save();
        });
    },

    openNew(date = '', bed = '') {
        state.editingBooking = null;
        document.getElementById('modal-title').textContent = '新增預約';
        this.form.reset();

        // 鎖定與過去日期檢查
        if (date && state.currentUser?.role !== 'admin') {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const bookingDate = new Date(date);
            bookingDate.setHours(0, 0, 0, 0);
            if (bookingDate < today) {
                toast.show('無法新增過去的預約', 'error');
                return;
            }
            if (utils.isLocked(date, 'inpatient')) {
                toast.show(`距離入住不足 ${CONFIG.LOCK_DAYS_INPATIENT} 天，已鎖定`, 'warning');
                return;
            }
        }

        if (date) document.getElementById('booking-date').value = date;
        if (bed) {
            const radio = this.form.querySelector(`input[name="bed"][value="${bed}"]`);
            if (radio) radio.checked = true;
        }

        this.element.classList.add('active');
    },

    openEdit(booking) {
        if (!utils.canUserModify(booking)) {
            toast.show('您沒有權限編輯此預約', 'error');
            return;
        }

        // 鎖定檢查已由 canUserModify 處理

        state.editingBooking = booking;
        document.getElementById('modal-title').textContent = '編輯預約';

        document.getElementById('booking-date').value = booking.date;
        document.getElementById('booking-chart').value = booking.chartNo;
        document.getElementById('booking-name').value = booking.patientName;
        document.getElementById('booking-dose').value = booking.dose;
        document.getElementById('booking-doctor').value = booking.doctor;

        const medTypeEl = document.getElementById('booking-med-type');
        if (medTypeEl) medTypeEl.value = booking.medType || '錠劑';
        const thyrogenEl = document.getElementById('booking-thyrogen');
        if (thyrogenEl) thyrogenEl.value = booking.thyrogen ? 'true' : 'false';

        const radio = this.form.querySelector(`input[name="bed"][value="${booking.bed}"]`);
        if (radio) radio.checked = true;

        this.element.classList.add('active');
    },

    close() {
        this.element.classList.remove('active');
        state.editingBooking = null;
    },

    save() {
        const formData = {
            date: document.getElementById('booking-date').value,
            bed: this.form.querySelector('input[name="bed"]:checked')?.value,
            chartNo: document.getElementById('booking-chart').value,
            patientName: document.getElementById('booking-name').value,
            dose: parseInt(document.getElementById('booking-dose').value),
            doctor: document.getElementById('booking-doctor').value,
            medType: document.getElementById('booking-med-type') ? document.getElementById('booking-med-type').value : '錠劑',
            thyrogen: document.getElementById('booking-thyrogen') ? document.getElementById('booking-thyrogen').value === 'true' : false,
        };

        if (!formData.bed) {
            toast.show('請選擇床位', 'error');
            return;
        }

        if (!utils.isBedOpen(formData.date, formData.bed)) {
            toast.show('該床位未開放', 'error');
            return;
        }

        const existingBooking = mockBookings.find(b =>
            b.date === formData.date &&
            b.bed === formData.bed &&
            (!state.editingBooking || b.id !== state.editingBooking.id)
        );
        if (existingBooking) {
            toast.show('該床位已被預約', 'error');
            return;
        }

        if (state.editingBooking) {
            const index = mockBookings.findIndex(b => b.id === state.editingBooking.id);
            if (index !== -1) {
                const oldDose = mockBookings[index].dose;
                mockBookings[index] = {
                    ...mockBookings[index],
                    ...formData,
                    updatedAt: new Date().toLocaleString('zh-TW')
                };

                const isPast = new Date(formData.date) < new Date(new Date().setHours(0, 0, 0, 0));
                mockAuditLogs.unshift({
                    id: mockAuditLogs.length + 1,
                    userId: state.currentUser.username,
                    action: 'UPDATE',
                    target: 'Booking',
                    targetId: state.editingBooking.id,
                    detail: `修改${isPast ? '【歷史】' : ''}預約：${formData.patientName}，劑量 ${oldDose}mCi → ${formData.dose}mCi`,
                    timestamp: new Date().toLocaleString('zh-TW')
                });

                toast.show('預約已更新', 'success');
            }
        } else {
            const newBooking = {
                id: utils.generateId(),
                ...formData,
                medOrdered: false,
                createdBy: state.currentUser.username,
                createdAt: new Date().toLocaleString('zh-TW')
            };
            mockBookings.push(newBooking);

            mockAuditLogs.unshift({
                id: mockAuditLogs.length + 1,
                userId: state.currentUser.username,
                action: 'CREATE',
                target: 'Booking',
                targetId: newBooking.id,
                detail: `新增預約：${formData.patientName} ${formData.bed} ${formData.date}`,
                timestamp: new Date().toLocaleString('zh-TW')
            });

            toast.show('預約已建立', 'success');
        }

        this.close();
        calendar.render();
        bookings_module.render();
        auditLogs.render();
        auth.updateStats();
    }
};

// ============================================
// Admin Module (User Management)
// ============================================
const admin = {
    init() {
        document.getElementById('add-user-btn').addEventListener('click', () => {
            userModal.openNew();
        });

        // 鎖定天數設定（住院 + 小劑量）
        const lockInp = document.getElementById('lock-days-inpatient');
        const lockOp = document.getElementById('lock-days-outpatient');
        const saveBtn = document.getElementById('save-lock-days');
        const hint = document.getElementById('lock-days-hint');
        if (lockInp) lockInp.value = CONFIG.LOCK_DAYS_INPATIENT;
        if (lockOp) lockOp.value = CONFIG.LOCK_DAYS_OUTPATIENT;
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                const valInp = parseInt(lockInp.value);
                const valOp = parseInt(lockOp.value);
                if (isNaN(valInp) || valInp < 0 || valInp > 90 || isNaN(valOp) || valOp < 0 || valOp > 90) {
                    toast.show('請輸入 0~90 的整數', 'error');
                    return;
                }
                const oldInp = CONFIG.LOCK_DAYS_INPATIENT;
                const oldOp = CONFIG.LOCK_DAYS_OUTPATIENT;
                CONFIG.LOCK_DAYS_INPATIENT = valInp;
                CONFIG.LOCK_DAYS_OUTPATIENT = valOp;
                if (hint) hint.textContent = `已儲存（住院 ${oldInp}→${valInp}天，小劑量 ${oldOp}→${valOp}天）`;
                mockAuditLogs.unshift({
                    id: mockAuditLogs.length + 1,
                    userId: state.currentUser.username,
                    action: 'CONFIG',
                    target: 'System',
                    targetId: 0,
                    detail: `變更鎖定天數：住院 ${oldInp}→${valInp}天，小劑量 ${oldOp}→${valOp}天`,
                    timestamp: new Date().toLocaleString('zh-TW')
                });
                calendar.renderUpcomingSlots();
                toast.show('鎖定天數已更新', 'success');
            });
        }
    },

    render() {
        if (state.currentUser?.role !== 'admin') return;

        // 同步鎖定天數
        const lockInp = document.getElementById('lock-days-inpatient');
        const lockOp = document.getElementById('lock-days-outpatient');
        if (lockInp) lockInp.value = CONFIG.LOCK_DAYS_INPATIENT;
        if (lockOp) lockOp.value = CONFIG.LOCK_DAYS_OUTPATIENT;

        const roleNames = { admin: '管理員', pharmacist: '藥師', user: '使用者' };
        const tbody = document.getElementById('users-tbody');
        tbody.innerHTML = mockUsers.map(user => `
            <tr>
                <td>${user.username}</td>
                <td>${user.name}</td>
                <td><span class="role-badge ${user.role}">${roleNames[user.role] || user.role}</span></td>
                <td><span class="status-badge ${user.isActive ? 'active' : 'inactive'}">${user.isActive ? '啟用' : '停用'}</span></td>
                <td>
                    <div class="action-btns">
                        <button class="btn-sm edit-user-btn" data-id="${user.id}" title="編輯">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                            </svg>
                        </button>
                        ${user.id !== state.currentUser.id ? `
                            <button class="btn-sm toggle-user-btn ${user.isActive ? 'delete' : ''}" data-id="${user.id}" title="${user.isActive ? '停用' : '啟用'}">
                                ${user.isActive ? '🚫' : '✅'}
                            </button>
                        ` : ''}
                    </div>
                </td>
            </tr>
        `).join('');

        tbody.querySelectorAll('.edit-user-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const user = mockUsers.find(u => u.id === parseInt(btn.dataset.id));
                if (user) userModal.openEdit(user);
            });
        });

        tbody.querySelectorAll('.toggle-user-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const user = mockUsers.find(u => u.id === parseInt(btn.dataset.id));
                if (user) {
                    user.isActive = !user.isActive;
                    this.render();
                    toast.show(`帳號已${user.isActive ? '啟用' : '停用'}`, 'success');
                }
            });
        });
    }
};

// ============================================
// User Modal
// ============================================
const userModal = {
    element: null,
    form: null,

    init() {
        this.element = document.getElementById('user-modal');
        this.form = document.getElementById('user-form');

        document.getElementById('user-modal-close').addEventListener('click', () => this.close());
        document.getElementById('user-modal-cancel').addEventListener('click', () => this.close());
        this.element.querySelector('.modal-backdrop').addEventListener('click', () => this.close());

        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.save();
        });
    },

    openNew() {
        state.editingUser = null;
        document.getElementById('user-modal-title').textContent = '新增使用者';
        this.form.reset();
        document.getElementById('user-username').disabled = false;
        document.getElementById('user-password').required = true;
        document.getElementById('user-active').checked = true;
        this.element.classList.add('active');
    },

    openEdit(user) {
        state.editingUser = user;
        document.getElementById('user-modal-title').textContent = '編輯使用者';

        document.getElementById('user-username').value = user.username;
        document.getElementById('user-username').disabled = true;
        document.getElementById('user-password').value = '';
        document.getElementById('user-password').required = false;
        document.getElementById('user-display-name').value = user.name;
        document.getElementById('user-role-select').value = user.role;
        document.getElementById('user-active').checked = user.isActive;

        this.element.classList.add('active');
    },

    close() {
        this.element.classList.remove('active');
        state.editingUser = null;
    },

    save() {
        const username = document.getElementById('user-username').value;
        const password = document.getElementById('user-password').value;
        const name = document.getElementById('user-display-name').value;
        const role = document.getElementById('user-role-select').value;
        const isActive = document.getElementById('user-active').checked;

        if (state.editingUser) {
            const user = mockUsers.find(u => u.id === state.editingUser.id);
            if (user) {
                if (password) user.password = password;
                user.name = name;
                user.role = role;
                user.isActive = isActive;
                toast.show('使用者資料已更新', 'success');
            }
        } else {
            if (mockUsers.find(u => u.username === username)) {
                toast.show('帳號已存在', 'error');
                return;
            }

            mockUsers.push({
                id: utils.generateUserId(),
                username,
                password,
                name,
                role,
                isActive
            });
            toast.show('使用者已新增', 'success');
        }

        this.close();
        admin.render();
    }
};

// ============================================
// Mobile Menu
// ============================================
function initMobileMenu() {
    const menuToggle = document.getElementById('menu-toggle');
    const sidebar = document.querySelector('.sidebar');

    menuToggle.addEventListener('click', () => {
        sidebar.classList.toggle('open');
    });

    document.addEventListener('click', (e) => {
        if (window.innerWidth <= 1024 &&
            !sidebar.contains(e.target) &&
            !menuToggle.contains(e.target)) {
            sidebar.classList.remove('open');
        }
    });
}

// ============================================
// Form Initialization
// ============================================
function initLoginForm() {
    document.getElementById('login-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        if (auth.login(username, password)) {
            toast.show(`歡迎回來，${state.currentUser.name}！`, 'success');
        } else {
            toast.show('帳號或密碼錯誤', 'error');
        }
    });
}

function initLogout() {
    document.getElementById('logout-btn').addEventListener('click', () => {
        auth.logout();
        toast.show('已登出系統', 'success');
    });
}

// ============================================
// Keyboard Shortcuts
// ============================================
function initKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (state.movingBooking) {
                calendar.cancelMove();
                toast.show('已取消移動', 'warning');
            }
            contextMenu.hide();
        }
    });
}

// ============================================
// Medication Module (訂藥管理)
// ============================================
const medication_module = {
    init() {
        const searchInput = document.getElementById('med-search-input');
        if (searchInput) {
            searchInput.addEventListener('input', utils.debounce((e) => {
                this.render(e.target.value);
            }, 300));
        }
        const filterUnorder = document.getElementById('med-filter-unorder');
        if (filterUnorder) {
            filterUnorder.addEventListener('change', () => {
                this.render(document.getElementById('med-search-input')?.value || '');
            });
        }
        // 日期區間篩選
        const medStart = document.getElementById('med-filter-start');
        const medEnd = document.getElementById('med-filter-end');
        if (medStart) medStart.addEventListener('change', () => this.render());
        if (medEnd) medEnd.addEventListener('change', () => this.render());

        // 快捷按鈕
        document.querySelectorAll('.med-quick-filter').forEach(btn => {
            btn.addEventListener('click', () => {
                const days = parseInt(btn.dataset.days);
                const today = new Date();
                const future = new Date(today);
                future.setDate(future.getDate() + days);
                if (medStart) medStart.value = utils.formatDateShort(today);
                if (medEnd) medEnd.value = utils.formatDateShort(future);
                this.render();
            });
        });
        const resetBtn = document.getElementById('med-filter-reset');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                if (medStart) medStart.value = '';
                if (medEnd) medEnd.value = '';
                this.render();
            });
        }

        const printBtn = document.getElementById('med-print-btn');
        if (printBtn) printBtn.addEventListener('click', () => this.printList());

        const exportBtn = document.getElementById('med-export-excel-btn');
        if (exportBtn) exportBtn.addEventListener('click', () => this.exportExcel());
    },

    getFilteredData(searchQuery = '') {
        let filtered = mockBookings.filter(b => !b.isOutpatient);
        const startVal = document.getElementById('med-filter-start')?.value;
        const endVal = document.getElementById('med-filter-end')?.value;
        if (startVal) filtered = filtered.filter(b => b.date >= startVal);
        if (endVal) filtered = filtered.filter(b => b.date <= endVal);

        const showOnlyUnordered = document.getElementById('med-filter-unorder')?.checked;
        if (showOnlyUnordered) filtered = filtered.filter(b => !b.medOrdered);
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            filtered = filtered.filter(b => b.chartNo.toLowerCase().includes(q) || b.patientName.toLowerCase().includes(q));
        }
        filtered.sort((a, b) => new Date(a.date) - new Date(b.date));
        return filtered;
    },

    render(searchQuery = '') {
        const tbody = document.getElementById('medication-tbody');
        if (!tbody) return;
        const role = state.currentUser?.role;
        if (role !== 'admin' && role !== 'pharmacist') {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color: var(--error);">無權限檢視此頁面</td></tr>`;
            return;
        }
        const isPharmacist = (role === 'pharmacist');
        let filtered = this.getFilteredData(searchQuery);

        if (filtered.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color: var(--text-muted); padding: var(--space-xl);">目前沒有需處理的訂藥資料</td></tr>`;
            return;
        }
        tbody.innerHTML = filtered.map(b => {
            const isOrdered = b.medOrdered;
            const statusClass = isOrdered ? 'status-badge active' : 'status-badge inactive';
            const statusText = isOrdered ? '已訂藥' : '未訂藥';
            const btnText = isOrdered ? '取消訂藥' : '確認訂藥';
            const btnClass = isOrdered ? 'btn-outline' : 'btn-primary';
            const thyrogenBadge = b.thyrogen ? `<span class="bed-badge" style="background:var(--accent);">Yes</span>` : `<span style="color:var(--text-muted)">-</span>`;
            // 藥師：劑量/劑型均唯讀
            const doseDisabled = (isOrdered || isPharmacist) ? 'disabled' : '';
            return `<tr>
                <td><div style="font-weight:500">${b.date}</div><div style="font-size:0.85rem;color:var(--text-muted)">${new Date(b.date).toLocaleDateString('zh-TW', { weekday: 'short' })}</div></td>
                <td><span class="bed-badge bed-${b.bed.toLowerCase()}">${b.bed}</span></td>
                <td><div style="font-weight:500">${b.patientName}</div><div class="mono" style="font-size:0.85rem;color:var(--text-muted)">${b.chartNo}</div></td>
                <td><div style="display:flex;gap:8px;align-items:center;"><input type="number" class="med-dose-input" data-id="${b.id}" value="${b.dose}" style="width:70px;padding:4px;" ${doseDisabled}> mCi
                    <select class="med-type-select" data-id="${b.id}" style="padding:4px;${b.medType === '水劑' ? 'background:#fff0f0;color:#e53e3e;font-weight:700;border:2px solid #e53e3e;' : ''}" ${doseDisabled}>
                        <option value="錠劑" ${b.medType === '錠劑' || !b.medType ? 'selected' : ''}>💊 錠劑</option>
                        <option value="水劑" ${b.medType === '水劑' ? 'selected' : ''}>💧 水劑</option>
                    </select></div></td>
                <td>${thyrogenBadge}</td>
                <td><div style="display:flex;flex-direction:column;gap:6px;align-items:flex-start;">
                    <span class="${statusClass}">${statusText}</span>
                    <button class="${btnClass} med-toggle-btn" data-id="${b.id}" style="padding:4px 8px;font-size:0.85rem;">${btnText}</button>
                </div></td>
            </tr>`;
        }).join('');

        tbody.querySelectorAll('.med-dose-input, .med-type-select').forEach(input => {
            input.addEventListener('change', (e) => {
                const id = parseInt(e.target.dataset.id);
                const booking = mockBookings.find(b => b.id === id);
                if (!booking) return;
                const row = e.target.closest('tr');
                const newDose = parseFloat(row.querySelector('.med-dose-input').value);
                const newType = row.querySelector('.med-type-select').value;
                booking.dose = newDose;
                booking.medType = newType;
                toast.show('已自動儲存劑量與劑型', 'success');
            });
        });
        tbody.querySelectorAll('.med-toggle-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = parseInt(btn.dataset.id);
                const booking = mockBookings.find(b => b.id === id);
                if (!booking) return;
                booking.medOrdered = !booking.medOrdered;
                const actionText = booking.medOrdered ? '確認已訂藥' : '已取消訂藥';
                mockAuditLogs.unshift({
                    id: mockAuditLogs.length + 1,
                    userId: state.currentUser.username,
                    action: 'UPDATE',
                    target: 'Booking',
                    targetId: id,
                    detail: `訂藥狀態：${booking.patientName} (${actionText})`,
                    timestamp: new Date().toLocaleString('zh-TW')
                });
                toast.show(actionText, 'success');
                this.render(document.getElementById('med-search-input')?.value || '');
            });
        });
    },

    printList() {
        const query = document.getElementById('med-search-input')?.value || '';
        const data = this.getFilteredData(query);
        if (data.length === 0) { toast.show('無資料可列印', 'warning'); return; }

        let html = `
            <html><head><title>訂藥管理清單</title>
            <style>
                body { font-family: sans-serif; padding: 20px; }
                h2 { text-align: center; margin-bottom: 20px; }
                table { width: 100%; border-collapse: collapse; font-size: 14px; margin-bottom: 30px; }
                th, td { border: 1px solid #ccc; padding: 8px 12px; text-align: left; }
                th { background-color: #f5f5f5; }
                .text-center { text-align: center; }
                @media print { body { padding: 0; } button { display: none; } }
            </style>
            </head><body>
            <h2>核醫科 I-131 訂藥管理清單</h2>
            <div style="margin-bottom: 15px; text-align: right; font-size: 12px; color: #666;">列印時間：${new Date().toLocaleString('zh-TW')}</div>
            <table>
                <thead>
                    <tr>
                        <th>入住日期</th>
                        <th>床位</th>
                        <th>病歷號</th>
                        <th>病患姓名</th>
                        <th>劑量(mCi)</th>
                        <th>劑型</th>
                        <th>Thyrogen</th>
                        <th>狀態</th>
                    </tr>
                </thead>
                <tbody>
        `;
        data.forEach(b => {
            html += `<tr>
                <td>${b.date}</td>
                <td class="text-center">${b.bed}</td>
                <td>${b.chartNo}</td>
                <td>${b.patientName}</td>
                <td class="text-center">${b.dose}</td>
                <td class="text-center">${b.medType || '錠劑'}</td>
                <td class="text-center">${b.thyrogen ? 'Yes' : 'No'}</td>
                <td class="text-center">${b.medOrdered ? '已訂藥' : '未訂藥'}</td>
            </tr>`;
        });
        html += `</tbody></table>
            <div style="text-align: center; margin-top: 20px;">
                <button onclick="window.print()" style="padding: 10px 20px; font-size: 16px; cursor: pointer;">確認列印</button>
            </div>
            </body></html>
        `;
        const printWin = window.open('', '_blank');
        printWin.document.write(html);
        printWin.document.close();
        // Automatically trigger print dialog after a slight delay to ensure rendering
        setTimeout(() => printWin.print(), 500);
    },

    exportExcel() {
        const query = document.getElementById('med-search-input')?.value || '';
        const data = this.getFilteredData(query);
        if (data.length === 0) { toast.show('無資料可匯出', 'warning'); return; }

        let csvContent = '\uFEFF';
        csvContent += '入住日期,床位,病歷號,病患姓名,醫令劑量(mCi),劑型,Thyrogen,訂藥狀態\n';
        data.forEach(row => {
            const status = row.medOrdered ? '已訂藥' : '未訂藥';
            const rowData = [row.date, row.bed, row.chartNo, row.patientName, row.dose, row.medType || '錠劑', row.thyrogen ? '是' : '否', status];
            csvContent += rowData.map(val => `"${String(val).replace(/"/g, '""')}"`).join(',') + '\n';
        });

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        const d = new Date();
        const dateStr = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
        link.setAttribute('href', url);
        link.setAttribute('download', `訂藥管理清單_${dateStr}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast.show('Excel報表下載成功', 'success');
    }
};

// ============================================
// Outpatient Module (小劑量預約)
// ============================================
const outpatient_module = {
    init() {
        const addBtn = document.getElementById('add-outpatient-btn');
        if (addBtn) addBtn.addEventListener('click', () => this.openModal());
        this.createModal();
    },

    createModal() {
        let m = document.getElementById('outpatient-modal');
        if (m) return;
        m = document.createElement('div');
        m.id = 'outpatient-modal';
        m.className = 'modal';
        m.innerHTML = `
            <div class="modal-backdrop"></div>
            <div class="modal-content">
                <div class="modal-header">
                    <h3>新增小劑量預約 (<30mCi)</h3>
                    <button class="btn-close" id="op-modal-close">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                    </button>
                </div>
                <form id="op-booking-form" class="modal-body">
                    <div class="form-row"><div class="form-group">
                        <label>給藥日期 (僅限週一、三、四)</label>
                        <input type="date" id="op-booking-date" required>
                        <div id="op-date-error" style="color:var(--error);font-size:0.8rem;margin-top:4px;display:none;">僅開放星期一、三、四</div>
                    </div></div>
                    <div class="form-row">
                        <div class="form-group"><label>病歷號</label><input type="text" id="op-booking-chart" placeholder="例：A123456789" required></div>
                        <div class="form-group"><label>病患姓名</label><input type="text" id="op-booking-name" placeholder="請輸入姓名" required></div>
                    </div>
                    <div class="form-row">
                        <div class="form-group"><label>服用劑量 (<30mCi)</label><input type="number" id="op-booking-dose" placeholder="例：29" max="29" required></div>
                        <div class="form-group"><label>主治醫師</label><input type="text" id="op-booking-doctor" placeholder="請輸入醫師名稱" required></div>
                    </div>
                    <div class="form-row"><div class="form-group"><label>劑型</label>
                        <select id="op-booking-med-type"><option value="錠劑">錠劑</option><option value="水劑">水劑</option></select>
                    </div></div>
                </form>
                <div class="modal-footer">
                    <button type="button" class="btn-outline" id="op-modal-cancel">取消</button>
                    <button type="submit" form="op-booking-form" class="btn-primary" id="op-save-btn">確認預約</button>
                </div>
            </div>`;
        document.body.appendChild(m);
        m.querySelector('#op-modal-close').addEventListener('click', () => this.closeModal());
        m.querySelector('#op-modal-cancel').addEventListener('click', () => this.closeModal());
        m.querySelector('.modal-backdrop').addEventListener('click', () => this.closeModal());
        const dateInput = m.querySelector('#op-booking-date');
        const dateError = m.querySelector('#op-date-error');
        const saveBtn = m.querySelector('#op-save-btn');
        dateInput.addEventListener('change', () => {
            const d = new Date(dateInput.value);
            const day = d.getDay();
            if (![1, 3, 4].includes(day)) { dateError.style.display = 'block'; saveBtn.disabled = true; }
            else { dateError.style.display = 'none'; saveBtn.disabled = false; }
        });
        m.querySelector('#op-booking-form').addEventListener('submit', (e) => { e.preventDefault(); this.save(); });
    },

    render() {
        const tbody = document.getElementById('outpatient-tbody');
        if (!tbody) return;
        let filtered = mockBookings.filter(b => b.isOutpatient);
        filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
        if (filtered.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:var(--text-muted);padding:var(--space-xl);">目前無小劑量預約</td></tr>`;
            return;
        }
        tbody.innerHTML = filtered.map(b => {
            const canModify = utils.canUserModify(b);
            return `<tr>
                <td><div style="font-weight:500">${b.date}</div><div style="font-size:0.85rem;color:var(--text-muted)">${new Date(b.date).toLocaleDateString('zh-TW', { weekday: 'short' })}</div></td>
                <td><div style="font-weight:500">${b.patientName}</div><div class="mono" style="font-size:0.85rem;color:var(--text-muted)">${b.chartNo}</div></td>
                <td><div style="font-weight:600;color:var(--primary)">${b.dose} mCi</div></td>
                <td>${b.medType || '錠劑'}</td>
                <td>${b.doctor}</td>
                <td>${canModify ? `<button class="btn-icon delete delete-op-btn" data-id="${b.id}" title="刪除">🗑️</button>` : ''}</td>
            </tr>`;
        }).join('');
        tbody.querySelectorAll('.delete-op-btn').forEach(btn => {
            btn.addEventListener('click', () => this.delete(parseInt(btn.dataset.id)));
        });
    },

    openModal(prefillDate = '') {
        const m = document.getElementById('outpatient-modal');
        if (!m) return;
        document.getElementById('op-booking-form').reset();
        document.getElementById('op-date-error').style.display = 'none';
        document.getElementById('op-save-btn').disabled = false;
        if (prefillDate) {
            document.getElementById('op-booking-date').value = prefillDate;
        }
        m.classList.add('active');
    },

    closeModal() {
        const m = document.getElementById('outpatient-modal');
        if (m) m.classList.remove('active');
    },

    save() {
        const dose = parseFloat(document.getElementById('op-booking-dose').value);
        if (dose >= 30) { toast.show('小劑量預約必須 < 30mCi', 'error'); return; }
        const newBooking = {
            id: utils.generateId(),
            date: document.getElementById('op-booking-date').value,
            bed: '小劑量',
            isOutpatient: true,
            chartNo: document.getElementById('op-booking-chart').value.toUpperCase(),
            patientName: document.getElementById('op-booking-name').value,
            dose: dose,
            doctor: document.getElementById('op-booking-doctor').value,
            medType: document.getElementById('op-booking-med-type').value,
            createdBy: state.currentUser.username,
            createdAt: new Date().toLocaleString('zh-TW')
        };
        mockBookings.push(newBooking);
        mockAuditLogs.unshift({
            id: mockAuditLogs.length + 1,
            userId: state.currentUser.username,
            action: 'CREATE',
            target: 'Booking_OP',
            targetId: newBooking.id,
            detail: `新增小劑量預約：${newBooking.patientName} (${newBooking.dose}mCi)`,
            timestamp: new Date().toLocaleString('zh-TW')
        });
        toast.show('小劑量預約已建立', 'success');
        this.closeModal();
        this.render();
        calendar.render(); // 同步刷新月曆
    },

    delete(id) {
        if (!confirm('確定要刪除此小劑量預約嗎？')) return;
        const index = mockBookings.findIndex(b => b.id === id);
        if (index === -1) return;
        const booking = mockBookings[index];
        mockBookings.splice(index, 1);
        const isPast = new Date(booking.date) < new Date(new Date().setHours(0, 0, 0, 0));
        mockAuditLogs.unshift({
            id: mockAuditLogs.length + 1,
            userId: state.currentUser.username,
            action: 'DELETE',
            target: 'Booking_OP',
            targetId: id,
            detail: `刪除${isPast ? '【歷史】' : ''}小劑量預約：${booking.patientName} (${booking.dose}mCi)`,
            timestamp: new Date().toLocaleString('zh-TW')
        });
        this.render();
        calendar.render();
        toast.show('小劑量預約已刪除', 'success');
    }
};

// ============================================
// Report Module (月結報表)
// ============================================
const report_module = {
    init() {
        const btn = document.getElementById('extract-month-report');
        if (btn) btn.addEventListener('click', () => this.generateMonthlyReport());
    },

    generateMonthlyReport() {
        const targetYear = state.currentYear;
        const targetMonth = state.currentMonth;
        const firstDay = new Date(targetYear, targetMonth, 1);
        const lastDay = new Date(targetYear, targetMonth + 1, 0);
        let reportData = mockBookings.filter(b => {
            const bDate = new Date(b.date);
            return bDate >= firstDay && bDate <= lastDay && !b.isOutpatient;
        });
        if (reportData.length === 0) { toast.show('本月份無住院排程資料可匯出', 'warning'); return; }
        reportData.sort((a, b) => { if (a.date !== b.date) return new Date(a.date) - new Date(b.date); return a.bed.localeCompare(b.bed); });
        let csvContent = '\uFEFF';
        csvContent += '入住日期,床位,病歷號,病患姓名,醫令劑量(mCi),劑型,Thyrogen,主治醫師\n';
        reportData.forEach(row => {
            const rowData = [row.date, row.bed, row.chartNo, row.patientName, row.dose, row.medType || '錠劑', row.thyrogen ? '是' : '否', row.doctor];
            csvContent += rowData.map(val => `"${String(val).replace(/"/g, '""')}"`).join(',') + '\n';
        });
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        const monthStr = String(targetMonth + 1).padStart(2, '0');
        link.setAttribute('href', url);
        link.setAttribute('download', `I131月結報表_${targetYear}${monthStr}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast.show('月結報表下載成功', 'success');
    }
};

// ============================================
// Initialize Application
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    toast.init();
    hideLoadingScreen();
    initLoginForm();
    initLogout();
    initMobileMenu();
    initKeyboardShortcuts();
    navigation.init();
    calendar.init();
    bookings_module.init();
    modal.init();
    dayModal.init();
    contextMenu.init();
    auditLogs.init();
    admin.init();
    userModal.init();
    medication_module.init();
    outpatient_module.init();
    report_module.init();
});

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
];

let mockBookings = [
    { id: 1, date: '2026-01-28', bed: '5B', chartNo: 'A123456789', patientName: '王小明', dose: 150, doctor: '王大明', createdBy: 'admin', createdAt: '2026-01-20 10:30' },
    { id: 2, date: '2026-01-28', bed: '6B', chartNo: 'B987654321', patientName: '李美麗', dose: 100, doctor: '李小華', createdBy: 'admin', createdAt: '2026-01-21 14:15' },
    { id: 3, date: '2026-01-30', bed: '5B', chartNo: 'C246813579', patientName: '張大華', dose: 120, doctor: '陳建國', createdBy: 'user', createdAt: '2026-01-22 09:00' },
    { id: 4, date: '2026-02-03', bed: '5B', chartNo: 'D135792468', patientName: '陳小娟', dose: 180, doctor: '王大明', createdBy: 'admin', createdAt: '2026-01-23 11:45' },
    { id: 5, date: '2026-02-03', bed: '6B', chartNo: 'E864209753', patientName: '林志明', dose: 130, doctor: '李小華', createdBy: 'user', createdAt: '2026-01-24 16:20' },
    { id: 6, date: '2026-02-06', bed: '5B', chartNo: 'F579135246', patientName: '黃美玲', dose: 110, doctor: '陳建國', createdBy: 'admin', createdAt: '2026-01-25 08:30' },
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
        if (state.currentUser.role === 'admin') return true;
        return booking.createdBy === state.currentUser.username;
    },

    getUpcomingAvailableSlots(limit = 10) {
        const slots = [];
        const today = new Date();
        let checkDate = new Date(today);

        for (let i = 0; i < 90 && slots.length < limit; i++) {
            const dateStr = this.formatDateShort(checkDate);

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

            checkDate.setDate(checkDate.getDate() + 1);
        }

        return slots;
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
        document.getElementById('user-role').textContent = state.currentUser.role === 'admin' ? '系統管理員' : '一般使用者';
        document.getElementById('user-avatar').textContent = state.currentUser.name.charAt(0);

        const adminItems = document.querySelectorAll('.admin-only');
        adminItems.forEach(item => {
            item.classList.toggle('visible', state.currentUser.role === 'admin');
        });

        calendar.render();
        calendar.renderUpcomingSlots();
        bookings_module.render();
        auditLogs.render();
        admin.render();
        this.updateHeaderDate();
        this.updateStats();
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
            admin: '後台管理'
        };
        document.getElementById('page-title').textContent = titles[page];

        state.currentPage = page;
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
            dayEl.innerHTML = `<span class="day-number-centered">${dayNum}</span>`;

            // Admin can still click to manage
            if (state.currentUser?.role === 'admin') {
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

            if (state.currentUser?.role === 'admin') {
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

                bedsHTML += `
                    <div class="bed-slot occupied-${bed.toLowerCase()}" 
                         data-booking-id="${booking.id}"
                         ${canModify ? 'data-can-modify="true"' : ''}>
                        <span class="bed-label">${bed}</span>
                        <span class="bed-patient">${booking.patientName}</span>
                        ${actionsHTML}
                    </div>
                `;
            } else if (bedOpen) {
                bedsHTML += `
                    <div class="bed-slot available" data-date="${dateStr}" data-bed="${bed}">
                        <span class="bed-label">${bed}</span>
                        <span class="bed-patient">空床</span>
                    </div>
                `;
            }
        });

        dayEl.innerHTML = `
            <div class="day-header">
                <span class="day-number">${dayNum}</span>
                <span class="day-status ${statusClass}"></span>
            </div>
            <div class="day-beds">${bedsHTML}</div>
        `;

        // Click handlers
        dayEl.querySelectorAll('.bed-slot.available').forEach(slot => {
            slot.addEventListener('click', (e) => {
                e.stopPropagation();
                const slotDate = slot.dataset.date;
                const bed = slot.dataset.bed;
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

        const bookingsList = document.getElementById('day-bookings-list');
        if (bookings.length > 0) {
            bookingsList.innerHTML = `
                <h5>當日預約</h5>
                ${bookings.map(b => `
                    <div class="day-booking-item">
                        <span class="bed-badge bed-${b.bed.toLowerCase()}">${b.bed}</span>
                        <span>${b.patientName}</span>
                        <span style="color: var(--text-muted)">${b.doctor}</span>
                    </div>
                `).join('')}
            `;
        } else {
            bookingsList.innerHTML = '<p style="color: var(--text-muted); font-size: 0.85rem; text-align: center;">尚無預約</p>';
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
    },

    render(filter = '') {
        const tbody = document.getElementById('bookings-tbody');
        let data = [...mockBookings].sort((a, b) => new Date(b.date) - new Date(a.date));

        if (filter) {
            const f = filter.toLowerCase();
            data = data.filter(b =>
                b.patientName.toLowerCase().includes(f) ||
                b.chartNo.toLowerCase().includes(f) ||
                b.doctor.toLowerCase().includes(f)
            );
        }

        tbody.innerHTML = data.map(booking => {
            const canModify = utils.canUserModify(booking);
            return `
                <tr>
                    <td>${utils.formatDate(booking.date)}</td>
                    <td><span class="bed-badge bed-${booking.bed.toLowerCase()}">${booking.bed}</span></td>
                    <td>${booking.chartNo}</td>
                    <td>${booking.patientName}</td>
                    <td>${booking.dose}</td>
                    <td>${booking.doctor}</td>
                    <td>
                        <div class="action-btns">
                            ${canModify ? `
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
                            ` : '<span style="color: var(--text-muted); font-size: 0.75rem;">無權限</span>'}
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

        if (confirm(`確定要刪除 ${booking.patientName} 的預約嗎？`)) {
            mockBookings = mockBookings.filter(b => b.id !== id);

            mockAuditLogs.unshift({
                id: mockAuditLogs.length + 1,
                userId: state.currentUser.username,
                action: 'DELETE',
                target: 'Booking',
                targetId: id,
                detail: `刪除預約：${booking.patientName} ${booking.bed} ${booking.date}`,
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

        state.editingBooking = booking;
        document.getElementById('modal-title').textContent = '編輯預約';

        document.getElementById('booking-date').value = booking.date;
        document.getElementById('booking-chart').value = booking.chartNo;
        document.getElementById('booking-name').value = booking.patientName;
        document.getElementById('booking-dose').value = booking.dose;
        document.getElementById('booking-doctor').value = booking.doctor;

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

                mockAuditLogs.unshift({
                    id: mockAuditLogs.length + 1,
                    userId: state.currentUser.username,
                    action: 'UPDATE',
                    target: 'Booking',
                    targetId: state.editingBooking.id,
                    detail: `修改預約：${formData.patientName}，劑量 ${oldDose}mCi → ${formData.dose}mCi`,
                    timestamp: new Date().toLocaleString('zh-TW')
                });

                toast.show('預約已更新', 'success');
            }
        } else {
            const newBooking = {
                id: utils.generateId(),
                ...formData,
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
    },

    render() {
        if (state.currentUser?.role !== 'admin') return;

        const tbody = document.getElementById('users-tbody');
        tbody.innerHTML = mockUsers.map(user => `
            <tr>
                <td>${user.username}</td>
                <td>${user.name}</td>
                <td><span class="role-badge ${user.role}">${user.role === 'admin' ? '管理員' : '使用者'}</span></td>
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
});

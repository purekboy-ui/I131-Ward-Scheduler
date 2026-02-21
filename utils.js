import { mockBookings, mockUsers, mockAuditLogs, dateOverrides, CONFIG, state } from './store.js';

export const utils = {
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
        return mockBookings.length > 0 ? Math.max(...mockBookings.map(b => b.id)) + 1 : 1;
    },

    generateUserId() {
        return mockUsers.length > 0 ? Math.max(...mockUsers.map(u => u.id)) + 1 : 1;
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
        // 如果具有訂藥管理員權限，也可視為 admin
        if (state.currentUser.role === 'med_admin') return true;

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
    },

    // 防呆：距離入住日是否小於 21 天
    isLessThan21Days(dateStr) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const targetDate = new Date(dateStr);
        targetDate.setHours(0, 0, 0, 0);

        const diffTime = targetDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        return diffDays < 21;
    }
};

export const toast = {
    container: null,

    init() {
        this.container = document.getElementById('toast-container');
    },

    show(message, type = 'success') {
        if (!this.container) this.init();

        const icons = { success: '✓', error: '✕', warning: '⚠', info: 'ℹ️' };
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

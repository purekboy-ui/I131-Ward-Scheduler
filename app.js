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
    { id: 1, username: 'admin', password: 'admin', role: 'manager', name: '系統管理員', isActive: true },
    { id: 2, username: 'user', password: 'user', role: 'editor', name: '一般使用者', isActive: true },
];

const ROLE_LABELS = {
    manager: '管理員',
    super_editor: '排程管理',
    editor: '一般使用者',
    viewer: '檢視'
};

function dosageFormToMedType(dosageForm) {
    return dosageForm === 'Solution' ? '水劑' : '錠劑';
}

function getBookingField(booking, keys, fallback = undefined) {
    for (const key of keys) {
        if (booking[key] !== undefined && booking[key] !== null) return booking[key];
    }
    return fallback;
}

function normalizeBooleanValue(value) {
    if (typeof value === 'string') {
        return ['true', '1', 'yes', 'on'].includes(value.toLowerCase());
    }
    return Boolean(value);
}

function normalizeNumberValue(value) {
    if (value === '' || value === null || value === undefined) return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
}

function normalizeDateValue(value) {
    if (!value) return '';
    if (value instanceof Date) {
        const year = value.getFullYear();
        const month = String(value.getMonth() + 1).padStart(2, '0');
        const day = String(value.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
    return String(value).slice(0, 10);
}

// Keep booking reads/writes insulated from future data shape changes.
function normalizeBooking(booking = {}) {
    const bookingType = getBookingField(booking, ['bookingType', 'booking_type'])
        || (normalizeBooleanValue(getBookingField(booking, ['isOutpatient', 'is_outpatient'])) ? 'outpatient' : 'inpatient');
    const dosageForm = getBookingField(booking, ['dosageForm', 'dosage_form'])
        || (getBookingField(booking, ['medType', 'med_type']) === '水劑' ? 'Solution' : 'Capsule');
    const status = getBookingField(booking, ['status', 'booking_status'], '待確認');
    const branch = getBookingField(booking, ['branch', 'hospital_branch'], '義大');
    const radiotracer = getBookingField(booking, ['radiotracer', 'radiotracer_name'], 'I-131');
    const chartNo = getBookingField(booking, ['chartNo', 'chart_no'], '');
    const patientName = getBookingField(booking, ['patientName', 'patient_name'], '');
    const doctor = getBookingField(booking, ['doctor', 'doctor_name'], '');
    const date = normalizeDateValue(getBookingField(booking, ['date', 'booking_date'], ''));
    const dose = normalizeNumberValue(getBookingField(booking, ['dose', 'doseMci', 'dose_mci'], null));
    const isOutpatient = bookingType === 'outpatient';

    return {
        branch: '義大',
        radiotracer: 'I-131',
        dosageForm,
        medType: getBookingField(booking, ['medType', 'med_type'], dosageFormToMedType(dosageForm)),
        bookingType,
        isOutpatient,
        status,
        reason: '',
        medOrdered: false,
        thyrogen: false,
        ...booking,
        id: getBookingField(booking, ['id', 'booking_id'], booking.id),
        date,
        bed: getBookingField(booking, ['bed', 'bed_code'], isOutpatient ? null : ''),
        branch,
        chartNo: String(chartNo || '').trim(),
        patientName: String(patientName || '').trim(),
        dose,
        doctor: String(doctor || '').trim(),
        radiotracer,
        dosageForm,
        medType: getBookingField(booking, ['medType', 'med_type'], dosageFormToMedType(dosageForm)),
        bookingType,
        isOutpatient,
        status,
        medOrdered: normalizeBooleanValue(getBookingField(booking, ['medOrdered', 'med_ordered'], false)),
        thyrogen: normalizeBooleanValue(getBookingField(booking, ['thyrogen', 'use_thyrogen'], false)),
        createdBy: getBookingField(booking, ['createdBy', 'created_by'], ''),
        createdAt: getBookingField(booking, ['createdAt', 'created_at'], ''),
        updatedAt: getBookingField(booking, ['updatedAt', 'updated_at'], ''),
        updatedBy: getBookingField(booking, ['updatedBy', 'updated_by'], '')
    };
}

function normalizeBookingCollection(bookings = []) {
    return bookings.map((booking) => normalizeBooking(booking));
}

function upsertBookingRecord(nextBooking) {
    const normalizedBooking = normalizeBooking(nextBooking);
    const index = mockBookings.findIndex((booking) => booking.id === normalizedBooking.id);

    if (index === -1) {
        mockBookings.push(normalizedBooking);
    } else {
        mockBookings[index] = normalizedBooking;
    }

    return normalizedBooking;
}

let mockBookings = [
    { id: 1, date: '2026-05-29', bed: '5B', branch: '義大', chartNo: 'A123456789', patientName: '王小明', dose: 150, doctor: '王大明', createdBy: 'user', createdAt: '2026-05-21 10:30', radiotracer: 'I-131', dosageForm: 'Capsule', thyrogen: false, status: '待確認', medOrdered: false },
    { id: 2, date: '2026-05-29', bed: '6B', branch: '癌醫', chartNo: 'B987654321', patientName: '李美麗', dose: 100, doctor: '李小華', createdBy: 'admin', createdAt: '2026-05-21 14:15', radiotracer: 'I-131', dosageForm: 'Solution', thyrogen: true, status: '已確認', medOrdered: true },
    { id: 3, date: '2026-06-02', bed: '5B', branch: '大昌', chartNo: '', patientName: '待補資料', dose: null, doctor: '', createdBy: 'user', createdAt: '2026-05-22 09:00', radiotracer: 'I-131', dosageForm: 'Capsule', thyrogen: false, status: '待確認', medOrdered: false },
    { id: 4, date: '2026-06-05', bed: '6B', branch: '義大', chartNo: 'F579135246', patientName: '黃美玲', dose: 110, doctor: '陳建國', createdBy: 'admin', createdAt: '2026-05-23 08:30', radiotracer: 'I-131', dosageForm: 'Capsule', thyrogen: false, status: '已確認', medOrdered: false },
    { id: 5, date: '2026-06-01', bed: null, branch: '義大', chartNo: 'OP001', patientName: '吳佳穎', dose: 25, doctor: '王大明', createdBy: 'user', createdAt: '2026-05-24 08:45', radiotracer: 'I-131', dosageForm: 'Capsule', thyrogen: false, status: '待確認', medOrdered: false, bookingType: 'outpatient', isOutpatient: true },
    { id: 6, date: '2026-06-01', bed: null, branch: '癌醫', chartNo: 'OP002', patientName: '張家淳', dose: 20, doctor: '李小華', createdBy: 'admin', createdAt: '2026-05-24 09:10', radiotracer: 'I-131', dosageForm: 'Solution', thyrogen: false, status: '已確認', medOrdered: false, bookingType: 'outpatient', isOutpatient: true },
    { id: 7, date: '2026-06-01', bed: null, branch: '大昌', chartNo: 'OP003', patientName: '林怡如', dose: 15, doctor: '陳建國', createdBy: 'user', createdAt: '2026-05-24 09:25', radiotracer: 'I-131', dosageForm: 'Capsule', thyrogen: false, status: '待確認', medOrdered: false, bookingType: 'outpatient', isOutpatient: true },
];
mockBookings = normalizeBookingCollection(mockBookings);

let mockDoctors = Array.from(
    new Set(
        mockBookings
            .map((booking) => (booking.doctor || '').trim())
            .filter(Boolean)
    )
).map((name, index) => ({ id: index + 1, name }));

let mockAuditLogs = [
    { id: 1, userId: 'user', action: 'CREATE', target: 'Booking', targetId: 1, detail: '新增預約：王小明 5B 2026-05-29', timestamp: '2026-05-21 10:30' },
    { id: 2, userId: 'admin', action: 'CREATE', target: 'Booking', targetId: 2, detail: '新增預約：李美麗 6B 2026-05-29', timestamp: '2026-05-21 14:15' },
    { id: 3, userId: 'admin', action: 'UPDATE', target: 'Booking', targetId: 2, detail: '確認收單：李美麗', timestamp: '2026-05-23 09:30' },
    { id: 4, userId: 'user', action: 'CREATE', target: 'Booking', targetId: 3, detail: '新增預約：待補資料 5B 2026-06-02', timestamp: '2026-05-22 09:00' },
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
    calendarMode: 'inpatient',
    selectedDate: null,
    editingBooking: null,
    editingUser: null,
    editingDoctor: null,
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

    formatWeekdayCompact(date) {
        return this.formatWeekday(date).replace('週', '');
    },

    escapeHtml(value) {
        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
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

    getBookingsForDate(dateStr, type = 'all') {
        return mockBookings.filter((booking) => {
            if (booking.date !== dateStr) return false;
            if (type === 'inpatient') return !this.isOutpatientBooking(booking);
            if (type === 'outpatient') return this.isOutpatientBooking(booking);
            return true;
        });
    },

    getBedStatus(dateStr, bed) {
        return mockBookings.find(b => b.date === dateStr && !this.isOutpatientBooking(b) && b.bed === bed) || null;
    },

    generateId() {
        return Math.max(...mockBookings.map(b => b.id), 0) + 1;
    },

    generateUserId() {
        return Math.max(...mockUsers.map(u => u.id), 0) + 1;
    },

    generateDoctorId() {
        return Math.max(...mockDoctors.map(d => d.id), 0) + 1;
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

    isOutpatientBooking(booking) {
        return booking.bookingType === 'outpatient' || booking.isOutpatient;
    },

    isManager() {
        return state.currentUser?.role === 'manager';
    },

    isPrivilegedEditor() {
        return state.currentUser?.role === 'manager' || state.currentUser?.role === 'super_editor';
    },

    canConfirmReceipt(booking) {
        if (!state.currentUser) return false;
        return this.isManager() && booking.status === '待確認' && this.hasCoreBookingData(booking);
    },

    getMissingCoreFields(booking) {
        const missing = [];
        if (!(booking.chartNo || '').trim()) missing.push('病歷號');
        if (!(booking.patientName || '').trim()) missing.push('病人姓名');
        if (!Number.isFinite(normalizeNumberValue(booking.dose))) missing.push('劑量');
        if (!(booking.doctor || '').trim()) missing.push('主治醫師');
        return missing;
    },

    hasCoreBookingData(booking) {
        return this.getMissingCoreFields(booking).length === 0;
    },

    getRoleLabel(role) {
        return ROLE_LABELS[role] || role;
    },

    getBookingTypeLabel(booking) {
        return this.isOutpatientBooking(booking) ? '門診' : (booking.bed || '住院');
    },

    getBookingStatusMeta(status) {
        if (status === '已確認') return { badgeClass: 'active', chipClass: 'confirmed', label: '已確認' };
        if (status === '待確認') return { badgeClass: 'pending', chipClass: 'pending', label: '待確認' };
        return { badgeClass: 'inactive', chipClass: 'inactive', label: status || '未設定' };
    },

    getBookingStatusClass(status) {
        return this.getBookingStatusMeta(status).badgeClass;
    },

    formatDose(dose) {
        return Number.isFinite(dose) ? `${dose}` : '待填';
    },

    syncDoctorDirectory(name) {
        const normalizedName = (name || '').trim();
        if (!normalizedName || mockDoctors.some((doctor) => doctor.name === normalizedName)) return;
        mockDoctors.push({ id: this.generateDoctorId(), name: normalizedName });
    },

    ensureDoctorDirectory() {
        mockBookings.forEach((booking) => {
            this.syncDoctorDirectory(booking.doctor);
        });
    },

    isOutpatientBookableDate(dateStr) {
        if (!dateStr) return false;
        const date = new Date(dateStr);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        date.setHours(0, 0, 0, 0);
        return date >= today;
    },

    canUserModify(booking) {
        if (!state.currentUser) return false;

        if (this.isManager()) return true;

        if (state.currentUser.role === 'viewer') return false;

        if (booking.createdBy !== state.currentUser.username) return false;
        if (booking.status === '已確認') return false;
        return true;
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

    getUpcomingOutpatientSlots(limit = 10) {
        const slots = [];
        const today = new Date();
        let checkDate = new Date(today);

        for (let i = 0; i < 90 && slots.length < limit; i++) {
            const dateStr = this.formatDateShort(checkDate);
            if (this.isOutpatientBookableDate(dateStr)) {
                slots.push({
                    date: dateStr,
                    weekday: this.formatWeekday(checkDate)
                });
            }
            checkDate.setDate(checkDate.getDate() + 1);
        }

        return slots;
    },

    getCalendarMonthlyMetrics(year, month, mode = state.calendarMode) {
        const totalDays = new Date(year, month + 1, 0).getDate();

        if (mode === 'outpatient') {
            const summary = {
                confirmed: 0,
                pending: 0,
                total: 0,
                scheduledDays: 0
            };

            for (let day = 1; day <= totalDays; day++) {
                const dateStr = this.formatDateShort(new Date(year, month, day));
                const bookings = this.getBookingsForDate(dateStr, 'outpatient');

                if (bookings.length > 0) summary.scheduledDays += 1;

                bookings.forEach((booking) => {
                    const statusMeta = this.getBookingStatusMeta(booking.status);
                    if (statusMeta.badgeClass === 'active') summary.confirmed += 1;
                    else summary.pending += 1;
                });
            }

            summary.total = summary.confirmed + summary.pending;
            return summary;
        }

        const summary = {
            confirmed: 0,
            pending: 0,
            available: 0,
            closed: 0
        };

        for (let day = 1; day <= totalDays; day++) {
            const dateStr = this.formatDateShort(new Date(year, month, day));

            CONFIG.BEDS.forEach((bed) => {
                if (!this.isBedOpen(dateStr, bed)) {
                    summary.closed += 1;
                    return;
                }

                const booking = this.getBedStatus(dateStr, bed);
                if (!booking) {
                    summary.available += 1;
                    return;
                }

                const statusMeta = this.getBookingStatusMeta(booking.status);
                if (statusMeta.badgeClass === 'active') summary.confirmed += 1;
                else summary.pending += 1;
            });
        }

        return summary;
    },

    isLocked(dateStr, type = 'inpatient') {
        return false;
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
        const iconEl = document.createElement('span');
        iconEl.className = 'toast-icon';
        iconEl.textContent = icons[type] || 'ℹ';
        const messageEl = document.createElement('span');
        messageEl.className = 'toast-message';
        messageEl.textContent = String(message ?? '');
        toastEl.append(iconEl, messageEl);
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
    }, 180);
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
        document.getElementById('user-role').textContent = utils.getRoleLabel(state.currentUser.role);
        document.getElementById('user-avatar').textContent = state.currentUser.name.charAt(0);

        document.querySelectorAll('.manager-only').forEach((item) => {
            item.style.display = utils.isManager() ? 'flex' : 'none';
        });
        document.querySelectorAll('.privileged-only').forEach((item) => {
            item.style.display = utils.isPrivilegedEditor() ? 'flex' : 'none';
        });
        document.querySelectorAll('.staff-only').forEach((item) => {
            item.style.display = state.currentUser?.role !== 'viewer' ? 'flex' : 'none';
        });

        calendar.render();
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
            calendar: '預約排程',
            bookings: '預約管理',
            audit: '操作紀錄查詢',
            reports: '報表中心',
            admin: '後台管理',
            medication: '訂藥管理',
            outpatient: '小劑量預約'
        };
        document.getElementById('page-title').textContent = titles[page] || page;

        state.currentPage = page;

        // Render matching module
        if (page === 'calendar') calendar.render();
        if (page === 'bookings') bookings_module.render();
        if (page === 'audit') auditLogs.render();
        if (page === 'admin') admin.render();
        if (page === 'medication') medication_module.render();
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
        document.querySelectorAll('.mode-tab').forEach((tab) => {
            tab.addEventListener('click', () => {
                state.calendarMode = tab.dataset.mode;
                this.render();
            });
        });
    },

    updateModeTabs() {
        document.querySelectorAll('.mode-tab').forEach((tab) => {
            tab.classList.toggle('active', tab.dataset.mode === state.calendarMode);
        });
    },

    updateWeekdayHighlights() {
        const highlightDays = state.calendarMode === 'outpatient' ? [1, 3, 4] : [2, 5];
        document.querySelectorAll('.calendar-weekdays .weekday').forEach((weekday, index) => {
            weekday.classList.toggle('highlight', highlightDays.includes(index));
        });
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
        const title = document.getElementById('upcoming-slots-title');
        const container = document.getElementById('upcoming-slots-list');
        if (!container) return;
        const isOutpatientMode = state.calendarMode === 'outpatient';
        const slots = isOutpatientMode ? utils.getUpcomingOutpatientSlots(8) : utils.getUpcomingAvailableSlots(8);

        if (title) {
            title.textContent = isOutpatientMode ? '💊 最近可安排門診小劑量' : '🗓️ 最近可預約床位';
        }

        if (slots.length === 0) {
            container.innerHTML = `<span style="color: var(--text-muted); font-size: 0.85rem;">近期無可${isOutpatientMode ? '安排門診小劑量' : '預約時段'}</span>`;
            return;
        }

        container.innerHTML = slots.map(slot => `
            <div class="slot-chip ${isOutpatientMode ? 'slot-chip-outpatient' : `bed-${slot.bed.toLowerCase()}`}" data-date="${slot.date}" ${slot.bed ? `data-bed="${slot.bed}"` : ''}>
                <span>${slot.date.slice(5)} ${slot.weekday}</span>
                <span class="bed">${isOutpatientMode ? '+新增' : slot.bed}</span>
            </div>
        `).join('');

        container.querySelectorAll('.slot-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                const date = chip.dataset.date;
                const bed = chip.dataset.bed || '';
                if (state.movingBooking && !isOutpatientMode) {
                    this.moveBookingTo(date, bed);
                } else if (isOutpatientMode) {
                    outpatient_module.openModal(date);
                } else {
                    modal.openNew(date, bed);
                }
            });
        });
    },

    renderSummary() {
        const container = document.getElementById('calendar-mode-copy');
        if (!container) return;

        const summary = utils.getCalendarMonthlyMetrics(state.currentYear, state.currentMonth, state.calendarMode);
        container.textContent = state.calendarMode === 'outpatient'
            ? `門診小劑量：本月 ${summary.total} 筆，已確認 ${summary.confirmed} 筆、待確認 ${summary.pending} 筆，已分布在 ${summary.scheduledDays} 個給藥日。`
            : `住院大劑量：本月已確認 ${summary.confirmed} 床次、待確認 ${summary.pending} 床次，尚有 ${summary.available} 床次可直接新增；灰色代表未開放。`;
    },

    render() {
        const year = state.currentYear;
        const month = state.currentMonth;

        document.getElementById('calendar-title').textContent = `${year}年 ${month + 1}月`;
        this.updateModeTabs();
        this.updateWeekdayHighlights();

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

        this.renderSummary();
        this.renderUpcomingSlots();
    },

    createDayElement(dayNum, isOtherMonth, data) {
        const dayEl = document.createElement('div');
        dayEl.className = 'calendar-day';

        if (isOtherMonth) {
            dayEl.classList.add('other-month');
            dayEl.innerHTML = `<div class="day-header"><div class="day-header-main"><span class="day-number">${dayNum}</span></div></div>`;
            return dayEl;
        }

        const { dateStr, isToday } = data;
        if (isToday) dayEl.classList.add('today');

        return state.calendarMode === 'outpatient'
            ? this.createOutpatientDayElement(dayEl, dayNum, dateStr)
            : this.createInpatientDayElement(dayEl, dayNum, dateStr);
    },

    createInpatientDayElement(dayEl, dayNum, dateStr) {
        const bookings = utils.getBookingsForDate(dateStr, 'inpatient');
        const hasBookings = bookings.length > 0;
        const anyOpen = CONFIG.BEDS.some((bed) => utils.isBedOpen(dateStr, bed));
        const availableCount = CONFIG.BEDS.filter((bed) => utils.isBedOpen(dateStr, bed) && !utils.getBedStatus(dateStr, bed)).length;
        const statusClass = !anyOpen ? 'closed' : availableCount === 2 ? 'available' : availableCount === 1 ? 'partial' : 'full';
        const capacityText = !anyOpen ? '未開放' : availableCount === 2 ? '2床可排' : availableCount === 1 ? '1床可排' : '已滿';

        if (!anyOpen && bookings.length === 0) {
            dayEl.classList.add('closed-day');
        }
        dayEl.classList.toggle('has-bookings', hasBookings);
        dayEl.classList.toggle('quiet-day', !hasBookings);
        dayEl.classList.toggle('availability-open', statusClass === 'available');
        dayEl.classList.toggle('availability-partial', statusClass === 'partial');
        dayEl.classList.toggle('availability-full', statusClass === 'full');

        let bedsHTML = '';
        CONFIG.BEDS.forEach((bed) => {
            const booking = bookings.find((item) => item.bed === bed);
            const bedOpen = utils.isBedOpen(dateStr, bed);
            if (booking) {
                const statusMeta = utils.getBookingStatusMeta(booking.status);
                const patientName = utils.escapeHtml(booking.patientName || '待補資料');
                const doseText = utils.escapeHtml(`${utils.formatDose(booking.dose)} mCi`);
                bedsHTML += `
                    <button type="button" class="bed-slot occupied-${bed.toLowerCase()} inpatient-booking-card has-booking booking-${statusMeta.chipClass}" data-booking-id="${booking.id}">
                        <span class="slot-bed-tag">${bed}</span>
                        <span class="bed-patient">${patientName}</span>
                        <span class="slot-dose">${doseText}</span>
                    </button>
                `;
            } else if (bedOpen) {
                bedsHTML += `
                    <button type="button" class="bed-slot available calendar-add-btn quiet-slot" data-date="${dateStr}" data-bed="${bed}">
                        <span class="slot-bed-tag">${bed}</span>
                        <span class="slot-helper">空床，可預約</span>
                    </button>
                `;
            } else {
                bedsHTML += `
                    <div class="bed-slot closed-bed-slot quiet-slot">
                        <span class="slot-bed-tag">${bed}</span>
                        <span class="slot-helper">關床</span>
                    </div>
                `;
            }
        });

        dayEl.innerHTML = `
            <div class="day-header">
                <div class="day-header-main">
                    <span class="day-number">${dayNum}</span>
                    <span class="day-date-meta">${utils.formatWeekdayCompact(dateStr)}</span>
                </div>
                <span class="day-capacity ${statusClass}">${capacityText}</span>
            </div>
            <div class="day-beds">${bedsHTML}</div>
        `;

        dayEl.querySelectorAll('.calendar-add-btn').forEach((button) => {
            button.addEventListener('click', (event) => {
                event.stopPropagation();
                modal.openNew(button.dataset.date, button.dataset.bed);
            });
        });

        dayEl.querySelectorAll('.inpatient-booking-card').forEach((button) => {
            button.addEventListener('click', (event) => {
                event.stopPropagation();
                const booking = mockBookings.find((item) => item.id === parseInt(button.dataset.bookingId, 10));
                if (booking && utils.canUserModify(booking)) {
                    modal.openEdit(booking);
                }
            });
        });

        if (utils.isPrivilegedEditor()) {
            dayEl.addEventListener('click', (event) => {
                if (event.target.closest('.bed-slot')) return;
                dayModal.open(dateStr, utils.isHoliday(dateStr), bookings);
            });
        }

        return dayEl;
    },

    createOutpatientDayElement(dayEl, dayNum, dateStr) {
        const bookings = utils.getBookingsForDate(dateStr, 'outpatient');
        const isBookableDate = utils.isOutpatientBookableDate(dateStr);

        const visibleBookings = bookings.slice(0, 3).map((booking) => `
            <div class="outpatient-pill" title="${utils.escapeHtml(booking.patientName || '待補資料')} ${utils.escapeHtml(utils.formatDose(booking.dose))} mCi">
                <span class="outpatient-name">${utils.escapeHtml(booking.patientName || '待補資料')}</span>
                <span class="outpatient-dose">${utils.escapeHtml(utils.formatDose(booking.dose))} mCi</span>
            </div>
        `).join('');
        const hiddenCount = bookings.length - 3;
        const collapseBadge = hiddenCount > 0 ? `<div class="outpatient-more">+${hiddenCount}筆</div>` : '';
        const addButton = isBookableDate
            ? `<button type="button" class="outpatient-add-btn" data-date="${dateStr}" aria-label="新增門診小劑量">+</button>`
            : '';
        const capacityText = bookings.length > 0 ? `${bookings.length}筆` : isBookableDate ? '可排' : '停診';
        const capacityTone = bookings.length > 0 || isBookableDate ? 'available' : 'closed';
        const emptyText = isBookableDate ? '尚無門診需求' : '非門診日';

        dayEl.innerHTML = `
            <div class="day-header">
                <div class="day-header-main">
                    <span class="day-number">${dayNum}</span>
                    <span class="day-date-meta">${utils.formatWeekdayCompact(dateStr)}</span>
                </div>
                <span class="day-capacity ${capacityTone}">${capacityText}</span>
            </div>
            <div class="outpatient-day-body">
                <div class="outpatient-list">${visibleBookings || `<span class="outpatient-empty">${emptyText}</span>`}</div>
                ${collapseBadge}
                ${addButton}
            </div>
        `;

        const addBtn = dayEl.querySelector('.outpatient-add-btn');
        if (addBtn) {
            addBtn.addEventListener('click', (event) => {
                event.stopPropagation();
                outpatient_module.openModal(addBtn.dataset.date);
            });
        }

        return dayEl;
    },

    moveBookingTo(newDate, newBed) {
        if (!state.movingBooking) return;

        const booking = state.movingBooking;
        const oldDate = booking.date;
        const oldBed = booking.bed;

        if (!utils.canUserModify(booking)) {
            toast.show('您沒有權限移動此預約', 'error');
            this.cancelMove();
            return;
        }

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
        if (!container) return;
        const logs = filteredLogs || mockAuditLogs.slice(0, 20);

        const icons = { CREATE: '➕', UPDATE: '✏️', DELETE: '🗑️', OVERRIDE: '🔧' };

        if (logs.length === 0) {
            container.innerHTML = '<div style="text-align:center; color: var(--text-muted); padding: var(--space-md);">無符合條件的紀錄</div>';
            return;
        }

        container.innerHTML = logs.map(log => `
            <div class="audit-item">
                <span class="audit-icon">${icons[log.action] || '📝'}</span>
                <div class="audit-content">
                    <div class="audit-detail">${utils.escapeHtml(log.detail)}</div>
                    <div class="audit-meta">${utils.escapeHtml(log.userId)} • ${utils.escapeHtml(log.timestamp)}</div>
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
            <h4>${utils.escapeHtml(utils.formatDate(dateStr))}</h4>
            <p>${utils.escapeHtml(`${weekday}${isHoliday ? ' • 國定假日' : ''}`)}</p>
        `;

        const bedsControl = document.getElementById('day-beds-control');
        const isAdmin = utils.isManager();

        // 非 Manager 隱藏床位控制區
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
        // 住院預約（只有 Manager 才顯示）
        if (isAdmin && bookings.length > 0) {
            bookingsList.innerHTML = `
                <h5>當日住院預約</h5>
                ${bookings.map(b => `
                    <div class="day-booking-item">
                        <span class="bed-badge bed-${b.bed.toLowerCase()}">${b.bed}</span>
                        <span>${utils.escapeHtml(b.patientName)}</span>
                        <span style="color: var(--text-muted)">${utils.escapeHtml(b.doctor)}</span>
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
        const opBookings = mockBookings.filter(b => b.date === dateStr && utils.isOutpatientBooking(b));
        const todayForOp = new Date();
        todayForOp.setHours(0, 0, 0, 0);
        dateObj.setHours(0, 0, 0, 0);
        const isPastDate = dateObj < todayForOp;

        let opHTML = '';
        if (opBookings.length > 0) {
            opHTML += `<h5 style="margin-top:12px;">💊 當日小劑量服藥</h5>`;
            opHTML += opBookings.map(b => `
                <div class="day-booking-item" style="justify-content:space-between;">
                    <span>${utils.escapeHtml(b.patientName)} <span style="color:var(--text-muted);font-size:0.85rem;">${utils.escapeHtml(`${b.dose}mCi ${b.medType || '錠劑'}`)}</span></span>
                    ${utils.canUserModify(b) ? `<button class="btn-sm delete delete-op-cal" data-id="${b.id}" style="padding:2px 6px;font-size:0.75rem;">刪除</button>` : ''}
                </div>
            `).join('');
        }

        if (!isPastDate && state.currentUser?.role !== 'viewer') {
            opHTML += `<button class="btn-primary" id="add-op-from-cal" style="margin-top:8px;width:100%;padding:6px;font-size:0.85rem;">➕ 新增小劑量預約 (<30mCi)</button>`;
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
        admin.render();
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
                if (!utils.canUserModify(this.booking)) {
                    toast.show('您沒有權限移動此預約', 'error');
                    break;
                }
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
    },

    render(filter = '') {
        const tbody = document.getElementById('bookings-tbody');
        let data = [...mockBookings];
        data.sort((a, b) => new Date(b.date) - new Date(a.date));

        const startDateVal = document.getElementById('booking-filter-start')?.value;
        const endDateVal = document.getElementById('booking-filter-end')?.value;
        if (startDateVal) data = data.filter(b => b.date >= startDateVal);
        if (endDateVal) data = data.filter(b => b.date <= endDateVal);

        if (!filter) filter = document.getElementById('search-input')?.value || '';
        if (filter) {
            const f = filter.toLowerCase();
            data = data.filter(b =>
                (b.patientName || '').toLowerCase().includes(f) ||
                (b.chartNo || '').toLowerCase().includes(f) ||
                (b.doctor || '').toLowerCase().includes(f) ||
                (b.branch || '').toLowerCase().includes(f) ||
                (b.createdBy || '').toLowerCase().includes(f)
            );
        }

        if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="padding: 32px; text-align: center; color: var(--text-muted);">目前沒有符合條件的預約</td></tr>';
            return;
        }

        tbody.innerHTML = data.map(booking => {
            const canModify = utils.canUserModify(booking);
            const canConfirm = utils.canConfirmReceipt(booking);
            const statusMeta = utils.getBookingStatusMeta(booking.status);
            const needsCoreData = utils.isManager() && booking.status === '待確認' && !utils.hasCoreBookingData(booking);
            const actionButtons = [
                needsCoreData ? '<span class="table-muted-text">待補資料</span>' : '',
                canConfirm ? `<button class="btn-text-action confirm-btn" data-id="${booking.id}">收單</button>` : '',
                canModify ? `<button class="btn-text-action edit-btn" data-id="${booking.id}">編輯</button>` : '',
                canModify ? `<button class="btn-text-action danger delete-btn" data-id="${booking.id}">刪除</button>` : ''
            ].filter(Boolean).join('');
            const rowClass = `booking-row booking-row-${statusMeta.badgeClass}`;
            const branch = utils.escapeHtml(booking.branch || '義大');
            const patientName = utils.escapeHtml(booking.patientName || '待補資料');
            const chartNo = utils.escapeHtml(booking.chartNo || '病歷待補');
            const doctor = utils.escapeHtml(booking.doctor || '待補');
            const doseText = `${utils.formatDose(booking.dose)} mCi`;
            const doseClass = Number.isFinite(booking.dose) && booking.dose >= 120 ? 'booking-dose-text high' : 'booking-dose-text';
            const medName = booking.radiotracer || 'I-131';
            const bookingLocation = utils.escapeHtml(utils.isOutpatientBooking(booking) ? '門診小劑量' : `${booking.bed || '住院'} 床位`);
            const medMeta = utils.escapeHtml(`${medName} · ${booking.dosageForm || 'Capsule'}${booking.thyrogen ? ' · Thyrogen' : ''} · ${booking.medOrdered ? '已訂藥' : '未訂藥'}`);

            return `
                <tr class="${rowClass}">
                    <td class="sticky-action-col">
                        <div class="table-actions-text">${actionButtons || '<span class="table-muted-text">無可執行操作</span>'}</div>
                    </td>
                    <td><span class="status-badge ${statusMeta.badgeClass}">${statusMeta.label}</span></td>
                    <td>
                        <div class="booking-date-cell">
                            <span class="booking-date-text">${utils.formatDate(booking.date)}</span>
                            <span class="booking-patient-meta">${new Date(booking.date).toLocaleDateString('zh-TW', { weekday: 'long' })}</span>
                        </div>
                    </td>
                    <td>
                        <div class="booking-location-cell">
                            <span class="booking-branch">${branch}</span>
                            <span class="booking-patient-meta">${bookingLocation}</span>
                        </div>
                    </td>
                    <td>
                        <div class="booking-patient-cell">
                            <div class="booking-patient-line">
                                <span class="booking-patient-name">${patientName}</span>
                            </div>
                            <span class="booking-patient-meta">${chartNo}</span>
                        </div>
                    </td>
                    <td>
                        <div class="booking-med-cell">
                            <div class="booking-med-top">
                                <span class="${doseClass}">${utils.escapeHtml(doseText)}</span>
                            </div>
                            <span class="booking-med-meta">${medMeta}</span>
                        </div>
                    </td>
                    <td>${booking.doctor ? doctor : '<span class="table-muted-text">待補</span>'}</td>
                </tr>
            `;
        }).join('');

        tbody.querySelectorAll('.confirm-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.confirmReceipt(parseInt(btn.dataset.id));
            });
        });
        tbody.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = parseInt(btn.dataset.id);
                const booking = mockBookings.find(b => b.id === id);
                if (booking) {
                    if (utils.isOutpatientBooking(booking)) outpatient_module.openEdit(booking);
                    else modal.openEdit(booking);
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

    confirmReceipt(id) {
        const booking = mockBookings.find((item) => item.id === id);
        if (!booking) return;
        if (!utils.isManager() || booking.status !== '待確認') {
            toast.show('您沒有確認收單權限', 'error');
            return;
        }
        const missingFields = utils.getMissingCoreFields(booking);
        if (missingFields.length > 0) {
            toast.show(`請先補齊：${missingFields.join('、')}`, 'error');
            return;
        }

        upsertBookingRecord({
            ...booking,
            status: '已確認',
            updatedAt: new Date().toLocaleString('zh-TW'),
            updatedBy: state.currentUser.username
        });
        mockAuditLogs.unshift({
            id: mockAuditLogs.length + 1,
            userId: state.currentUser.username,
            action: 'UPDATE',
            target: 'Booking',
            targetId: booking.id,
            detail: `確認收單：${booking.patientName || booking.chartNo || booking.id}`,
            timestamp: new Date().toLocaleString('zh-TW')
        });
        this.render();
        calendar.render();
        auditLogs.render();
        auth.updateStats();
        toast.show('已確認收單', 'success');
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
                detail: `刪除${isPast ? '【歷史】' : ''}預約：${booking.patientName || '待補資料'} ${utils.isOutpatientBooking(booking) ? '門診' : booking.bed} ${booking.date}`,
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
        document.getElementById('booking-branch').value = '義大';
        document.getElementById('booking-radiotracer').value = 'I-131';
        document.getElementById('booking-dosage-form').value = 'Capsule';

        if (state.currentUser?.role === 'viewer') {
            toast.show('Viewer 僅能查看，無法新增預約', 'error');
            return;
        }

        if (date) document.getElementById('booking-date').value = date;
        if (bed) {
            const radio = this.form.querySelector(`input[name="bed"][value="${bed}"]`);
            if (radio) radio.checked = true;
        }

        renderDoctorOptions();

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
        document.getElementById('booking-branch').value = booking.branch || '義大';
        document.getElementById('booking-chart').value = booking.chartNo || '';
        document.getElementById('booking-name').value = booking.patientName || '';
        document.getElementById('booking-dose').value = Number.isFinite(booking.dose) ? booking.dose : '';
        renderDoctorOptions();
        document.getElementById('booking-doctor').value = booking.doctor || '';
        document.getElementById('booking-radiotracer').value = booking.radiotracer || 'I-131';
        document.getElementById('booking-dosage-form').value = booking.dosageForm || 'Capsule';
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
        const doseValue = document.getElementById('booking-dose').value.trim();
        const formData = {
            date: document.getElementById('booking-date').value,
            bed: this.form.querySelector('input[name="bed"]:checked')?.value,
            branch: document.getElementById('booking-branch').value,
            chartNo: document.getElementById('booking-chart').value.trim(),
            patientName: document.getElementById('booking-name').value.trim(),
            dose: doseValue ? parseInt(doseValue, 10) : null,
            doctor: document.getElementById('booking-doctor').value.trim(),
            radiotracer: document.getElementById('booking-radiotracer').value.trim() || 'I-131',
            dosageForm: document.getElementById('booking-dosage-form').value,
            medType: dosageFormToMedType(document.getElementById('booking-dosage-form').value),
            thyrogen: document.getElementById('booking-thyrogen') ? document.getElementById('booking-thyrogen').value === 'true' : false,
            status: state.editingBooking?.status || '待確認',
            bookingType: 'inpatient',
            isOutpatient: false
        };

        const missingFields = utils.getMissingCoreFields(formData);
        if (formData.status === '已確認' && missingFields.length > 0) {
            toast.show(`請先補齊：${missingFields.join('、')}`, 'error');
            return;
        }

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
                const oldBooking = { ...mockBookings[index] };
                utils.syncDoctorDirectory(formData.doctor);
                upsertBookingRecord({
                    ...mockBookings[index],
                    ...formData,
                    updatedAt: new Date().toLocaleString('zh-TW'),
                    updatedBy: state.currentUser.username
                });

                const isPast = new Date(formData.date) < new Date(new Date().setHours(0, 0, 0, 0));
                mockAuditLogs.unshift({
                    id: mockAuditLogs.length + 1,
                    userId: state.currentUser.username,
                    action: 'UPDATE',
                    target: 'Booking',
                    targetId: state.editingBooking.id,
                    detail: `修改${isPast ? '【歷史】' : ''}預約：${formData.patientName || oldBooking.patientName || '待補資料'}，狀態 ${oldBooking.status} → ${formData.status}`,
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
            utils.syncDoctorDirectory(formData.doctor);
            upsertBookingRecord(newBooking);

            mockAuditLogs.unshift({
                id: mockAuditLogs.length + 1,
                userId: state.currentUser.username,
                action: 'CREATE',
                target: 'Booking',
                targetId: newBooking.id,
                detail: `新增預約：${formData.patientName || '待補資料'} ${formData.bed} ${formData.date} (${formData.status})`,
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
// Shared Master Data
// ============================================
function renderDoctorOptions() {
    utils.ensureDoctorDirectory();
    const options = mockDoctors
        .slice()
        .sort((a, b) => a.name.localeCompare(b.name, 'zh-Hant'))
        .map((doctor) => `<option value="${utils.escapeHtml(doctor.name)}">${utils.escapeHtml(doctor.name)}</option>`)
        .join('');
    const selectConfigs = [
        { id: 'booking-doctor', placeholder: '請選擇主治醫師' },
        { id: 'op-booking-doctor', placeholder: '請選擇主治醫師' },
        { id: 'report-doctor', placeholder: '全部醫師' }
    ];

    selectConfigs.forEach(({ id, placeholder }) => {
        const select = document.getElementById(id);
        if (!select) return;
        const currentValue = select.value;
        select.innerHTML = `<option value="">${utils.escapeHtml(placeholder)}</option>${options}`;
        if (currentValue && [...select.options].some((option) => option.value === currentValue)) {
            select.value = currentValue;
        }
    });
}

// ============================================
// Admin Module (User Management)
// ============================================
const admin = {
    init() {
        document.getElementById('add-user-btn').addEventListener('click', () => {
            userModal.openNew();
        });
        document.getElementById('add-doctor-btn')?.addEventListener('click', () => {
            doctorModal.openNew();
        });
        renderDoctorOptions();
        const bedDateInput = document.getElementById('admin-bed-date');
        if (bedDateInput) {
            bedDateInput.value = bedDateInput.value || normalizeDateValue(new Date());
            bedDateInput.addEventListener('change', () => this.renderBedPanel());
        }
    },

    renderOverview() {
        const container = document.getElementById('admin-overview');
        if (!container) return;
        const pendingBookings = mockBookings.filter((booking) => booking.status === '待確認').length;
        const unorderedBookings = mockBookings.filter((booking) => !utils.isOutpatientBooking(booking) && !booking.medOrdered).length;
        const activeUsers = mockUsers.filter((user) => user.isActive).length;

        container.innerHTML = [
            { label: '主治醫師', value: mockDoctors.length, meta: '同步排程與報表下拉選單' },
            { label: '啟用帳號', value: activeUsers, meta: `共 ${mockUsers.length} 個帳號，含停用紀錄` },
            { label: '待確認預約', value: pendingBookings, meta: '需要補齊資料或完成收單' },
            { label: '未訂藥', value: unorderedBookings, meta: '住院預約需優先核對劑量' }
        ].map((item) => `
            <div class="admin-overview-card">
                <span class="admin-overview-label">${item.label}</span>
                <strong class="admin-overview-value">${item.value}</strong>
                <span class="admin-overview-meta">${item.meta}</span>
            </div>
        `).join('');
    },

    renderBedPanel() {
        const panel = document.getElementById('admin-bed-panel');
        const dateInput = document.getElementById('admin-bed-date');
        if (!panel || !dateInput) return;

        const selectedDate = dateInput.value || normalizeDateValue(new Date());
        dateInput.value = selectedDate;

        const cards = CONFIG.BEDS.map((bed) => {
            const booking = utils.getBedStatus(selectedDate, bed);
            const isOpen = utils.isBedOpen(selectedDate, bed);
            const isBooked = Boolean(booking);
            const summary = isBooked
                ? `${booking.patientName || '未填姓名'} · ${utils.formatDoseDisplay(booking.dose)}`
                : (isOpen ? '空床，可預約' : '未開床');
            const meta = isBooked
                ? `${booking.chartNo || '未填病歷號'} · ${booking.status || '待確認'}`
                : (isOpen ? '此床位目前開放中' : '關閉後月曆不顯示可預約');
            const checked = isOpen ? 'checked' : '';
            const disabled = isBooked ? 'disabled' : '';
            const statusClass = isBooked ? 'booked' : (isOpen ? 'open' : 'closed');
            return `
                <section class="admin-bed-card ${statusClass}">
                    <div class="admin-bed-card-top">
                        <div>
                            <div class="admin-bed-label">${bed}</div>
                            <div class="admin-bed-meta">${utils.escapeHtml(meta)}</div>
                        </div>
                        <label class="toggle-switch">
                            <input type="checkbox" class="admin-bed-toggle" data-bed="${bed}" ${checked} ${disabled}>
                            <span class="toggle-slider"></span>
                        </label>
                    </div>
                    <div class="admin-bed-summary">${utils.escapeHtml(summary)}</div>
                    ${isBooked ? '<div class="admin-bed-note">已有預約，請先調整或移除預約後再變更床位開關。</div>' : ''}
                </section>
            `;
        }).join('');

        panel.innerHTML = cards;
        panel.querySelectorAll('.admin-bed-toggle').forEach((toggle) => {
            toggle.addEventListener('change', (event) => {
                const { bed } = event.target.dataset;
                this.toggleBedOverride(selectedDate, bed, event.target.checked);
            });
        });
    },

    toggleBedOverride(dateStr, bed, isOpen) {
        if (!utils.isManager()) {
            toast.show('僅管理者可調整床位開關', 'error');
            this.renderBedPanel();
            return;
        }
        if (utils.getBedStatus(dateStr, bed)) {
            toast.show('該床已有預約，無法直接關閉', 'error');
            this.renderBedPanel();
            return;
        }
        dayModal.toggleBed(dateStr, bed, isOpen);
        this.renderBedPanel();
    },

    render() {
        if (!utils.isManager()) return;

        utils.ensureDoctorDirectory();
        this.renderOverview();
        this.renderBedPanel();
        renderDoctorOptions();
        const roleNames = ROLE_LABELS;
        const doctorsTbody = document.getElementById('doctors-tbody');
        const tbody = document.getElementById('users-tbody');
        if (doctorsTbody) {
            doctorsTbody.innerHTML = mockDoctors
                .slice()
                .sort((a, b) => a.name.localeCompare(b.name, 'zh-Hant'))
                .map((doctor) => {
                    const usageCount = mockBookings.filter((booking) => booking.doctor === doctor.name).length;
                    const safeName = utils.escapeHtml(doctor.name);
                    return `
                        <tr>
                            <td>${safeName}</td>
                            <td>${usageCount}</td>
                            <td>
                                <div class="action-btns">
                                    <button class="btn-text-action edit-doctor-btn" data-id="${doctor.id}">編輯</button>
                                    <button class="btn-text-action danger delete-doctor-btn" data-id="${doctor.id}">刪除</button>
                                </div>
                            </td>
                        </tr>
                    `;
                }).join('');
            doctorsTbody.querySelectorAll('.edit-doctor-btn').forEach((btn) => {
                btn.addEventListener('click', () => {
                    const doctor = mockDoctors.find((item) => item.id === parseInt(btn.dataset.id, 10));
                    if (doctor) doctorModal.openEdit(doctor);
                });
            });
            doctorsTbody.querySelectorAll('.delete-doctor-btn').forEach((btn) => {
                btn.addEventListener('click', () => {
                    const doctor = mockDoctors.find((item) => item.id === parseInt(btn.dataset.id, 10));
                    if (!doctor) return;
                    if (mockBookings.some((booking) => booking.doctor === doctor.name)) {
                        toast.show('仍有預約使用此醫師，請先改名或調整預約資料', 'error');
                        return;
                    }
                    mockDoctors = mockDoctors.filter((item) => item.id !== doctor.id);
                    mockAuditLogs.unshift({
                        id: mockAuditLogs.length + 1,
                        userId: state.currentUser.username,
                        action: 'DELETE',
                        target: 'Doctor',
                        targetId: doctor.id,
                        detail: `刪除主治醫師：${doctor.name}`,
                        timestamp: new Date().toLocaleString('zh-TW')
                    });
                    renderDoctorOptions();
                    this.render();
                    auditLogs.render();
                    toast.show('主治醫師已刪除', 'success');
                });
            });
        }
        tbody.innerHTML = mockUsers.map(user => `
            <tr>
                <td>${utils.escapeHtml(user.username)}</td>
                <td>${utils.escapeHtml(user.name)}</td>
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
                    mockAuditLogs.unshift({
                        id: mockAuditLogs.length + 1,
                        userId: state.currentUser.username,
                        action: 'UPDATE',
                        target: 'User',
                        targetId: user.id,
                        detail: `${user.username} 權限帳號已${user.isActive ? '啟用' : '停用'}`,
                        timestamp: new Date().toLocaleString('zh-TW')
                    });
                    this.render();
                    auditLogs.render();
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
                const previousRole = user.role;
                const previousStatus = user.isActive;
                if (password) user.password = password;
                user.name = name;
                user.role = role;
                user.isActive = isActive;
                mockAuditLogs.unshift({
                    id: mockAuditLogs.length + 1,
                    userId: state.currentUser.username,
                    action: 'UPDATE',
                    target: 'User',
                    targetId: user.id,
                    detail: `更新使用者 ${user.username}：角色 ${utils.getRoleLabel(previousRole)}→${utils.getRoleLabel(role)}，狀態 ${previousStatus ? '啟用' : '停用'}→${isActive ? '啟用' : '停用'}`,
                    timestamp: new Date().toLocaleString('zh-TW')
                });
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
            mockAuditLogs.unshift({
                id: mockAuditLogs.length + 1,
                userId: state.currentUser.username,
                action: 'CREATE',
                target: 'User',
                targetId: username,
                detail: `新增使用者 ${username}（${utils.getRoleLabel(role)}）`,
                timestamp: new Date().toLocaleString('zh-TW')
            });
            toast.show('使用者已新增', 'success');
        }

        this.close();
        admin.render();
        auditLogs.render();
    }
};

const doctorModal = {
    element: null,
    form: null,

    init() {
        this.element = document.getElementById('doctor-modal');
        this.form = document.getElementById('doctor-form');
        if (!this.element || !this.form) return;

        document.getElementById('doctor-modal-close').addEventListener('click', () => this.close());
        document.getElementById('doctor-modal-cancel').addEventListener('click', () => this.close());
        this.element.querySelector('.modal-backdrop').addEventListener('click', () => this.close());
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.save();
        });
    },

    openNew() {
        state.editingDoctor = null;
        document.getElementById('doctor-modal-title').textContent = '新增主治醫師';
        document.getElementById('doctor-name-input').value = '';
        this.element.classList.add('active');
    },

    openEdit(doctor) {
        state.editingDoctor = doctor;
        document.getElementById('doctor-modal-title').textContent = '編輯主治醫師';
        document.getElementById('doctor-name-input').value = doctor.name;
        this.element.classList.add('active');
    },

    close() {
        this.element.classList.remove('active');
        state.editingDoctor = null;
    },

    save() {
        const name = document.getElementById('doctor-name-input').value.trim();
        if (!name) {
            toast.show('請輸入醫師名稱', 'error');
            return;
        }

        const duplicated = mockDoctors.find((doctor) =>
            doctor.name === name && doctor.id !== state.editingDoctor?.id
        );
        if (duplicated) {
            toast.show('醫師名稱已存在', 'error');
            return;
        }

        if (state.editingDoctor) {
            const originalName = state.editingDoctor.name;
            state.editingDoctor.name = name;
            mockBookings.forEach((booking) => {
                if (booking.doctor === originalName) booking.doctor = name;
            });
            mockAuditLogs.unshift({
                id: mockAuditLogs.length + 1,
                userId: state.currentUser.username,
                action: 'UPDATE',
                target: 'Doctor',
                targetId: state.editingDoctor.id,
                detail: `修改主治醫師：${originalName} → ${name}`,
                timestamp: new Date().toLocaleString('zh-TW')
            });
            toast.show('主治醫師已更新', 'success');
        } else {
            mockDoctors.push({ id: utils.generateDoctorId(), name });
            mockAuditLogs.unshift({
                id: mockAuditLogs.length + 1,
                userId: state.currentUser.username,
                action: 'CREATE',
                target: 'Doctor',
                targetId: name,
                detail: `新增主治醫師：${name}`,
                timestamp: new Date().toLocaleString('zh-TW')
            });
            toast.show('主治醫師已新增', 'success');
        }

        renderDoctorOptions();
        this.close();
        admin.render();
        bookings_module.render();
        outpatient_module.render();
        medication_module.render();
        calendar.render();
        report_module.renderPreview();
        auditLogs.render();
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
        let filtered = mockBookings.filter(b => !utils.isOutpatientBooking(b));
        const startVal = document.getElementById('med-filter-start')?.value;
        const endVal = document.getElementById('med-filter-end')?.value;
        if (startVal) filtered = filtered.filter(b => b.date >= startVal);
        if (endVal) filtered = filtered.filter(b => b.date <= endVal);

        const showOnlyUnordered = document.getElementById('med-filter-unorder')?.checked;
        if (showOnlyUnordered) filtered = filtered.filter(b => !b.medOrdered);
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            filtered = filtered.filter(b => (b.chartNo || '').toLowerCase().includes(q) || (b.patientName || '').toLowerCase().includes(q));
        }
        filtered.sort((a, b) => new Date(a.date) - new Date(b.date));
        return filtered;
    },

    render(searchQuery = '') {
        const tbody = document.getElementById('medication-tbody');
        if (!tbody) return;
        const role = state.currentUser?.role;
        if (!utils.isPrivilegedEditor()) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color: var(--error);">無權限檢視此頁面</td></tr>`;
            return;
        }
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
            const doseDisabled = isOrdered ? 'disabled' : '';
            const patientName = utils.escapeHtml(b.patientName || '待補資料');
            const chartNo = utils.escapeHtml(b.chartNo || '病歷待補');
            const dateText = utils.escapeHtml(b.date);
            const weekday = utils.escapeHtml(new Date(b.date).toLocaleDateString('zh-TW', { weekday: 'short' }));
            const branch = utils.escapeHtml(b.branch || '義大');
            const doseText = utils.escapeHtml(`${utils.formatDose(b.dose)} mCi`);
            return `<tr>
                <td><div class="booking-date-cell"><span class="booking-date-text">${dateText}</span><span class="booking-patient-meta">${weekday}</span></div></td>
                <td><span class="bed-badge bed-${b.bed.toLowerCase()}">${b.bed}</span></td>
                <td>
                    <div class="med-review-cell">
                        <span class="med-patient-name">${patientName}</span>
                        <span class="med-patient-chart">${chartNo}</span>
                        <span class="table-inline-hint">${branch}</span>
                    </div>
                </td>
                <td>
                    <div class="med-review-cell">
                        <span class="med-dose-pill">${doseText}</span>
                        <div class="med-inline-editors">
                            <input type="number" class="med-dose-input" data-id="${b.id}" value="${Number.isFinite(b.dose) ? b.dose : ''}" ${doseDisabled}>
                            <select class="med-type-select" data-id="${b.id}" style="${b.medType === '水劑' ? 'background:#fff0f0;color:#e53e3e;font-weight:700;border:2px solid #e53e3e;' : ''}" ${doseDisabled}>
                        <option value="錠劑" ${b.medType === '錠劑' || !b.medType ? 'selected' : ''}>💊 錠劑</option>
                        <option value="水劑" ${b.medType === '水劑' ? 'selected' : ''}>💧 水劑</option>
                            </select>
                        </div>
                    </div>
                </td>
                <td>${thyrogenBadge}</td>
                <td><div class="med-order-stack">
                    <span class="${statusClass}">${statusText}</span>
                    <span class="med-order-status">${isOrdered ? '已完成訂藥核對' : '請先核對病人、病歷號與劑量'}</span>
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
                <td>${utils.escapeHtml(b.date)}</td>
                <td class="text-center">${utils.escapeHtml(b.bed)}</td>
                <td>${utils.escapeHtml(b.chartNo)}</td>
                <td>${utils.escapeHtml(b.patientName)}</td>
                <td class="text-center">${utils.escapeHtml(b.dose)}</td>
                <td class="text-center">${utils.escapeHtml(b.medType || '錠劑')}</td>
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
    editingBooking: null,

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
                    <div class="form-section">
                        <div class="form-section-title">門診小劑量基本資料</div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>給藥日期</label>
                                <input type="date" id="op-booking-date" required>
                            </div>
                            <div class="form-group">
                                <label>院區</label>
                                <select id="op-booking-branch">
                                    <option value="義大">義大</option>
                                    <option value="癌醫">癌醫</option>
                                    <option value="大昌">大昌</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    <div class="form-section">
                        <div class="form-section-title">病患資料（未齊可先待確認）</div>
                        <div class="form-row">
                            <div class="form-group"><label>病歷號</label><input type="text" id="op-booking-chart" placeholder="例：A123456789"></div>
                            <div class="form-group"><label>病患姓名</label><input type="text" id="op-booking-name" placeholder="尚未取得可先留空"></div>
                        </div>
                        <div class="form-row">
                            <div class="form-group"><label>服用劑量 (<30mCi)</label><input type="number" id="op-booking-dose" placeholder="例：29" max="29"></div>
                            <div class="form-group"><label>主治醫師</label><select id="op-booking-doctor"><option value="">請選擇主治醫師</option></select></div>
                        </div>
                    </div>
                    <div class="form-section">
                        <div class="form-section-title">用藥資訊</div>
                        <div class="form-row">
                            <div class="form-group"><label>藥品</label><input type="text" id="op-booking-radiotracer" value="I-131"></div>
                            <div class="form-group"><label>劑型</label>
                                <select id="op-booking-dosage-form"><option value="Capsule">Capsule</option><option value="Solution">Solution</option></select>
                            </div>
                        </div>
                    </div>
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
        m.querySelector('#op-booking-form').addEventListener('submit', (e) => { e.preventDefault(); this.save(); });
    },

    render() {
        const tbody = document.getElementById('outpatient-tbody');
        if (!tbody) return;
        let filtered = mockBookings.filter(b => utils.isOutpatientBooking(b));
        filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
        if (filtered.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:var(--text-muted);padding:var(--space-xl);">目前無小劑量預約</td></tr>`;
            return;
        }
        tbody.innerHTML = filtered.map(b => {
            const canModify = utils.canUserModify(b);
            const dateText = utils.escapeHtml(b.date);
            const weekday = utils.escapeHtml(new Date(b.date).toLocaleDateString('zh-TW', { weekday: 'short' }));
            const patientName = utils.escapeHtml(b.patientName || '待補資料');
            const chartNo = utils.escapeHtml(b.chartNo || '待補');
            const doseText = utils.escapeHtml(`${utils.formatDose(b.dose)} mCi`);
            const dosageForm = utils.escapeHtml(b.dosageForm || 'Capsule');
            const doctor = utils.escapeHtml(b.doctor || '待補');
            return `<tr>
                <td><div style="font-weight:500">${dateText}</div><div style="font-size:0.85rem;color:var(--text-muted)">${weekday}</div></td>
                <td><div style="font-weight:500">${patientName}</div><div class="mono" style="font-size:0.85rem;color:var(--text-muted)">${chartNo}</div></td>
                <td><div style="font-weight:700;color:var(--primary)">${doseText}</div></td>
                <td>${dosageForm}</td>
                <td>${doctor}</td>
                <td>${canModify ? `<div class="action-btns"><button class="btn-text-action edit-op-btn" data-id="${b.id}">編輯</button><button class="btn-text-action danger delete-op-btn" data-id="${b.id}">刪除</button></div>` : ''}</td>
            </tr>`;
        }).join('');
        tbody.querySelectorAll('.edit-op-btn').forEach(btn => {
            btn.addEventListener('click', () => this.openEdit(mockBookings.find(b => b.id === parseInt(btn.dataset.id, 10))));
        });
        tbody.querySelectorAll('.delete-op-btn').forEach(btn => {
            btn.addEventListener('click', () => this.delete(parseInt(btn.dataset.id)));
        });
    },

    openModal(prefillDate = '') {
        const m = document.getElementById('outpatient-modal');
        if (!m) return;
        if (state.currentUser?.role === 'viewer') {
            toast.show('Viewer 僅能查看，無法新增門診預約', 'error');
            return;
        }
        this.editingBooking = null;
        m.querySelector('.modal-header h3').textContent = '新增小劑量預約 (<30mCi)';
        document.getElementById('op-booking-form').reset();
        document.getElementById('op-booking-branch').value = '義大';
        document.getElementById('op-booking-radiotracer').value = 'I-131';
        document.getElementById('op-booking-dosage-form').value = 'Capsule';
        renderDoctorOptions();
        if (prefillDate) {
            document.getElementById('op-booking-date').value = prefillDate;
        }
        m.classList.add('active');
    },

    openEdit(booking) {
        if (!booking || !utils.canUserModify(booking)) {
            toast.show('您沒有權限編輯此門診預約', 'error');
            return;
        }
        this.editingBooking = booking;
        const m = document.getElementById('outpatient-modal');
        if (!m) return;
        m.querySelector('.modal-header h3').textContent = '編輯小劑量預約';
        document.getElementById('op-booking-date').value = booking.date;
        document.getElementById('op-booking-branch').value = booking.branch || '義大';
        document.getElementById('op-booking-chart').value = booking.chartNo || '';
        document.getElementById('op-booking-name').value = booking.patientName || '';
        document.getElementById('op-booking-dose').value = Number.isFinite(booking.dose) ? booking.dose : '';
        renderDoctorOptions();
        document.getElementById('op-booking-doctor').value = booking.doctor || '';
        document.getElementById('op-booking-radiotracer').value = booking.radiotracer || 'I-131';
        document.getElementById('op-booking-dosage-form').value = booking.dosageForm || 'Capsule';
        document.getElementById('outpatient-modal').classList.add('active');
    },

    closeModal() {
        const m = document.getElementById('outpatient-modal');
        if (m) m.classList.remove('active');
        this.editingBooking = null;
    },

    save() {
        const doseValue = document.getElementById('op-booking-dose').value.trim();
        const dose = doseValue ? parseFloat(doseValue) : null;
        if (Number.isFinite(dose) && dose >= 30) { toast.show('小劑量預約必須 < 30mCi', 'error'); return; }
        const date = document.getElementById('op-booking-date').value;
        const status = this.editingBooking?.status || '待確認';

        const newBooking = normalizeBooking({
            id: this.editingBooking ? this.editingBooking.id : utils.generateId(),
            date,
            bed: null,
            branch: document.getElementById('op-booking-branch').value,
            bookingType: 'outpatient',
            isOutpatient: true,
            chartNo: document.getElementById('op-booking-chart').value.trim().toUpperCase(),
            patientName: document.getElementById('op-booking-name').value.trim(),
            dose,
            doctor: document.getElementById('op-booking-doctor').value.trim(),
            radiotracer: document.getElementById('op-booking-radiotracer').value.trim() || 'I-131',
            dosageForm: document.getElementById('op-booking-dosage-form').value,
            status,
            createdBy: this.editingBooking ? this.editingBooking.createdBy : state.currentUser.username,
            createdAt: this.editingBooking ? this.editingBooking.createdAt : new Date().toLocaleString('zh-TW'),
            updatedAt: this.editingBooking ? new Date().toLocaleString('zh-TW') : undefined,
            updatedBy: this.editingBooking ? state.currentUser.username : undefined
        });
        const missingFields = utils.getMissingCoreFields(newBooking);
        if (status === '已確認' && missingFields.length > 0) {
            toast.show(`請先補齊：${missingFields.join('、')}`, 'error');
            return;
        }

        utils.syncDoctorDirectory(newBooking.doctor);
        upsertBookingRecord(newBooking);
        mockAuditLogs.unshift({
            id: mockAuditLogs.length + 1,
            userId: state.currentUser.username,
            action: this.editingBooking ? 'UPDATE' : 'CREATE',
            target: 'Booking_OP',
            targetId: newBooking.id,
            detail: `${this.editingBooking ? '更新' : '新增'}小劑量預約：${newBooking.patientName || '待補資料'} (${utils.formatDose(newBooking.dose)}mCi)`,
            timestamp: new Date().toLocaleString('zh-TW')
        });
        toast.show(`小劑量預約已${this.editingBooking ? '更新' : '建立'}`, 'success');
        this.closeModal();
        this.render();
        calendar.render(); // 同步刷新月曆
        bookings_module.render();
    },

    delete(id) {
        const booking = mockBookings.find((item) => item.id === id);
        if (!booking) return;
        if (!utils.canUserModify(booking)) {
            toast.show('您沒有權限刪除此門診預約', 'error');
            return;
        }
        if (!confirm('確定要刪除此小劑量預約嗎？')) return;
        const index = mockBookings.findIndex(b => b.id === id);
        if (index === -1) return;
        const targetBooking = mockBookings[index];
        mockBookings.splice(index, 1);
        const isPast = new Date(targetBooking.date) < new Date(new Date().setHours(0, 0, 0, 0));
        mockAuditLogs.unshift({
            id: mockAuditLogs.length + 1,
            userId: state.currentUser.username,
            action: 'DELETE',
            target: 'Booking_OP',
            targetId: id,
            detail: `刪除${isPast ? '【歷史】' : ''}小劑量預約：${targetBooking.patientName} (${targetBooking.dose}mCi)`,
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
    initialized: false,

    init() {
        if (!this.initialized) {
            document.getElementById('print-report-btn')?.addEventListener('click', () => this.printReport());
            ['report-start', 'report-end', 'report-doctor', 'report-branch', 'dose-min', 'dose-max'].forEach((id) => {
                const element = document.getElementById(id);
                element?.addEventListener('change', () => this.renderPreview());
                if (element?.tagName === 'INPUT') {
                    element.addEventListener('input', () => this.renderPreview());
                }
            });
            this.initialized = true;
        }
        this.renderPreview();
    },

    getFilteredData(monthOnly = false) {
        const targetYear = state.currentYear;
        const targetMonth = state.currentMonth;
        const startInput = document.getElementById('report-start')?.value;
        const endInput = document.getElementById('report-end')?.value;
        const branch = document.getElementById('report-branch')?.value || '';
        const doctor = (document.getElementById('report-doctor')?.value || '').trim().toLowerCase();
        const minDose = document.getElementById('dose-min')?.value;
        const maxDose = document.getElementById('dose-max')?.value;

        const defaultStart = `${targetYear}-${String(targetMonth + 1).padStart(2, '0')}-01`;
        const defaultEnd = utils.formatDateShort(new Date(targetYear, targetMonth + 1, 0));
        const effectiveStart = monthOnly ? defaultStart : (startInput || '');
        const effectiveEnd = monthOnly ? defaultEnd : (endInput || '');

        return [...mockBookings]
            .filter((booking) => !effectiveStart || booking.date >= effectiveStart)
            .filter((booking) => !effectiveEnd || booking.date <= effectiveEnd)
            .filter((booking) => !branch || booking.branch === branch)
            .filter((booking) => !doctor || (booking.doctor || '').toLowerCase().includes(doctor))
            .filter((booking) => !minDose || (Number.isFinite(booking.dose) && booking.dose >= Number(minDose)))
            .filter((booking) => !maxDose || (Number.isFinite(booking.dose) && booking.dose <= Number(maxDose)))
            .sort((a, b) => {
                if (a.date !== b.date) return new Date(a.date) - new Date(b.date);
                return (a.bed || '門診').localeCompare(b.bed || '門診');
            });
    },

    renderPreview() {
        const tbody = document.getElementById('report-preview-body');
        if (!tbody) return;
        const reportData = this.getFilteredData(false);
        if (reportData.length === 0) {
            tbody.innerHTML = '<tr><td colspan="10" style="padding: 32px; text-align: center; color: var(--text-muted);">目前篩選條件下沒有資料</td></tr>';
            return;
        }
        tbody.innerHTML = reportData.map((row) => `
            <tr>
                <td>${utils.escapeHtml(utils.formatDate(row.date))}</td>
                <td>${utils.escapeHtml(row.branch || '義大')}</td>
                <td>${utils.escapeHtml(utils.isOutpatientBooking(row) ? '門診' : row.bed)}</td>
                <td>${utils.escapeHtml(row.chartNo || '待補')}</td>
                <td>${utils.escapeHtml(row.patientName || '待補')}</td>
                <td>${utils.escapeHtml(utils.formatDose(row.dose))}</td>
                <td>${utils.escapeHtml(row.doctor || '待補')}</td>
                <td>${utils.escapeHtml(row.status)}</td>
                <td>${utils.escapeHtml(row.radiotracer || 'I-131')}</td>
                <td>${utils.escapeHtml(row.dosageForm || 'Capsule')}</td>
            </tr>
        `).join('');
    },

    printReport() {
        const reportData = this.getFilteredData(false);
        if (reportData.length === 0) {
            toast.show('目前沒有可列印的病患排程', 'warning');
            return;
        }

        const printWindow = window.open('', '_blank', 'width=1280,height=900');
        if (!printWindow) {
            toast.show('請允許瀏覽器開啟列印視窗', 'error');
            return;
        }

        const start = document.getElementById('report-start')?.value || '未指定';
        const end = document.getElementById('report-end')?.value || '未指定';
        const branch = document.getElementById('report-branch')?.value || '全部院區';
        const doctor = document.getElementById('report-doctor')?.value || '全部醫師';
        const minDose = document.getElementById('dose-min')?.value || '不限';
        const maxDose = document.getElementById('dose-max')?.value || '不限';
        const rows = reportData.map((row) => `
            <tr>
                <td>${utils.escapeHtml(utils.formatDate(row.date))}</td>
                <td>${utils.escapeHtml(row.branch || '義大')}</td>
                <td>${utils.escapeHtml(utils.isOutpatientBooking(row) ? '門診' : row.bed)}</td>
                <td>${utils.escapeHtml(row.chartNo || '待補')}</td>
                <td>${utils.escapeHtml(row.patientName || '待補')}</td>
                <td>${utils.escapeHtml(utils.formatDose(row.dose))}</td>
                <td>${utils.escapeHtml(row.doctor || '待補')}</td>
                <td>${utils.escapeHtml(row.status)}</td>
                <td>${utils.escapeHtml(row.radiotracer || 'I-131')}</td>
                <td>${utils.escapeHtml(row.dosageForm || 'Capsule')}</td>
            </tr>
        `).join('');

        printWindow.document.write(`
            <!DOCTYPE html>
            <html lang="zh-Hant">
            <head>
                <meta charset="UTF-8">
                <title>病患排程表</title>
                <style>
                    body { font-family: "Microsoft JhengHei", sans-serif; margin: 24px; color: #111827; }
                    h1 { margin: 0 0 8px; font-size: 24px; }
                    .meta { margin-bottom: 16px; font-size: 13px; color: #4b5563; line-height: 1.8; }
                    table { width: 100%; border-collapse: collapse; table-layout: fixed; }
                    th, td { border: 1px solid #111827; padding: 8px 10px; font-size: 12px; text-align: left; vertical-align: top; word-break: break-word; }
                    th { background: #f3f4f6; font-weight: 700; }
                    @page { size: A4 landscape; margin: 12mm; }
                </style>
            </head>
            <body>
                <h1>病患排程表</h1>
                <div class="meta">
                    日期區間：${utils.escapeHtml(start)} ~ ${utils.escapeHtml(end)}<br>
                    院區：${utils.escapeHtml(branch)}　主治醫師：${utils.escapeHtml(doctor)}<br>
                    劑量範圍：${utils.escapeHtml(minDose)} ~ ${utils.escapeHtml(maxDose)} mCi　筆數：${reportData.length}
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>日期</th>
                            <th>院區</th>
                            <th>類別/床位</th>
                            <th>病歷號</th>
                            <th>病患姓名</th>
                            <th>劑量</th>
                            <th>主治醫師</th>
                            <th>狀態</th>
                            <th>藥品</th>
                            <th>劑型</th>
                        </tr>
                    </thead>
                    <tbody>${rows}</tbody>
                </table>
            </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
    },

    downloadCsv(reportData, filename) {
        if (reportData.length === 0) {
            toast.show('目前沒有可匯出的報表資料', 'warning');
            return;
        }
        let csvContent = '\uFEFF';
        csvContent += '日期,院區,類別/床位,病歷號,病患姓名,劑量(mCi),主治醫師,狀態,藥品,劑型\n';
        reportData.forEach(row => {
            const rowData = [
                row.date,
                row.branch || '義大',
                utils.isOutpatientBooking(row) ? '門診' : row.bed,
                row.chartNo || '',
                row.patientName || '',
                Number.isFinite(row.dose) ? row.dose : '',
                row.doctor || '',
                row.status || '待確認',
                row.radiotracer || 'I-131',
                row.dosageForm || 'Capsule'
            ];
            csvContent += rowData.map(val => `"${String(val).replace(/"/g, '""')}"`).join(',') + '\n';
        });
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `${filename}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast.show('報表下載成功', 'success');
    },

    generateMonthlyReport() {
        const targetYear = state.currentYear;
        const targetMonth = state.currentMonth;
        const monthStr = String(targetMonth + 1).padStart(2, '0');
        const reportData = this.getFilteredData(true);
        this.downloadCsv(reportData, `I131月結報表_${targetYear}${monthStr}`);
    },

    downloadCurrentPreview(prefix) {
        const data = this.getFilteredData(false);
        const today = utils.formatDateShort(new Date()).replace(/-/g, '');
        this.downloadCsv(data, `${prefix}_${today}`);
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
    doctorModal.init();
    medication_module.init();
    outpatient_module.init();
    report_module.init();
});

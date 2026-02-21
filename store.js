// ============================================
// Configuration & Constants
// ============================================
export const CONFIG = {
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
// Mock Data (Shared State)
// ============================================
export let mockUsers = [
    { id: 1, username: 'admin', password: 'admin', role: 'admin', name: '系統管理員', isActive: true },
    { id: 2, username: 'user', password: 'user', role: 'user', name: '一般使用者', isActive: true },
    { id: 3, username: 'nurse01', password: 'nurse01', role: 'admin', name: '王護理師', isActive: true },
    { id: 4, username: 'doc01', password: 'doc01', role: 'user', name: '陳醫師', isActive: false },
    { id: 5, username: 'med_admin', password: 'med', role: 'med_admin', name: '訂藥管理員', isActive: true },
];

export let mockBookings = [
    { id: 1, date: '2026-01-28', bed: '5B', chartNo: 'A123456789', patientName: '王小明', dose: 150, doctor: '王大明', createdBy: 'admin', createdAt: '2026-01-20 10:30', medType: '錠劑', thyrogen: false, medOrdered: false },
    { id: 2, date: '2026-01-28', bed: '6B', chartNo: 'B987654321', patientName: '李美麗', dose: 100, doctor: '李小華', createdBy: 'admin', createdAt: '2026-01-21 14:15', medType: '水劑', thyrogen: true, medOrdered: true },
    { id: 3, date: '2026-01-30', bed: '5B', chartNo: 'C246813579', patientName: '張大華', dose: 120, doctor: '陳建國', createdBy: 'user', createdAt: '2026-01-22 09:00', medType: '錠劑', thyrogen: false, medOrdered: false },
    { id: 4, date: '2026-02-03', bed: '5B', chartNo: 'D135792468', patientName: '陳小娟', dose: 180, doctor: '王大明', createdBy: 'admin', createdAt: '2026-01-23 11:45', medType: '水劑', thyrogen: false, medOrdered: false },
    { id: 5, date: '2026-02-03', bed: '6B', chartNo: 'E864209753', patientName: '林志明', dose: 130, doctor: '李小華', createdBy: 'user', createdAt: '2026-01-24 16:20', medType: '錠劑', thyrogen: true, medOrdered: true },
    { id: 6, date: '2026-02-06', bed: '5B', chartNo: 'F579135246', patientName: '黃美玲', dose: 110, doctor: '陳建國', createdBy: 'admin', createdAt: '2026-01-25 08:30', medType: '錠劑', thyrogen: false, medOrdered: false },
];

export let mockAuditLogs = [
    { id: 1, userId: 'admin', action: 'CREATE', target: 'Booking', targetId: 1, detail: '新增預約：王小明 5B 2026-01-28', timestamp: '2026-01-20 10:30' },
    { id: 2, userId: 'admin', action: 'CREATE', target: 'Booking', targetId: 2, detail: '新增預約：李美麗 6B 2026-01-28', timestamp: '2026-01-21 14:15' },
    { id: 3, userId: 'admin', action: 'UPDATE', target: 'Booking', targetId: 1, detail: '修改劑量：100mCi → 150mCi', timestamp: '2026-01-22 09:30' },
    { id: 4, userId: 'user', action: 'CREATE', target: 'Booking', targetId: 3, detail: '新增預約：張大華 5B 2026-01-30', timestamp: '2026-01-22 09:00' },
];

// Admin overrides for specific dates/beds
export let dateOverrides = {};

// ============================================
// Global UI State Management
// ============================================
export let state = {
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

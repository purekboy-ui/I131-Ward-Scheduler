import { mockBookings, dateOverrides, state, mockAuditLogs } from './store.js';
import { utils, toast } from './utils.js';
import { auditLogs } from './logger.js';
import { bookings_module } from './wardBooking.js';

export const calendar = {
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
        if (!container) return;

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
                // UI limit check
                if (state.currentUser.role !== 'admin' && utils.isLessThan21Days(chip.dataset.date)) {
                    toast.show('距離入住小於21天，無法新增病床，請電洽管理員。', 'error');
                    return;
                }

                const date = chip.dataset.date;
                const bed = chip.dataset.bed;
                if (state.movingBooking) {
                    this.moveBookingTo(date, bed);
                } else {
                    if (window.modal) window.modal.openNew(date, bed);
                }
            });
        });
    },

    render() {
        const year = state.currentYear;
        const month = state.currentMonth;
        const elTitle = document.getElementById('calendar-title');
        if (elTitle) {
            elTitle.textContent = `${year}年 ${month + 1}月`;
        }

        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startingDay = firstDay.getDay();
        const totalDays = lastDay.getDate();
        const prevMonthLastDay = new Date(year, month, 0).getDate();

        const container = document.getElementById('calendar-days');
        if (!container) return;
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

        // Check if <21 days
        const isLockedDate = utils.isLessThan21Days(dateStr);

        // Fully closed day
        if (isFullyClosed && bookings.length === 0) {
            dayEl.classList.add('closed-day');
            dayEl.innerHTML = `<span class="day-number-centered">${dayNum}</span>`;

            if (state.currentUser?.role === 'admin') {
                dayEl.style.cursor = 'pointer';
                dayEl.addEventListener('click', () => {
                    if (window.dayModal) window.dayModal.open(dateStr, utils.isHoliday(dateStr), bookings);
                });
            }
            return dayEl;
        }

        // Normal day with bed slots
        dayEl.addEventListener('click', (e) => {
            if (e.target.closest('.bed-slot')) return;

            if (state.movingBooking) {
                const availableBed = utils.CONFIG.BEDS.find(bed =>
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
                if (window.dayModal) window.dayModal.open(dateStr, utils.isHoliday(dateStr), bookings);
            }
        });

        // Determine status
        let statusClass = 'closed';
        const anyOpen = utils.CONFIG.BEDS.some(bed => utils.isBedOpen(dateStr, bed));

        if (anyOpen) {
            const availableCount = utils.CONFIG.BEDS.filter(bed =>
                utils.isBedOpen(dateStr, bed) && !utils.getBedStatus(dateStr, bed)
            ).length;
            if (availableCount === 2) statusClass = 'available';
            else if (availableCount === 1) statusClass = 'partial';
            else statusClass = 'full';
        }

        // Create bed slots
        let bedsHTML = '';
        utils.CONFIG.BEDS.forEach(bed => {
            const booking = bookings.find(b => b.bed === bed);
            const bedOpen = utils.isBedOpen(dateStr, bed);

            if (booking) {
                const canModify = utils.canUserModify(booking);
                const lockHtml = (isLockedDate && !canModify) ? `title="已鎖定(距離小於21天)"` : '';
                const lockIcon = (isLockedDate && !canModify) ? `🔒` : ``;

                const actionsHTML = canModify ? `
                    <div class="slot-actions">
                        <button class="slot-action-btn edit-slot" data-id="${booking.id}" title="編輯">✏️</button>
                        <button class="slot-action-btn delete delete-slot" data-id="${booking.id}" title="刪除">🗑️</button>
                    </div>
                ` : '';

                bedsHTML += `
                    <div class="bed-slot occupied-${bed.toLowerCase()}" 
                         data-booking-id="${booking.id}"
                         ${canModify ? 'data-can-modify="true"' : ''} ${lockHtml}>
                        <span class="bed-label">${bed}</span>
                        <span class="bed-patient">${lockIcon}${booking.patientName}</span>
                        ${actionsHTML}
                    </div>
                `;
            } else if (bedOpen) {
                const openLockIcon = (isLockedDate && state.currentUser.role !== 'admin') ? `🔒 ` : '';
                bedsHTML += `
                    <div class="bed-slot available" data-date="${dateStr}" data-bed="${bed}">
                        <span class="bed-label">${bed}</span>
                        <span class="bed-patient">${openLockIcon}空床</span>
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

                // UI limit check
                if (state.currentUser.role !== 'admin' && isLockedDate) {
                    toast.show('距離入住小於21天，無法新增病床，請電洽管理員。', 'error');
                    return;
                }

                const slotDate = slot.dataset.date;
                const bed = slot.dataset.bed;
                if (state.movingBooking) {
                    this.moveBookingTo(slotDate, bed);
                } else {
                    if (window.modal) window.modal.openNew(slotDate, bed);
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
                    // Check limit
                    if (state.currentUser.role !== 'admin' && isLockedDate) {
                        toast.show('距離入住小於21天，無法更改。若需更改請電洽管理員(義大核醫科櫃台)', 'error');
                        return;
                    }
                    if (window.modal) window.modal.openEdit(booking);
                }
            });

            slot.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const bookingId = parseInt(slot.dataset.bookingId);
                const booking = mockBookings.find(b => b.id === bookingId);
                if (booking && utils.canUserModify(booking)) {
                    if (state.currentUser.role !== 'admin' && isLockedDate) {
                        toast.show('已鎖定 (小於21天)，請聯絡管理員', 'error');
                        return;
                    }
                    if (window.contextMenu) window.contextMenu.show(e.clientX, e.clientY, booking);
                }
            });
        });

        dayEl.querySelectorAll('.edit-slot').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = parseInt(btn.dataset.id);
                const booking = mockBookings.find(b => b.id === id);
                if (booking) {
                    if (state.currentUser.role !== 'admin' && isLockedDate) {
                        toast.show('距離入住小於21天，無法更改。', 'error');
                        return;
                    }
                    if (window.modal) window.modal.openEdit(booking);
                }
            });
        });

        dayEl.querySelectorAll('.delete-slot').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = parseInt(btn.dataset.id);
                if (state.currentUser.role !== 'admin' && isLockedDate) {
                    toast.show('距離入住小於21天，無法刪除。', 'error');
                    return;
                }
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

        // UI Limit check for newDate
        if (state.currentUser.role !== 'admin' && utils.isLessThan21Days(newDate)) {
            toast.show(`目標日期 ${newDate} 距離入住小於21天，您沒有權限進行此項變更。`, 'error');
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
        booking.updatedAt = new Date().toLocaleString('zh-TW', { hour12: false });
        // medOrdered state will reset because date changed significantly? depend on requirement. we keep it for now.

        auditLogs.logAction('UPDATE', 'Booking', booking.id, `移動預約：${booking.patientName} 從 ${oldDate} ${oldBed} 至 ${newDate} ${newBed}`);

        state.movingBooking = null;
        document.body.style.cursor = 'default';

        this.render();
        bookings_module.render();
        if (window.auth && typeof window.auth.updateStats === 'function') {
            window.auth.updateStats();
        }
        toast.show(`已移動至 ${newDate} ${newBed}`, 'success');
    },

    cancelMove() {
        state.movingBooking = null;
        document.body.style.cursor = 'default';
    }
};

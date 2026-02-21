import { state, mockUsers, mockBookings } from './store.js';
import { toast, utils } from './utils.js';
import { bookings_module } from './wardBooking.js';
import { calendar } from './calendar.js';

export const modal = {
    element: null,

    init() {
        this.element = document.getElementById('booking-modal');
        if (!this.element) return;

        document.getElementById('modal-close').addEventListener('click', () => this.close());
        document.getElementById('modal-cancel').addEventListener('click', () => this.close());

        const backdrop = this.element.querySelector('.modal-backdrop');
        if (backdrop) {
            backdrop.addEventListener('click', () => this.close());
        }

        const form = document.getElementById('booking-form');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.save();
            });
        }
    },

    openNew(dateStr, bed) {
        document.getElementById('modal-title').textContent = '新增預約';
        document.getElementById('booking-date').value = dateStr;

        // Handle bed selection
        const bedInputs = document.querySelectorAll('input[name="bed"]');
        bedInputs.forEach(input => {
            input.checked = (input.value === bed);
            input.disabled = false;
        });

        // Set default values
        document.getElementById('booking-chart').value = '';
        document.getElementById('booking-name').value = '';
        document.getElementById('booking-dose').value = '';
        document.getElementById('booking-doctor').value = '';

        // 新增的醫令欄位 (取代備註)
        const medTypeEl = document.getElementById('booking-med-type');
        if (medTypeEl) medTypeEl.value = '錠劑';

        const thyrogenEl = document.getElementById('booking-thyrogen');
        if (thyrogenEl) thyrogenEl.value = 'false';

        state.editingBooking = null;
        this.element.classList.add('active');
    },

    openEdit(booking) {
        document.getElementById('modal-title').textContent = '編輯預約';
        document.getElementById('booking-date').value = booking.date;

        const bedInputs = document.querySelectorAll('input[name="bed"]');
        bedInputs.forEach(input => {
            input.checked = (input.value === booking.bed);
            input.disabled = true; // 不能直接透過 Edit 改床，只能透過 Move
        });

        document.getElementById('booking-chart').value = booking.chartNo;
        document.getElementById('booking-name').value = booking.patientName;
        document.getElementById('booking-dose').value = booking.dose;
        document.getElementById('booking-doctor').value = booking.doctor;

        // 新增醫令欄位
        const medTypeEl = document.getElementById('booking-med-type');
        if (medTypeEl) medTypeEl.value = booking.medType || '錠劑';

        const thyrogenEl = document.getElementById('booking-thyrogen');
        if (thyrogenEl) thyrogenEl.value = booking.thyrogen ? 'true' : 'false';

        state.editingBooking = booking;
        this.element.classList.add('active');
    },

    close() {
        if (this.element) {
            this.element.classList.remove('active');
        }
        state.editingBooking = null;
    },

    save() {
        const formData = {
            date: document.getElementById('booking-date').value,
            bed: document.querySelector('input[name="bed"]:checked').value,
            chartNo: document.getElementById('booking-chart').value.toUpperCase(),
            patientName: document.getElementById('booking-name').value,
            dose: parseFloat(document.getElementById('booking-dose').value),
            doctor: document.getElementById('booking-doctor').value,
            medType: document.getElementById('booking-med-type') ? document.getElementById('booking-med-type').value : '錠劑',
            thyrogen: document.getElementById('booking-thyrogen') ? document.getElementById('booking-thyrogen').value === 'true' : false
        };

        if (state.editingBooking && state.editingBooking.date !== formData.date) {
            // Check if bed is available
            if (!utils.isBedOpen(formData.date, formData.bed)) {
                toast.show('新選擇的日期床位未開放', 'error');
                return;
            }
            if (utils.getBedStatus(formData.date, formData.bed)) {
                toast.show('新選擇的日期床位已被預約', 'error');
                return;
            }
        }

        const success = bookings_module.save(formData);
        if (success) {
            this.close();
        }
    }
};

export const contextMenu = {
    element: null,

    init() {
        this.element = document.getElementById('context-menu');
        if (!this.element) return;

        document.addEventListener('click', () => this.hide());

        this.element.querySelectorAll('.context-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const action = e.target.dataset.action;
                this.handleAction(action);
            });
        });
    },

    show(x, y, booking) {
        state.contextMenuBooking = booking;
        this.element.style.display = 'block';

        // Adjust position if it goes off screen
        const rect = this.element.getBoundingClientRect();
        const adjustedX = Math.min(x, window.innerWidth - rect.width);
        const adjustedY = Math.min(y, window.innerHeight - rect.height);

        this.element.style.left = `${adjustedX}px`;
        this.element.style.top = `${adjustedY}px`;
    },

    hide() {
        if (this.element) {
            this.element.style.display = 'none';
        }
        state.contextMenuBooking = null;
    },

    handleAction(action) {
        const booking = state.contextMenuBooking;
        if (!booking) return;

        switch (action) {
            case 'edit':
                modal.openEdit(booking);
                break;
            case 'move':
                state.movingBooking = booking;
                document.body.style.cursor = 'grab';
                calendar.renderUpcomingSlots(); // Refresh slots for move mode
                toast.show('請點選目標空床位，或按 ESC 取消', 'info');

                // Add ESC listener to cancel
                const cancelHandler = (e) => {
                    if (e.key === 'Escape') {
                        calendar.cancelMove();
                        document.removeEventListener('keydown', cancelHandler);
                        toast.show('已取消移動', 'info');
                    }
                };
                document.addEventListener('keydown', cancelHandler);
                break;
            case 'delete':
                bookings_module.delete(booking.id);
                break;
        }
        this.hide();
    }
};

export const dayModal = {
    element: null,

    init() {
        this.element = document.getElementById('day-modal');
        if (!this.element) return;

        const closeBtn = document.getElementById('day-modal-close');
        if (closeBtn) closeBtn.addEventListener('click', () => this.close());

        const backdrop = this.element.querySelector('.modal-backdrop');
        if (backdrop) backdrop.addEventListener('click', () => this.close());
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
        bedsControl.innerHTML = utils.CONFIG.BEDS.map(bed => {
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
        import('./store.js').then(module => {
            const dateOverrides = module.dateOverrides;
            if (!dateOverrides[dateStr]) {
                dateOverrides[dateStr] = {};
            }
            dateOverrides[dateStr][bed] = isOpen;

            import('./logger.js').then(logger => {
                logger.auditLogs.logAction('OVERRIDE', 'Bed', `${dateStr}-${bed}`, `${isOpen ? '開放' : '關閉'}床位：${dateStr} ${bed}`);
            });

            calendar.render();
            toast.show(`已${isOpen ? '開放' : '關閉'} ${bed} 床位`, 'success');
        });
    },

    close() {
        if (this.element) {
            this.element.classList.remove('active');
        }
    }
};

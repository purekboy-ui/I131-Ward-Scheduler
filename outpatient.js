import { mockBookings, state } from './store.js';
import { utils, toast } from './utils.js';
import { auditLogs } from './logger.js';

export const outpatient_module = {
    init() {
        const addBtn = document.getElementById('add-outpatient-btn');
        if (addBtn) {
            addBtn.addEventListener('click', () => this.openModal());
        }

        // Initialize reusable modal for outpatient
        this.createOrBindModal();
    },

    createOrBindModal() {
        // Reuse the same logic or create a dynamic one, 
        // For simplicity, we create a new form in DOM or via JS.
        let modal = document.getElementById('outpatient-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'outpatient-modal';
            modal.className = 'modal';
            modal.innerHTML = `
                <div class="modal-backdrop"></div>
                <div class="modal-content">
                    <div class="modal-header">
                        <h3 id="op-modal-title">新增小劑量給藥預約 (服用劑量需小於30mCi)</h3>
                        <button class="btn-close" id="op-modal-close">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                        </button>
                    </div>
                    <form id="op-booking-form" class="modal-body">
                        <div class="form-row">
                            <div class="form-group">
                                <label>給藥日期 (僅限週一、三、四)</label>
                                <input type="date" id="op-booking-date" required>
                                <div id="op-date-error" style="color:var(--error); font-size: 0.8rem; margin-top: 4px; display: none;">僅開放星期一、三、四</div>
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>病歷號</label>
                                <input type="text" id="op-booking-chart" placeholder="例：A123456789" required>
                            </div>
                            <div class="form-group">
                                <label>病患姓名</label>
                                <input type="text" id="op-booking-name" placeholder="請輸入姓名" required>
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>服用劑量 (小於 30mCi)</label>
                                <input type="number" id="op-booking-dose" placeholder="例：29" max="29" required>
                            </div>
                            <div class="form-group">
                                <label>主治醫師</label>
                                <input type="text" id="op-booking-doctor" placeholder="請輸入醫師名稱" required>
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>服用藥物劑型</label>
                                <select id="op-booking-med-type">
                                    <option value="錠劑">錠劑</option>
                                    <option value="水劑">水劑</option>
                                </select>
                            </div>
                        </div>
                    </form>
                    <div class="modal-footer">
                        <button type="button" class="btn-outline" id="op-modal-cancel">取消</button>
                        <button type="submit" form="op-booking-form" class="btn-primary" id="op-save-btn">確認預約</button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);

            // Bind Events
            modal.querySelector('#op-modal-close').addEventListener('click', () => this.closeModal());
            modal.querySelector('#op-modal-cancel').addEventListener('click', () => this.closeModal());
            modal.querySelector('.modal-backdrop').addEventListener('click', () => this.closeModal());

            // Date validation (1, 3, 4 only)
            const dateInput = modal.querySelector('#op-booking-date');
            const dateError = modal.querySelector('#op-date-error');
            const saveBtn = modal.querySelector('#op-save-btn');

            dateInput.addEventListener('change', (e) => {
                const date = new Date(e.target.value);
                const day = date.getDay(); // 0:Sun, 1:Mon, 2:Tue, 3:Wed, 4:Thu, 5:Fri, 6:Sat
                if (![1, 3, 4].includes(day)) {
                    dateError.style.display = 'block';
                    saveBtn.disabled = true;
                } else {
                    dateError.style.display = 'none';
                    saveBtn.disabled = false;
                }
            });

            // Form Submit
            modal.querySelector('#op-booking-form').addEventListener('submit', (e) => {
                e.preventDefault();
                this.save();
            });
        }
    },

    render() {
        const tbody = document.getElementById('outpatient-tbody');
        if (!tbody) return;

        let filtered = mockBookings.filter(b => b.isOutpatient);

        if (state.currentUser && state.currentUser.role !== 'admin' && state.currentUser.role !== 'med_admin') {
            filtered = filtered.filter(b => b.createdBy === state.currentUser.username);
        }

        filtered.sort((a, b) => new Date(b.date) - new Date(a.date));

        if (filtered.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color: var(--text-muted); padding: var(--space-xl);">目前無小劑量門診預約</td></tr>`;
            return;
        }

        tbody.innerHTML = filtered.map(b => {
            const canModify = utils.canUserModify(b);
            const actionButtons = canModify ? `
                <div class="table-actions">
                    <button class="btn-icon delete delete-op-btn" data-id="${b.id}" title="刪除">🗑️</button>
                </div>
            ` : '';

            return `
                <tr>
                    <td>
                        <div style="font-weight:500">${b.date}</div>
                        <div style="font-size:0.85rem;color:var(--text-muted)">${new Date(b.date).toLocaleDateString('zh-TW', { weekday: 'short' })}</div>
                    </td>
                    <td>
                        <div style="font-weight:500">${b.patientName}</div>
                        <div class="mono" style="font-size:0.85rem;color:var(--text-muted)">${b.chartNo}</div>
                    </td>
                    <td><div style="font-weight:600; color:var(--primary)">${b.dose} mCi</div></td>
                    <td>${b.medType}</td>
                    <td>${b.doctor}</td>
                    <td>${actionButtons}</td>
                </tr>
            `;
        }).join('');

        tbody.querySelectorAll('.delete-op-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = parseInt(btn.dataset.id);
                this.delete(id);
            });
        });
    },

    openModal() {
        const modal = document.getElementById('outpatient-modal');
        if (!modal) return;

        document.getElementById('op-booking-form').reset();
        document.getElementById('op-date-error').style.display = 'none';
        document.getElementById('op-save-btn').disabled = false;

        modal.classList.add('active');
    },

    closeModal() {
        const modal = document.getElementById('outpatient-modal');
        if (modal) modal.classList.remove('active');
    },

    save() {
        const dose = parseFloat(document.getElementById('op-booking-dose').value);
        if (dose >= 30) {
            toast.show('小於30mCi方為小劑量門診預約條件', 'error');
            return;
        }

        const newBooking = {
            id: utils.generateId(),
            date: document.getElementById('op-booking-date').value,
            bed: '小劑量門診',
            isOutpatient: true,
            chartNo: document.getElementById('op-booking-chart').value.toUpperCase(),
            patientName: document.getElementById('op-booking-name').value,
            dose: dose,
            doctor: document.getElementById('op-booking-doctor').value,
            medType: document.getElementById('op-booking-med-type').value,
            createdBy: state.currentUser.username,
            createdAt: new Date().toLocaleString('zh-TW', { hour12: false })
        };

        mockBookings.push(newBooking);
        auditLogs.logAction('CREATE', 'Booking_OP', newBooking.id, `新增小劑量預約：${newBooking.patientName} (${newBooking.dose}mCi)`);

        toast.show('小劑量預約已建立', 'success');
        this.closeModal();
        this.render();
    },

    delete(id) {
        if (!confirm('確定要刪除此小劑量預約嗎？')) return;

        const index = mockBookings.findIndex(b => b.id === id);
        if (index === -1) return;

        const booking = mockBookings[index];
        mockBookings.splice(index, 1);

        auditLogs.logAction('DELETE', 'Booking_OP', id, `刪除小劑量：${booking.patientName}`);

        this.render();
        toast.show('小劑量預約已刪除', 'success');
    }
};

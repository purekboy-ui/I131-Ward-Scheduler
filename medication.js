import { mockBookings, state } from './store.js';
import { utils, toast } from './utils.js';
import { auditLogs } from './logger.js';

export const medication_module = {
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
    },

    render(searchQuery = '') {
        const tbody = document.getElementById('medication-tbody');
        if (!tbody) return;

        // Security Check
        if (state.currentUser?.role !== 'admin' && state.currentUser?.role !== 'med_admin') {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color: var(--error);">無權限檢視此頁面</td></tr>`;
            return;
        }

        let filtered = mockBookings.filter(b => !b.isOutpatient); // 僅顯示住院床位訂藥

        const showOnlyUnordered = document.getElementById('med-filter-unorder')?.checked;
        if (showOnlyUnordered) {
            filtered = filtered.filter(b => !b.medOrdered);
        }

        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            filtered = filtered.filter(b =>
                b.chartNo.toLowerCase().includes(q) ||
                b.patientName.toLowerCase().includes(q)
            );
        }

        // 以日期排序，將近期的排在前面
        filtered.sort((a, b) => new Date(a.date) - new Date(b.date));

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

            const thyrogenBadge = b.thyrogen
                ? `<span class="bed-badge" style="background:var(--accent);">Yes</span>`
                : `<span style="color:var(--text-muted)">-</span>`;

            return `
                <tr>
                    <td>
                        <div style="font-weight:500">${b.date}</div>
                        <div style="font-size:0.85rem;color:var(--text-muted)">${new Date(b.date).toLocaleDateString('zh-TW', { weekday: 'short' })}</div>
                    </td>
                    <td><span class="bed-badge bed-${b.bed.toLowerCase()}">${b.bed}</span></td>
                    <td>
                        <div style="font-weight:500">${b.patientName}</div>
                        <div class="mono" style="font-size:0.85rem;color:var(--text-muted)">${b.chartNo}</div>
                    </td>
                    <td>
                        <div style="display: flex; gap: 8px; align-items: center;">
                            <input type="number" class="med-dose-input" data-id="${b.id}" value="${b.dose}" style="width: 70px; padding: 4px;" ${isOrdered ? 'disabled' : ''}> mCi
                            <select class="med-type-select" data-id="${b.id}" style="padding: 4px;" ${isOrdered ? 'disabled' : ''}>
                                <option value="錠劑" ${b.medType === '錠劑' || !b.medType ? 'selected' : ''}>錠劑</option>
                                <option value="水劑" ${b.medType === '水劑' ? 'selected' : ''}>水劑</option>
                            </select>
                        </div>
                    </td>
                    <td>${thyrogenBadge}</td>
                    <td>
                        <div style="display: flex; flex-direction: column; gap: 6px; align-items: flex-start;">
                            <span class="${statusClass}">${statusText}</span>
                            <button class="${btnClass} med-toggle-btn" data-id="${b.id}" style="padding: 4px 8px; font-size: 0.85rem;">${btnText}</button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

        // Bind update events (Auto save on blur/change without explicit save button, for better UX)
        tbody.querySelectorAll('.med-dose-input, .med-type-select').forEach(input => {
            input.addEventListener('change', (e) => {
                const id = parseInt(e.target.dataset.id);
                this.updateMedDoseAndType(id);
            });
        });

        tbody.querySelectorAll('.med-toggle-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = parseInt(btn.dataset.id);
                this.toggleOrderStatus(id);
            });
        });
    },

    updateMedDoseAndType(id) {
        const booking = mockBookings.find(b => b.id === id);
        if (!booking) return;

        const row = document.querySelector(`.med-dose-input[data-id="${id}"]`).closest('tr');
        const newDose = parseFloat(row.querySelector('.med-dose-input').value);
        const newType = row.querySelector('.med-type-select').value;

        let changes = [];
        if (booking.dose !== newDose) changes.push(`劑量 ${booking.dose}→${newDose}`);
        if (booking.medType !== newType) changes.push(`劑型 ${booking.medType || '錠劑'}→${newType}`);

        if (changes.length > 0) {
            booking.dose = newDose;
            booking.medType = newType;
            booking.updatedAt = new Date().toLocaleString('zh-TW', { hour12: false });

            auditLogs.logAction('UPDATE', 'Booking_Med', id, `管理員修正訂單：${booking.patientName} (${changes.join(', ')})`);
            toast.show('已自動儲存劑量與劑型', 'success');
        }
    },

    toggleOrderStatus(id) {
        const booking = mockBookings.find(b => b.id === id);
        if (!booking) return;

        booking.medOrdered = !booking.medOrdered;
        booking.updatedAt = new Date().toLocaleString('zh-TW', { hour12: false });

        const actionText = booking.medOrdered ? '確認已訂藥' : '已取消訂藥';
        auditLogs.logAction('MED_ORDER', 'Booking', id, `更改訂單狀態：${booking.patientName} (${actionText})`);

        toast.show(actionText, 'success');
        this.render(document.getElementById('med-search-input')?.value || '');
    }
};

import { mockBookings, state, dateOverrides } from './store.js';
import { utils, toast } from './utils.js';
import { auditLogs } from './logger.js';
import { calendar } from './calendar.js';

export const bookings_module = {
    init() {
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.addEventListener('input', utils.debounce((e) => {
                this.render(e.target.value);
            }, 300));
        }
    },

    render(searchQuery = '') {
        const tbody = document.getElementById('bookings-tbody');
        if (!tbody) return;

        let filtered = [...mockBookings];

        if (state.currentUser && state.currentUser.role !== 'admin' && state.currentUser.role !== 'med_admin') {
            filtered = filtered.filter(b => b.createdBy === state.currentUser.username);
        }

        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            filtered = filtered.filter(b =>
                b.chartNo.toLowerCase().includes(q) ||
                b.patientName.toLowerCase().includes(q) ||
                b.doctor.toLowerCase().includes(q)
            );
        }

        filtered.sort((a, b) => new Date(b.date) - new Date(a.date));

        if (filtered.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color: var(--text-muted); padding: var(--space-xl);">目前無預約資料</td></tr>`;
            return;
        }

        tbody.innerHTML = filtered.map(b => {
            const canModify = utils.canUserModify(b);
            const isLocked = utils.isLessThan21Days(b.date);
            const lockTitle = isLocked && state.currentUser?.role !== 'admin' ? '距離入住不足21天，若需更改請電洽管理員(義大核醫科櫃台)' : '編輯或刪除';
            const actionButtons = canModify ? `
                <div class="table-actions">
                    <button class="btn-icon list-edit-btn" data-id="${b.id}" title="${lockTitle}">✏️</button>
                    <button class="btn-icon delete list-delete-btn" data-id="${b.id}" title="${lockTitle}">🗑️</button>
                </div>
            ` : '';

            // 如果有設定使用 thyrogen，在此顯示
            const thyrogenBadge = b.thyrogen ? `<span class="bed-badge" style="background:var(--accent);margin-left:4px;font-size:0.7em;">Thyrogen</span>` : '';

            return `
                <tr>
                    <td>
                        <div style="font-weight:500">${b.date}</div>
                        <div style="font-size:0.85rem;color:var(--text-muted)">${new Date(b.date).toLocaleDateString('zh-TW', { weekday: 'short' })}</div>
                    </td>
                    <td><span class="bed-badge bed-${b.bed.toLowerCase()}">${b.bed}</span></td>
                    <td><div class="mono">${b.chartNo}</div></td>
                    <td>${b.patientName}</td>
                    <td>
                        <div style="font-weight:600">${b.dose} <span style="font-size:0.8em;font-weight:normal;color:var(--text-muted)">mCi</span></div>
                        <div style="font-size:0.85rem;color:var(--text-muted)">${b.medType || '錠劑'} ${thyrogenBadge}</div>
                    </td>
                    <td>${b.doctor}</td>
                    <td>${actionButtons}</td>
                </tr>
            `;
        }).join('');

        tbody.querySelectorAll('.list-edit-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = parseInt(btn.dataset.id);
                const booking = mockBookings.find(b => b.id === id);
                if (booking) {
                    // Check UI Lock
                    if (state.currentUser.role !== 'admin' && utils.isLessThan21Days(booking.date)) {
                        toast.show('距離入住小於21天，無法更改。若需更改請電洽管理員(義大核醫科櫃台)', 'error');
                        return;
                    }
                    // Assuming modal object exists in global or imported
                    window.modal?.openEdit(booking);
                }
            });
        });

        tbody.querySelectorAll('.list-delete-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = parseInt(btn.dataset.id);
                const booking = mockBookings.find(b => b.id === id);
                if (booking) {
                    if (state.currentUser.role !== 'admin' && utils.isLessThan21Days(booking.date)) {
                        toast.show('距離入住小於21天，無法刪除。若需更改請電洽管理員(義大核醫科櫃台)', 'error');
                        return;
                    }
                    this.delete(id);
                }
            });
        });
    },

    delete(id) {
        if (!confirm('確定要刪除此預約嗎？')) return;

        const index = mockBookings.findIndex(b => b.id === id);
        if (index === -1) return;

        const booking = mockBookings[index];
        mockBookings.splice(index, 1);

        auditLogs.logAction('DELETE', 'Booking', id, `刪除預約：${booking.patientName} ${booking.date} ${booking.bed}`);

        if (calendar && typeof calendar.render === 'function') {
            calendar.render();
        }
        this.render();
        if (window.auth && typeof window.auth.updateStats === 'function') {
            window.auth.updateStats();
        }
        toast.show('預約已刪除', 'success');
    },

    save(data) {
        // 新增防呆判斷（後端雙重檢查的概念）
        if (state.currentUser?.role !== 'admin' && utils.isLessThan21Days(data.date)) {
            toast.show('距離入住不足21天，一般使用者無法新增或修改該日期的床位，請電洽管理員。', 'error');
            return false;
        }

        if (state.editingBooking) {
            // Update
            const index = mockBookings.findIndex(b => b.id === state.editingBooking.id);
            if (index !== -1) {
                const oldBooking = { ...mockBookings[index] };
                mockBookings[index] = {
                    ...mockBookings[index],
                    ...data,
                    updatedAt: new Date().toLocaleString('zh-TW', { hour12: false }),
                    updatedBy: state.currentUser.username
                };

                // Track what changed for log
                let changes = [];
                if (oldBooking.dose !== data.dose) changes.push(`劑量 ${oldBooking.dose}→${data.dose}`);
                if (oldBooking.date !== data.date) changes.push(`日期 ${oldBooking.date}→${data.date}`);
                if (oldBooking.bed !== data.bed) changes.push(`床位 ${oldBooking.bed}→${data.bed}`);
                if (oldBooking.medType !== data.medType) changes.push(`劑型 ${oldBooking.medType || ''}→${data.medType}`);

                const detail = changes.length > 0
                    ? `更新預約：${oldBooking.patientName} (${changes.join(', ')})`
                    : `更新預約：${oldBooking.patientName} (無關鍵修改)`;

                auditLogs.logAction('UPDATE', 'Booking', state.editingBooking.id, detail);
                toast.show('預約已更新', 'success');
            }
        } else {
            // Create
            const newBooking = {
                id: utils.generateId(),
                ...data,
                createdBy: state.currentUser.username,
                createdAt: new Date().toLocaleString('zh-TW', { hour12: false }),
                medOrdered: false // 預設未訂藥
            };
            mockBookings.unshift(newBooking);

            auditLogs.logAction('CREATE', 'Booking', newBooking.id, `新增預約：${newBooking.patientName} ${newBooking.date} ${newBooking.bed}`);
            toast.show('預約已建立', 'success');
        }

        if (calendar && typeof calendar.render === 'function') {
            calendar.render();
        }
        this.render();
        if (window.auth && typeof window.auth.updateStats === 'function') {
            window.auth.updateStats();
        }
        return true;
    }
};

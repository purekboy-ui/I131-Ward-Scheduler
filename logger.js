import { mockAuditLogs, state } from './store.js';
import { toast } from './utils.js';

export const auditLogs = {
    init() {
        document.getElementById('search-logs-btn').addEventListener('click', () => this.filterLogs());
        document.getElementById('reset-logs-btn').addEventListener('click', () => this.resetFilter());
    },

    /**
     * 新增一筆操作日誌
     * @param {string} action - 'CREATE', 'UPDATE', 'DELETE', 'OVERRIDE', 'MED_ORDER'
     * @param {string} target - 目標模型 (例如 'Booking', 'Bed', 'Medication')
     * @param {string|number} targetId - 目標 ID
     * @param {string} detail - 詳細說明
     */
    logAction(action, target, targetId, detail) {
        if (!state.currentUser) return; // 沒登入不記錄

        const newLog = {
            id: mockAuditLogs.length > 0 ? Math.max(...mockAuditLogs.map(l => l.id)) + 1 : 1,
            userId: state.currentUser.username,
            action: action,
            target: target,
            targetId: targetId,
            detail: detail,
            timestamp: new Date().toLocaleString('zh-TW', { hour12: false })
        };

        mockAuditLogs.unshift(newLog);
        this.render();
    },

    render(filteredLogs = null) {
        const container = document.getElementById('audit-list');
        if (!container) return; // 如果在沒有此 UI 的頁面就不作爲

        const logs = filteredLogs || mockAuditLogs.slice(0, 50); // 防塞爆，預設顯示前 50 筆

        const icons = {
            CREATE: '➕',
            UPDATE: '✏️',
            DELETE: '🗑️',
            OVERRIDE: '🔧',
            MED_ORDER: '💊',
            OUTPATIENT: '🚶'
        };

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

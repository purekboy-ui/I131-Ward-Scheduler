import { mockBookings, state } from './store.js';
import { utils, toast } from './utils.js';
import { auditLogs } from './logger.js';

export const report_module = {
    init() {
        const extractMonthBtn = document.getElementById('extract-month-report');
        if (extractMonthBtn) {
            extractMonthBtn.addEventListener('click', () => this.generateMonthlyReport());
        }
    },

    generateMonthlyReport() {
        // Find current month range from state or current date
        const targetYear = state.currentYear;
        const targetMonth = state.currentMonth; // 0-indexed

        const firstDay = new Date(targetYear, targetMonth, 1);
        const lastDay = new Date(targetYear, targetMonth + 1, 0);

        let reportData = mockBookings.filter(b => {
            const bDate = new Date(b.date);
            return bDate >= firstDay && bDate <= lastDay && !b.isOutpatient;
        });

        if (reportData.length === 0) {
            toast.show('本月份無住院排程資料可匯出', 'warning');
            return;
        }

        // Sort by Date then Bed
        reportData.sort((a, b) => {
            if (a.date !== b.date) return new Date(a.date) - new Date(b.date);
            return a.bed.localeCompare(b.bed);
        });

        // Generate CSV Content
        // BOM for Excel UTF-8
        let csvContent = '\uFEFF';
        csvContent += '入住日期,床位,病歷號,病患姓名,醫令劑量(mCi),劑型,Thyrogen,主治醫師\n';

        reportData.forEach(row => {
            const rowData = [
                row.date,
                row.bed,
                row.chartNo,
                row.patientName,
                row.dose,
                row.medType || '錠劑',
                row.thyrogen ? '是' : '否',
                row.doctor
            ];
            // Escape quotes and wrap in quotes for CSV
            const csvRow = rowData.map(val => `"${String(val).replace(/"/g, '""')}"`).join(',');
            csvContent += csvRow + '\n';
        });

        // Trigger Download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');

        const monthStr = String(targetMonth + 1).padStart(2, '0');
        const filename = `I131月結報表_${targetYear}${monthStr}.csv`;

        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        auditLogs.logAction('CREATE', 'Report', `Month_${targetYear}${monthStr}`, `匯出月結報表：共 ${reportData.length} 筆資料`);
        toast.show('月結報表下載成功', 'success');
    }
};

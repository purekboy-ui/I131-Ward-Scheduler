import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { utils } from './utils.js';

describe('utils.js', () => {

    beforeEach(() => {
        vi.useFakeTimers();
        // Set date to local 2026-05-01 12:00:00 to avoid timezone offset issues
        const mockDate = new Date(2026, 4, 1, 12, 0, 0); // Month is 0-indexed, 4 = May
        vi.setSystemTime(mockDate);
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    describe('isLessThan21Days', () => {
        it('應該對小於 21 天的日期回傳 true', () => {
            // 今天是 2026-05-01，+20 天是 2026-05-21
            expect(utils.isLessThan21Days('2026-05-20')).toBe(true);
            expect(utils.isLessThan21Days('2026-05-21')).toBe(true);
        });

        it('應該對等於或大於 22 天的日期回傳 false', () => {
            // 今天是 2026-05-01，+21 天是 2026-05-22
            expect(utils.isLessThan21Days('2026-05-22')).toBe(false);
            expect(utils.isLessThan21Days('2026-06-01')).toBe(false);
        });

        it('應該對過去的日期回傳 true', () => {
            // 過去日期也應該視為不可編輯
            expect(utils.isLessThan21Days('2026-04-30')).toBe(true);
        });
    });

    describe('Date formatters', () => {
        it('formatDateShort 應正確回傳 YYYY-MM-DD', () => {
            const date = new Date(2026, 4, 1, 15, 30, 0);
            expect(utils.formatDateShort(date)).toBe('2026-05-01');
        });
    });

    describe('Holiday check', () => {
        it('應該能判斷國定假日', () => {
            expect(utils.isHoliday('2026-01-01')).toBe(true);
            expect(utils.isHoliday('2026-02-28')).toBe(true);
            expect(utils.isHoliday('2026-05-02')).toBe(false);
        });
    });
});

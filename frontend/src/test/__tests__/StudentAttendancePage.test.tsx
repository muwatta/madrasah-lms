import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import StudentAttendancePage from '../../pages/student/StudentAttendancePage';
import { LanguageProvider } from '../../context/LanguageContext';
import { ThemeProvider } from '../../context/ThemeContext';

const mockAttendanceAnalytics = vi.hoisted(() => ({
  analytics: vi.fn(),
}));

vi.mock('../../api', () => ({
  attendanceAPI: {
    analytics: mockAttendanceAnalytics.analytics,
  },
}));

describe('StudentAttendancePage', () => {
  beforeEach(() => {
    mockAttendanceAnalytics.analytics.mockReset();
    mockAttendanceAnalytics.analytics.mockResolvedValue({
      data: {
        weekly_rate: 85,
        days_present: 17,
        days_absent: 2,
        days_late: 1,
        days_excused: 1,
        total_days: 21,
        recent_records: [
          { id: 1, date: '2026-08-20', status: 'present', subject_name: 'Tafsir' },
          { id: 2, date: '2026-08-18', status: 'late', subject_name: 'Hadith' },
        ],
      },
    });
  });

  it('shows the weekly rate and attendance breakdown', async () => {
    render(
      <MemoryRouter>
        <LanguageProvider>
          <ThemeProvider>
            <StudentAttendancePage />
          </ThemeProvider>
        </LanguageProvider>
      </MemoryRouter>
    );

    expect(await screen.findByRole('heading', { name: '85%' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /status breakdown/i })).toBeInTheDocument();
    expect(screen.getAllByText(/present/i).length).toBeGreaterThan(0);
  });
});

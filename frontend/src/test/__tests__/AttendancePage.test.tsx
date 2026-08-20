import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import AttendancePage from '../../pages/teacher/AttendancePage';
import { LanguageProvider } from '../../context/LanguageContext';
import { ThemeProvider } from '../../context/ThemeContext';

const { mockFetchAllPages, mockAttendanceApi } = vi.hoisted(() => ({
  mockFetchAllPages: vi.fn(),
  mockAttendanceApi: {
    list: vi.fn(() => Promise.resolve([])),
    bulk: vi.fn(() => Promise.resolve({})),
    export: vi.fn(() => Promise.resolve({ data: '' })),
  },
}));

vi.mock('../../api', () => ({
  attendanceAPI: mockAttendanceApi,
  enrollmentAPI: { teacherStudents: vi.fn() },
  userAPI: { list: vi.fn() },
}));

vi.mock('../../api/client', () => ({
  fetchAllPages: (...args: unknown[]) => mockFetchAllPages(...args),
}));

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({ user: { role: 'ustaadh' } }),
}));

describe('AttendancePage', () => {
  beforeEach(() => {
    mockFetchAllPages.mockReset();
    mockFetchAllPages.mockImplementation(async (loader: (page: Record<string, number>) => Promise<unknown>) => {
      return loader({ page: 1, page_size: 20 });
    });
    mockAttendanceApi.list.mockResolvedValue([]);
    mockAttendanceApi.bulk.mockResolvedValue({});
  });

  it('shows a student search and attendance overview for teacher marking', async () => {
    mockFetchAllPages.mockResolvedValueOnce([
      {
        id: 1,
        student_id: 1,
        student_name: 'Aisha Khan',
        student_email: 'aisha@example.com',
        subject: 7,
        subject_name: 'Tafsir',
      },
      {
        id: 2,
        student_id: 2,
        student_name: 'Bilal Ahmed',
        student_email: 'bilal@example.com',
        subject: 7,
        subject_name: 'Tafsir',
      },
    ]);

    render(
      <MemoryRouter>
        <LanguageProvider>
          <ThemeProvider>
            <AttendancePage />
          </ThemeProvider>
        </LanguageProvider>
      </MemoryRouter>
    );

    expect(await screen.findByPlaceholderText(/search students/i)).toBeInTheDocument();
    expect(screen.getByText(/attendance overview/i)).toBeInTheDocument();
  });
});

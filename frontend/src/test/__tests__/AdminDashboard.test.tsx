import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import AdminDashboard from '../../pages/admin/AdminDashboard';
import { LanguageProvider } from '../../context/LanguageContext';
import { ThemeProvider } from '../../context/ThemeContext';

const mockDashboardApi = vi.hoisted(() => ({
  admin: vi.fn(),
}));

vi.mock('../../api', () => ({
  dashboardAPI: mockDashboardApi,
}));

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({ user: { full_name: 'Admin User', role: 'mudeer' } }),
}));

describe('AdminDashboard', () => {
  beforeEach(() => {
    mockDashboardApi.admin.mockReset();
    mockDashboardApi.admin.mockResolvedValue({
      data: {
        total_users: 120,
        total_students: 90,
        total_teachers: 12,
        total_parents: 30,
        pending_guests: 4,
        total_subjects: 8,
        total_quizzes: 16,
        total_exams: 7,
        average_performance: 78.5,
        subject_stats: [
          { id: 1, name_ar: 'الفقه', student_count: 32, quiz_count: 5 },
        ],
      },
    });
  });

  it('shows the overview header and school status summary', async () => {
    render(
      <MemoryRouter>
        <LanguageProvider>
          <ThemeProvider>
            <AdminDashboard />
          </ThemeProvider>
        </LanguageProvider>
      </MemoryRouter>
    );

    expect(await screen.findByRole('heading', { name: /admin dashboard/i })).toBeInTheDocument();
    expect(screen.getByText(/school overview/i)).toBeInTheDocument();
    expect(screen.getAllByText(/pending approvals/i).length).toBeGreaterThan(0);
  });
});

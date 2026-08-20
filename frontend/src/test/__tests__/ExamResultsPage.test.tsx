import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import ExamResultsPage from '../../pages/student/ExamResultsPage';
import { LanguageProvider } from '../../context/LanguageContext';
import { ThemeProvider } from '../../context/ThemeContext';

const mockExamApi = vi.hoisted(() => ({
  myResults: vi.fn(),
}));

vi.mock('../../api', () => ({
  examAPI: mockExamApi,
}));

vi.mock('../../api/client', () => ({
  fetchAllPages: vi.fn(async (fetchPage: (page: number) => Promise<{ data: unknown[] }>) => {
    const response = await fetchPage(1);
    return response.data;
  }),
}));

describe('ExamResultsPage', () => {
  beforeEach(() => {
    mockExamApi.myResults.mockReset();
    mockExamApi.myResults.mockResolvedValue({
      data: [
        {
          id: 1,
          subject_name: 'Older Subject',
          school_class_name: 'Primary 1',
          term_name: 'Term 1',
          total_score: '72',
          grade: 'B',
          grade_remark: '',
          submitted_at: '2026-08-10T09:00:00Z',
        },
        {
          id: 2,
          subject_name: 'Recent Subject',
          school_class_name: 'Primary 1',
          term_name: 'Term 1',
          total_score: '85',
          grade: 'A',
          grade_remark: '',
          submitted_at: '2026-08-20T09:00:00Z',
        },
      ],
    });
  });

  it('shows the most recent result first', async () => {
    render(
      <MemoryRouter>
        <LanguageProvider>
          <ThemeProvider>
            <ExamResultsPage />
          </ThemeProvider>
        </LanguageProvider>
      </MemoryRouter>
    );

    const recentSubject = await screen.findByText('Recent Subject');
    const olderSubject = screen.getByText('Older Subject');

    expect(recentSubject.compareDocumentPosition(olderSubject) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});

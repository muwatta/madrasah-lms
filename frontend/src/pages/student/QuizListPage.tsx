import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { quizAPI, subjectAPI } from '../../api';
import type { Quiz, Subject } from '../../types';

export default function QuizListPage() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [filterSubject, setFilterSubject] = useState<number | ''>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchQuizzes = async () => {
      setLoading(true);
      try {
        const params: Record<string, number> = {};
        if (filterSubject !== '') params.subject = filterSubject;
        const res = await quizAPI.list(params);
        setQuizzes(res.data.results || res.data || []);
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Failed to load quizzes');
      } finally {
        setLoading(false);
      }
    };
    fetchQuizzes();
  }, [filterSubject]);

  useEffect(() => {
    subjectAPI.list().then((res) => setSubjects(res.data.results || res.data || [])).catch(() => {});
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Quizzes</h1>
        <select
          value={filterSubject}
          onChange={(e) => setFilterSubject(e.target.value ? Number(e.target.value) : '')}
          className="px-4 py-2 rounded-lg border border-gray-300 bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
        >
          <option value="">All Subjects</option>
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="text-center py-12 text-emerald-600">Loading quizzes...</div>
      ) : error ? (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700">{error}</div>
      ) : quizzes.length === 0 ? (
        <div className="text-center py-12 text-gray-500">No quizzes available.</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {quizzes.map((quiz) => (
            <div key={quiz.id} className="bg-white rounded-xl shadow border border-emerald-100 p-6 flex flex-col">
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-gray-800 mb-2">{quiz.title}</h2>
                <p className="text-sm text-gray-500 mb-4 line-clamp-2">{quiz.description}</p>
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="px-2 py-1 rounded-full bg-emerald-100 text-emerald-700">{quiz.subject_name}</span>
                  <span className="px-2 py-1 rounded-full bg-blue-100 text-blue-700 capitalize">{quiz.quiz_type}</span>
                  <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-600">{quiz.question_count} Qs</span>
                  {quiz.time_limit_minutes && (
                    <span className="px-2 py-1 rounded-full bg-amber-100 text-amber-700">{quiz.time_limit_minutes} min</span>
                  )}
                </div>
              </div>
              <Link
                to={`/student/quizzes/${quiz.id}/take`}
                className="mt-4 block text-center py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition"
              >
                Start Quiz
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

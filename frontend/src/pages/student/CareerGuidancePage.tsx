import { useState, useEffect } from 'react';
import { guidanceAPI } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { SkeletonCard } from '../../components/Skeleton';

interface Career {
  career: string;
  description: string;
  required_skills: string[];
  avg_salary: string;
  growth_outlook: string;
}

interface University {
  name: string;
  location: string;
  website: string;
}

interface Course {
  name: string;
  provider: string;
  duration: string;
}

interface Recommendation {
  id: number;
  recommendations: Career[];
  recommended_universities: University[];
  recommended_courses: Course[];
  generated_at: string;
  is_current: boolean;
}

export default function CareerGuidancePage() {
  const { user } = useAuth();
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  const fetchRecommendations = async () => {
    setLoading(true);
    try {
      const res = await guidanceAPI.career.list();
      setRecommendations(res.data.results ?? res.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load recommendations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const handleGenerate = async () => {
    if (!user) return;
    setGenerating(true);
    setError('');
    try {
      await guidanceAPI.career.generate(user.id);
      await fetchRecommendations();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to generate recommendations');
    } finally {
      setGenerating(false);
    }
  };

  const current = recommendations.find((r) => r.is_current) || recommendations[0];

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="h-8 w-64 animate-pulse rounded bg-gray-200 dark:bg-gray-700 mb-2" />
            <div className="h-4 w-96 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)] dark:text-gray-100">Career Guidance</h1>
          <p className="text-[var(--color-text-muted)] dark:text-gray-400 mt-1">Discover career paths and opportunities tailored to your strengths</p>
        </div>
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
        >
          {generating ? (
            <>
              <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
              Generating...
            </>
          ) : (
            <>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
              Generate Recommendations
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm">{error}</div>
      )}

      {!current ? (
        <div className="bg-[var(--color-bg-primary)] dark:bg-gray-800 rounded-xl shadow-sm border border-[var(--color-border)] dark:border-gray-700 p-12 text-center">
          <div className="flex justify-center mb-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
              <svg className="h-8 w-8 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
            </div>
          </div>
          <h2 className="text-lg font-semibold text-[var(--color-text-primary)] dark:text-gray-100 mb-2">No Recommendations Yet</h2>
          <p className="text-[var(--color-text-muted)] dark:text-gray-400 mb-6 max-w-md mx-auto">
            Click the button above to generate personalized career recommendations based on your academic profile.
          </p>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
          >
            {generating ? 'Generating...' : 'Generate My Recommendations'}
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          <div>
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)] dark:text-gray-100 mb-4">Recommended Careers</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {current.recommendations.map((career, i) => (
                <div
                  key={i}
                  className="bg-[var(--color-bg-primary)] dark:bg-gray-800 rounded-xl shadow-sm border border-[var(--color-border)] dark:border-gray-700 p-6 opacity-0 animate-slide-up"
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  <h3 className="font-semibold text-[var(--color-text-primary)] dark:text-gray-100 text-lg mb-2">{career.career}</h3>
                  <p className="text-sm text-[var(--color-text-secondary)] dark:text-gray-300 mb-4">{career.description}</p>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs font-medium text-[var(--color-text-muted)] dark:text-gray-400 uppercase mb-1">Required Skills</p>
                      <div className="flex flex-wrap gap-1.5">
                        {career.required_skills.map((skill, j) => (
                          <span key={j} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div>
                        <p className="text-xs font-medium text-[var(--color-text-muted)] dark:text-gray-400">Avg. Salary</p>
                        <p className="font-medium text-[var(--color-text-secondary)] dark:text-gray-300">{career.avg_salary}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-medium text-[var(--color-text-muted)] dark:text-gray-400">Growth Outlook</p>
                        <p className="font-medium text-emerald-600 dark:text-emerald-400">{career.growth_outlook}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <h2 className="text-lg font-semibold text-[var(--color-text-primary)] dark:text-gray-100 mb-4">Recommended Universities</h2>
              <div className="space-y-3">
                {current.recommended_universities.map((uni, i) => (
                  <div
                    key={i}
                    className="bg-[var(--color-bg-primary)] dark:bg-gray-800 rounded-xl shadow-sm border border-[var(--color-border)] dark:border-gray-700 p-5 flex items-start gap-4 opacity-0 animate-slide-up"
                    style={{ animationDelay: `${(current.recommendations.length + i) * 80}ms` }}
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                      <svg className="h-5 w-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342" />
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-medium text-[var(--color-text-primary)] dark:text-gray-100">{uni.name}</h3>
                      <p className="text-sm text-[var(--color-text-muted)] dark:text-gray-400">{uni.location}</p>
                      {uni.website && (
                        <a
                          href={uni.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300"
                        >
                          Visit Website
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-[var(--color-text-primary)] dark:text-gray-100 mb-4">Recommended Courses</h2>
              <div className="space-y-3">
                {current.recommended_courses.map((course, i) => (
                  <div
                    key={i}
                    className="bg-[var(--color-bg-primary)] dark:bg-gray-800 rounded-xl shadow-sm border border-[var(--color-border)] dark:border-gray-700 p-5 flex items-start gap-4 opacity-0 animate-slide-up"
                    style={{ animationDelay: `${(current.recommendations.length + current.recommended_universities.length + i) * 80}ms` }}
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/30">
                      <svg className="h-5 w-5 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342" />
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-medium text-[var(--color-text-primary)] dark:text-gray-100">{course.name}</h3>
                      <p className="text-sm text-[var(--color-text-muted)] dark:text-gray-400">{course.provider}</p>
                      <p className="text-xs text-[var(--color-text-muted)] dark:text-gray-400 mt-1">Duration: {course.duration}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <p className="text-xs text-[var(--color-text-muted)] dark:text-gray-400 text-center">
            Generated on {new Date(current.generated_at).toLocaleDateString()} at{' '}
            {new Date(current.generated_at).toLocaleTimeString()}
          </p>
        </div>
      )}
    </div>
  );
}

import { useState, useEffect } from 'react'
import { useLanguage } from '../../context/LanguageContext'
import { useExport } from '../../hooks/useExport'
import { resultsAPI } from '../../api'
import { fetchAllPages } from '../../api/client'

export default function MyResultsPage() {
  const { t } = useLanguage()
  const { exporting, exportData } = useExport()
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAllPages((p) => resultsAPI.student.myResults(p))
      .then(setResults)
      .finally(() => setLoading(false))
  }, [])

  const terms = [...new Set(results.map(r => r.term_number))].sort()
  const termIds = Object.fromEntries(results.map(r => [r.term_number, r.term]))
  const studentId = results[0]?.student

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A': return 'text-green-600 dark:text-green-400'
      case 'B': return 'text-blue-600 dark:text-blue-400'
      case 'C': return 'text-amber-600 dark:text-amber-400'
      case 'D': return 'text-orange-500 dark:text-orange-400'
      case 'F': return 'text-red-600 dark:text-red-400'
      default: return ''
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center py-12">
          <svg className="h-8 w-8 animate-spin text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      </div>
    )
  }

  if (results.length === 0) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">{t('results.myResults')}</h1>
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-blue-700 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
          {t('results.noPublishedResults')}
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">{t('results.myResults')}</h1>

      {terms.map(termNum => {
        const termResults = results.filter(r => r.term_number === termNum)
        const termName = termResults[0]?.term_name
        return (
          <div key={termNum} className="rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800 mb-6">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{t('results.term')} {termNum}: {termName}</h2>
                <button
                  onClick={() => {
                    const termId = termIds[termNum]
                    if (termId && studentId) {
                      exportData(
                        () => resultsAPI.reportCard.pdfByStudentTerm(studentId, termId),
                        `report_card_term_${termNum}.pdf`,
                      )
                    }
                  }}
                  disabled={exporting}
                  className="btn-press inline-flex items-center gap-1.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
                >
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  PDF
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-gray-200 dark:border-gray-700">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">{t('results.subject')}</th>
                      <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">{t('results.totalScore')}</th>
                      <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">{t('results.grade')}</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">{t('results.details')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {termResults.map((r, i) => (
                      <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">{r.subject_name}</td>
                        <td className="px-4 py-3 text-center text-gray-700 dark:text-gray-300">{r.total_score}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`font-bold text-lg ${getGradeColor(r.grade)}`}>{r.grade}</span>
                        </td>
                        <td className="px-4 py-3">
                          {r.components?.length > 0 && (
                            <details className="rounded-lg border border-gray-200 dark:border-gray-700 group">
                              <summary className="cursor-pointer px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-t-lg list-none flex items-center justify-between">
                                {t('results.viewComponents')}
                                <svg className="h-4 w-4 text-gray-400 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                              </summary>
                              <div className="px-4 pt-2 pb-3 border-t border-gray-200 dark:border-gray-700">
                                {r.components.map((c: any, j: number) => (
                                  <div key={j} className="flex justify-between text-sm py-1 border-b border-gray-200 dark:border-gray-700 last:border-0">
                                    <span>
                                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium mr-1 ${
                                        c.component_type === 'assignment'
                                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                                          : c.component_type === 'test'
                                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
                                            : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                                      }`}>
                                        {c.component_type}
                                      </span>
                                      {c.component_name}
                                    </span>
                                    <span className="font-medium text-gray-900 dark:text-gray-100">{c.score}/{c.max_score}</span>
                                  </div>
                                ))}
                              </div>
                            </details>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

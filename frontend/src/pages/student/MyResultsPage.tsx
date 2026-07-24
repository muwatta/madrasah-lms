import { useState, useEffect } from 'react'
import { useLanguage } from '../../context/LanguageContext'
import { useExport } from '../../hooks/useExport'
import { resultsAPI } from '../../api'

export default function MyResultsPage() {
  const { t } = useLanguage()
  const { exporting, exportData } = useExport()
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    resultsAPI.student.myResults()
      .then(r => setResults(Array.isArray(r.data) ? r.data : r.data?.results || []))
      .finally(() => setLoading(false))
  }, [])

  const terms = [...new Set(results.map(r => r.term_number))].sort()
  const termIds = Object.fromEntries(results.map(r => [r.term_number, r.term]))
  const studentId = results[0]?.student

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A': return 'text-success'
      case 'B': return 'text-info'
      case 'C': return 'text-warning'
      case 'D': return 'text-orange-500'
      case 'F': return 'text-error'
      default: return ''
    }
  }

  if (loading) {
    return <div className="flex justify-center py-12"><span className="loading loading-spinner loading-lg"></span></div>
  }

  if (results.length === 0) {
    return (
      <div className="p-4 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">{t('results.myResults')}</h1>
        <div className="alert alert-info">{t('results.noPublishedResults')}</div>
      </div>
    )
  }

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">{t('results.myResults')}</h1>

      {terms.map(termNum => {
        const termResults = results.filter(r => r.term_number === termNum)
        const termName = termResults[0]?.term_name
        return (
          <div key={termNum} className="card bg-base-100 shadow-md mb-6">
            <div className="card-body">
              <div className="flex items-center justify-between mb-4">
                <h2 className="card-title text-lg">{t('results.term')} {termNum}: {termName}</h2>
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
                <table className="table table-zebra">
                  <thead>
                    <tr>
                      <th>{t('results.subject')}</th>
                      <th className="text-center">{t('results.totalScore')}</th>
                      <th className="text-center">{t('results.grade')}</th>
                      <th>{t('results.details')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {termResults.map((r, i) => (
                      <tr key={i}>
                        <td className="font-medium">{r.subject_name}</td>
                        <td className="text-center">{r.total_score}</td>
                        <td className="text-center">
                          <span className={`font-bold text-lg ${getGradeColor(r.grade)}`}>{r.grade}</span>
                        </td>
                        <td>
                          {r.components?.length > 0 && (
                            <details className="collapse collapse-arrow">
                              <summary className="collapse-title text-sm p-0 min-h-0">{t('results.viewComponents')}</summary>
                              <div className="collapse-content p-0 pt-2">
                                {r.components.map((c: any, j: number) => (
                                  <div key={j} className="flex justify-between text-sm py-1 border-b border-base-200 last:border-0">
                                    <span>
                                      <span className={`badge badge-xs ${c.component_type === 'assignment' ? 'badge-info' : c.component_type === 'test' ? 'badge-warning' : 'badge-error'} mr-1`}>
                                        {c.component_type}
                                      </span>
                                      {c.component_name}
                                    </span>
                                    <span className="font-medium">{c.score}/{c.max_score}</span>
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

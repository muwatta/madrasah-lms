import { useState, useEffect } from 'react'
import { useLanguage } from '../../context/LanguageContext'
import { resultsAPI } from '../../api'
import toast from 'react-hot-toast'

export default function ResultEntryPage() {
  const { t } = useLanguage()

  const [subjects, setSubjects] = useState<any[]>([])
  const [terms, setTerms] = useState<any[]>([])
  const [selectedSubject, setSelectedSubject] = useState('')
  const [selectedTerm, setSelectedTerm] = useState('')
  const [components, setComponents] = useState<any[]>([])
  const [scores, setScores] = useState<Record<string, Record<number, string>>>({})
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [status, setStatus] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      resultsAPI.teacher.subjects().then(r => setSubjects(r.data)),
      resultsAPI.teacher.terms().then(r => setTerms(r.data)),
    ]).finally(() => setLoading(false))
  }, [])

  const loadComponents = () => {
    if (!selectedSubject || !selectedTerm) return
    setLoading(true)
    resultsAPI.teacher.components({ subject: selectedSubject, term: selectedTerm })
      .then(r => setComponents(r.data))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    if (selectedSubject && selectedTerm) loadComponents()
  }, [selectedSubject, selectedTerm])

  const handleGenerate = async () => {
    if (!selectedSubject || !selectedTerm) return
    const subject = subjects.find(s => String(s.id) === selectedSubject)
    if (!subject) return
    const term = terms.find(t => String(t.id) === selectedTerm)
    if (!term) return
    try {
      await resultsAPI.teacher.generateComponents({
        subject: Number(selectedSubject),
        term: Number(selectedTerm),
        school_class: 1,
      })
      toast.success(t('results.componentsGenerated'))
      loadComponents()
    } catch (e: any) {
      toast.error(e.response?.data?.error || t('results.generateFailed'))
    }
  }

  const handleScoreChange = (componentId: number, studentId: number, value: string) => {
    setScores(prev => ({
      ...prev,
      [componentId]: { ...(prev[componentId] || {}), [studentId]: value }
    }))
  }

  const handleSaveScores = async (componentId: number) => {
    const componentScores = scores[componentId]
    if (!componentScores) return
    setSaving(true)
    try {
      const payload = {
        scores: Object.entries(componentScores).map(([student, score]) => ({
          student,
          score,
        }))
      }
      await resultsAPI.teacher.bulkScores(componentId, payload)
      toast.success(t('results.scoresSaved'))
    } catch (e: any) {
      toast.error(e.response?.data?.error || t('results.saveFailed'))
    } finally {
      setSaving(false)
    }
  }

  const handleSubmit = async () => {
    if (!selectedSubject || !selectedTerm) return
    setSubmitting(true)
    try {
      await resultsAPI.teacher.submit({ subject: Number(selectedSubject), term: Number(selectedTerm) })
      toast.success(t('results.submittedForReview'))
      setStatus('submitted')
    } catch (e: any) {
      toast.error(e.response?.data?.error || t('results.submitFailed'))
    } finally {
      setSubmitting(false)
    }
  }

  const getStatus = () => {
    if (components.length === 0) return null
    const hasScores = components.some(c => c.score_count > 0)
    if (status === 'submitted') return 'submitted'
    if (hasScores) return 'in_progress'
    return 'draft'
  }

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">{t('results.resultEntry')}</h1>

      <div className="flex gap-4 mb-6">
        <select
          className="select select-bordered w-full max-w-xs"
          value={selectedSubject}
          onChange={e => { setSelectedSubject(e.target.value); setStatus(null); }}
        >
          <option value="">{t('results.selectSubject')}</option>
          {subjects.map(s => (
            <option key={s.id} value={s.id}>{s.name_ar} - {s.name_en}</option>
          ))}
        </select>

        <select
          className="select select-bordered w-full max-w-xs"
          value={selectedTerm}
          onChange={e => { setSelectedTerm(e.target.value); setStatus(null); }}
        >
          <option value="">{t('results.selectTerm')}</option>
          {terms.map(t => (
            <option key={t.id} value={t.id}>
              {t.name} {t.hijri_start ? `(${t.hijri_start} - ${t.hijri_end})` : ''}
            </option>
          ))}
        </select>

        {selectedSubject && selectedTerm && (
          <button className="btn btn-outline btn-sm" onClick={handleGenerate} disabled={loading}>
            {t('results.generateComponents')}
          </button>
        )}
      </div>

      {loading && <div className="text-center py-8"><span className="loading loading-spinner loading-lg"></span></div>}

      {!loading && components.length === 0 && selectedSubject && selectedTerm && (
        <div className="alert alert-info">{t('results.noComponents')}</div>
      )}

      {components.map(comp => (
        <div key={comp.id} className="card bg-base-100 shadow-md mb-4">
          <div className="card-body">
            <div className="flex justify-between items-center mb-2">
              <h3 className="card-title text-lg">
                <span className={`badge ${comp.component_type === 'assignment' ? 'badge-info' : comp.component_type === 'test' ? 'badge-warning' : 'badge-error'} mr-2`}>
                  {comp.component_type}
                </span>
                {comp.name}
                <span className="text-sm font-normal text-base-content/60 ml-2">
                  ({t('results.weight')}: {comp.weight}%)
                </span>
              </h3>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => handleSaveScores(comp.id)}
                disabled={saving}
              >
                {saving ? <span className="loading loading-spinner loading-xs"></span> : t('common.save')}
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="table table-zebra table-sm">
                <thead>
                  <tr>
                    <th className="w-12">#</th>
                    <th>{t('results.student')}</th>
                    <th className="w-32">{t('results.score')} / {comp.max_score}</th>
                    <th className="w-48">{t('results.remarks')}</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 5 }, (_, i) => (
                    <tr key={i}>
                      <td>{i + 1}</td>
                      <td>{t('results.studentPlaceholder')} {i + 1}</td>
                      <td>
                        <input
                          type="number"
                          className="input input-bordered input-sm w-full"
                          min="0"
                          max={comp.max_score}
                          placeholder="0"
                          value={scores[comp.id]?.[i] || ''}
                          onChange={e => handleScoreChange(comp.id, i, e.target.value)}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          className="input input-bordered input-sm w-full"
                          placeholder={t('results.remarksPlaceholder')}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ))}

      {components.length > 0 && (
        <div className="flex justify-between items-center mt-6 p-4 bg-base-200 rounded-lg">
          <div className="flex items-center gap-2">
            <span className="font-medium">{t('results.status')}:</span>
            <span className={`badge ${getStatus() === 'submitted' ? 'badge-success' : getStatus() === 'in_progress' ? 'badge-info' : 'badge-ghost'}`}>
              {getStatus() === 'submitted' ? t('results.submitted') : getStatus() === 'in_progress' ? t('results.inProgress') : t('results.draft')}
            </span>
          </div>
          <button
            className="btn btn-accent"
            onClick={handleSubmit}
            disabled={submitting || getStatus() === 'submitted'}
          >
            {submitting ? <span className="loading loading-spinner loading-xs"></span> : t('results.submitForReview')}
          </button>
        </div>
      )}
    </div>
  )
}

import { useState, useEffect, useCallback } from 'react'
import { useLanguage } from '../../context/LanguageContext'
import { useAuth } from '../../context/AuthContext'
import { resultsAPI, enrollmentAPI, academicAPI, schoolClassAPI } from '../../api'
import { unwrapPaginated } from '../../api/client'
import toast from 'react-hot-toast'

interface Subject {
  id: number
  name_ar: string
  name_en: string
  code?: string
}

interface Term {
  id: number
  name: string
  hijri_start?: string
  hijri_end?: string
}

interface Session {
  id: number
  name: string
  hijri_year?: number
  is_current: boolean
}

interface SchoolClass {
  id: number
  name_ar: string
  name_en: string
  order?: number
}

interface Component {
  id: number
  name: string
  component_type: string
  max_score: number
  weight: number
  score_count: number
  subject: number
  term: number
  school_class: number
}

interface EnrolledStudent {
  id: number
  student: number
  student_name: string
  student_email: string
  subject?: number
  subject_name?: string
  subject_name_en?: string
  school_class: number
  school_class_name: string
}

interface StudentScore {
  student: number
  score: string
  remarks: string
}

export default function ResultEntryPage() {
  const { t } = useLanguage()
  const { user } = useAuth()
  const isTeacher = user?.role === 'ustaadh'

  const [sessions, setSessions] = useState<Session[]>([])
  const [selectedSession, setSelectedSession] = useState('')

  const [terms, setTerms] = useState<Term[]>([])
  const [selectedTerm, setSelectedTerm] = useState('')

  const [subjects, setSubjects] = useState<Subject[]>([])
  const [selectedSubject, setSelectedSubject] = useState('')

  const [classes, setClasses] = useState<SchoolClass[]>([])
  const [selectedClass, setSelectedClass] = useState('')

  const [components, setComponents] = useState<Component[]>([])
  const [students, setStudents] = useState<EnrolledStudent[]>([])
  const [existingScores, setExistingScores] = useState<Record<number, StudentScore[]>>({})
  const [scores, setScores] = useState<Record<number, Record<number, string>>>({})
  const [remarks, setRemarks] = useState<Record<number, Record<number, string>>>({})
  const [loading, setLoading] = useState(false)
  const [loadingStudents, setLoadingStudents] = useState(false)
  const [saving, setSaving] = useState<Record<number, boolean>>({})
  const [submitting, setSubmitting] = useState(false)
  const [status, setStatus] = useState<string | null>(null)
  const [loadErrors, setLoadErrors] = useState<string[]>([])

  useEffect(() => {
    const errors: string[] = []
    Promise.allSettled([
      academicAPI.sessions.list().catch(e => { errors.push(`Sessions: ${e.response?.statusText || e.message}`); throw e }),
      isTeacher ? enrollmentAPI.teacherClasses().catch(e => { errors.push(`Classes: ${e.response?.statusText || e.message}`); throw e }) : schoolClassAPI.list().catch(e => { errors.push(`Classes: ${e.response?.statusText || e.message}`); throw e }),
      resultsAPI.teacher.subjects().catch(e => { errors.push(`Subjects: ${e.response?.statusText || e.message}`); throw e }),
    ]).then(([sessionsRes, classesRes, subjectsRes]) => {
      if (sessionsRes.status === 'fulfilled') {
        const allSessions = unwrapPaginated<Session>(sessionsRes.value.data)
        setSessions(allSessions)
        const current = allSessions.find(s => s.is_current)
        if (current) setSelectedSession(String(current.id))
      }
      if (classesRes.status === 'fulfilled') {
        const allClasses = unwrapPaginated<SchoolClass>(classesRes.value.data)
        setClasses(allClasses)
      }
      if (subjectsRes.status === 'fulfilled') {
        setSubjects(unwrapPaginated(subjectsRes.value.data))
      }
      if (errors.length > 0) setLoadErrors(errors)
    })
  }, [isTeacher])

  useEffect(() => {
    if (!selectedSession) return
    academicAPI.terms.list({ session: selectedSession })
      .then(res => setTerms(unwrapPaginated<Term>(res.data)))
      .catch(() => setTerms([]))
  }, [selectedSession])

  const loadStudents = useCallback(async () => {
    if (!selectedSubject || !selectedClass) {
      setStudents([])
      return
    }
    setLoadingStudents(true)
    try {
      const params: Record<string, string> = {
        subject: selectedSubject,
        school_class: selectedClass,
      }
      if (isTeacher) params.ustaadh = String(user!.id)
      const res = await enrollmentAPI.list(params)
      setStudents(unwrapPaginated<any>(res.data))
    } catch {
      setStudents([])
    } finally {
      setLoadingStudents(false)
    }
  }, [selectedSubject, selectedClass, isTeacher, user])

  useEffect(() => {
    loadStudents()
  }, [loadStudents])

  const loadComponents = useCallback(() => {
    if (!selectedSubject || !selectedTerm || !selectedClass) return
    setLoading(true)
    resultsAPI.teacher.components({ subject: selectedSubject, term: selectedTerm, school_class: selectedClass })
      .then(r => setComponents(unwrapPaginated(r.data)))
      .finally(() => setLoading(false))
  }, [selectedSubject, selectedTerm, selectedClass])

  useEffect(() => {
    if (selectedSubject && selectedTerm && selectedClass) loadComponents()
    else setComponents([])
  }, [selectedSubject, selectedTerm, selectedClass, loadComponents])

  const loadExistingScores = useCallback(async (componentId: number) => {
    try {
      const res = await resultsAPI.teacher.scores({ component: componentId })
      const scoreList: StudentScore[] = unwrapPaginated(res.data).map((sr: any) => ({
        student: sr.student,
        score: String(sr.score),
        remarks: sr.remarks || '',
      }))
      setExistingScores(prev => ({ ...prev, [componentId]: scoreList }))

      const compScores: Record<number, string> = {}
      const compRemarks: Record<number, string> = {}
      scoreList.forEach(s => {
        compScores[s.student] = s.score
        compRemarks[s.student] = s.remarks
      })
      setScores(prev => ({ ...prev, [componentId]: compScores }))
      setRemarks(prev => ({ ...prev, [componentId]: compRemarks }))
    } catch {
      setExistingScores(prev => ({ ...prev, [componentId]: [] }))
    }
  }, [])

  useEffect(() => {
    if (components.length > 0) {
      components.forEach(c => loadExistingScores(c.id))
    }
  }, [components, loadExistingScores])

  const handleGenerate = async () => {
    if (!selectedSubject || !selectedTerm || !selectedClass) return
    try {
      await resultsAPI.teacher.generateComponents({
        subject: Number(selectedSubject),
        term: Number(selectedTerm),
        school_class: Number(selectedClass),
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

  const handleRemarksChange = (componentId: number, studentId: number, value: string) => {
    setRemarks(prev => ({
      ...prev,
      [componentId]: { ...(prev[componentId] || {}), [studentId]: value }
    }))
  }

  const handleSaveScores = async (componentId: number) => {
    const componentScores = scores[componentId]
    const componentRemarks = remarks[componentId] || {}
    if (!componentScores) return
    setSaving(prev => ({ ...prev, [componentId]: true }))
    try {
      await resultsAPI.teacher.bulkScores(componentId, {
        scores: Object.entries(componentScores).map(([student, score]) => ({
          student,
          score,
          remarks: componentRemarks[Number(student)] || '',
        }))
      })
      toast.success(t('results.scoresSaved'))
      loadExistingScores(componentId)
    } catch (e: any) {
      toast.error(e.response?.data?.error || t('results.saveFailed'))
    } finally {
      setSaving(prev => ({ ...prev, [componentId]: false }))
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
    const hasScores = components.some(c => (existingScores[c.id]?.length || 0) > 0)
    if (status === 'submitted') return 'submitted'
    if (hasScores) return 'in_progress'
    return 'draft'
  }

  const hasClassSelected = !!selectedClass
  const hasSubjectSelected = !!selectedSubject
  const hasTermSelected = !!selectedTerm
  const hasSessionSelected = !!selectedSession
  const allSelected = hasSubjectSelected && hasTermSelected && hasClassSelected

  const selectCls = 'w-full rounded-lg border border-[var(--color-border)] bg-white px-3 py-2.5 text-sm text-[var(--color-text-primary)] transition-colors focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:focus:border-primary-500 dark:focus:ring-primary-900/30'

  const DropdownLabel = ({ icon, label }: { icon: string; label: string }) => (
    <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-[var(--color-text-secondary)] dark:text-gray-400">
      <span className="text-sm">{icon}</span>
      {label}
    </label>
  )

  const selectedSubjectObj = subjects.find(s => String(s.id) === selectedSubject)
  const selectedClassObj = classes.find(c => String(c.id) === selectedClass)
  const selectedTermObj = terms.find(tm => String(tm.id) === selectedTerm)
  const selectedSessionObj = sessions.find(s => String(s.id) === selectedSession)

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="mb-1 text-2xl font-bold text-[var(--color-text-primary)] dark:text-gray-100">{t('results.resultEntry')}</h1>
        <p className="text-sm text-[var(--color-text-muted)] dark:text-gray-400">{t('guides.resultEntry')}</p>
      </div>

      {loadErrors.length > 0 && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          <p className="font-medium mb-1">{t('results.loadFailed')}:</p>
          <ul className="list-disc list-inside">{loadErrors.map((e, i) => <li key={i}>{e}</li>)}</ul>
        </div>
      )}

      <div className="mb-6 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-primary)] p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <DropdownLabel icon="📅" label={t('results.selectYear')} />
            <select
              className={selectCls}
              value={selectedSession}
              onChange={e => {
                setSelectedSession(e.target.value)
                setSelectedTerm('')
                setStatus(null)
              }}
            >
              <option value="">{t('results.selectYear')}</option>
              {(sessions || []).map(s => (
                <option key={s.id} value={s.id}>
                  {s.name} {s.is_current ? `(${t('common.current')})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <DropdownLabel icon="🗓️" label={t('results.term')} />
            <select
              className={selectCls}
              value={selectedTerm}
              onChange={e => { setSelectedTerm(e.target.value); setStatus(null) }}
              disabled={!hasSessionSelected}
            >
              <option value="">{t('results.selectTerm')}</option>
              {(terms || []).map(tm => (
                <option key={tm.id} value={tm.id}>{tm.name}</option>
              ))}
            </select>
          </div>

          <div>
            <DropdownLabel icon="📖" label={t('results.subject')} />
            <select
              className={selectCls}
              value={selectedSubject}
              onChange={e => { setSelectedSubject(e.target.value); setStatus(null) }}
            >
              <option value="">{t('results.selectSubject')}</option>
              {(subjects || []).map(s => (
                <option key={s.id} value={s.id}>{s.name_ar} - {s.name_en}</option>
              ))}
            </select>
          </div>

          <div>
            <DropdownLabel icon="🏫" label={t('results.selectClass')} />
            <select
              className={selectCls}
              value={selectedClass}
              onChange={e => { setSelectedClass(e.target.value); setStatus(null) }}
            >
              <option value="">{t('results.selectClass')}</option>
              {(classes || []).map(c => (
                <option key={c.id} value={c.id}>{c.name_ar} - {c.name_en}</option>
              ))}
            </select>
          </div>
        </div>

        {(hasSessionSelected || hasTermSelected || hasSubjectSelected || hasClassSelected) && (
          <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--color-text-muted)] dark:text-gray-500">
            <span className="font-medium">{t('common.filter')}:</span>
            {selectedSessionObj && <span className="inline-flex items-center gap-1 rounded-full bg-primary-50 px-2.5 py-0.5 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400">{selectedSessionObj.name}</span>}
            {selectedTermObj && <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">{selectedTermObj.name}</span>}
            {selectedSubjectObj && <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400">{selectedSubjectObj.name_en}</span>}
            {selectedClassObj && <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2.5 py-0.5 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400">{selectedClassObj.name_en}</span>}
            <button
              onClick={() => { setSelectedSession(''); setSelectedTerm(''); setSelectedSubject(''); setSelectedClass(''); setComponents([]); setStudents([]) }}
              className="ml-1 text-xs text-red-500 hover:text-red-700 underline dark:text-red-400"
            >
              {t('common.clear')}
            </button>
          </div>
        )}
      </div>

      {hasSubjectSelected && hasClassSelected && (
        <div className="mb-6 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-primary)] shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-center justify-between border-b border-[var(--color-border-light)] px-5 py-3 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <span className="text-lg">👥</span>
              <h2 className="text-sm font-semibold text-[var(--color-text-primary)] dark:text-gray-100">
                {t('results.studentsCount')}
              </h2>
              {loadingStudents && (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
              )}
            </div>
            {!loadingStudents && (
              <span className="rounded-full bg-primary-100 px-2.5 py-0.5 text-xs font-semibold text-primary-700 dark:bg-primary-900/30 dark:text-primary-400">
                {students.length}
              </span>
            )}
          </div>

          {loadingStudents ? (
            <div className="px-5 py-8 text-center text-sm text-[var(--color-text-muted)] dark:text-gray-400">
              {t('common.loading')}...
            </div>
          ) : students.length === 0 ? (
            <div className="px-5 py-8 text-center">
              <p className="text-sm text-[var(--color-text-muted)] dark:text-gray-400">{t('results.noStudents')}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--color-border-light)] bg-[var(--color-bg-secondary)] text-xs font-medium uppercase tracking-wider text-[var(--color-text-muted)] dark:border-gray-700 dark:bg-gray-700/50 dark:text-gray-400">
                    <th className="w-12 px-4 py-2.5 text-center">#</th>
                    <th className="px-4 py-2.5 text-start">{t('results.student')}</th>
                    <th className="hidden px-4 py-2.5 text-start sm:table-cell">{t('results.subject')}</th>
                    <th className="hidden px-4 py-2.5 text-start sm:table-cell">{t('results.selectClass')}</th>
                    <th className="hidden px-4 py-2.5 text-start md:table-cell">Email</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border-light)] dark:divide-gray-700">
                  {students.map((student, idx) => (
                    <tr key={student.student} className="hover:bg-[var(--color-bg-secondary)] dark:hover:bg-gray-700/30">
                      <td className="px-4 py-2 text-center text-[var(--color-text-muted)] dark:text-gray-400">{idx + 1}</td>
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-xs font-semibold text-primary-700 dark:bg-primary-900/30 dark:text-primary-400">
                            {student.student_name?.charAt(0) || '?'}
                          </div>
                          <div>
                            <p className="font-medium text-[var(--color-text-primary)] dark:text-gray-100">{student.student_name}</p>
                            <p className="text-xs text-[var(--color-text-muted)] dark:text-gray-500 sm:hidden">{student.student_email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="hidden px-4 py-2 text-[var(--color-text-secondary)] sm:table-cell dark:text-gray-300">{student.subject_name_en || student.subject_name}</td>
                      <td className="hidden px-4 py-2 text-[var(--color-text-secondary)] sm:table-cell dark:text-gray-300">{student.school_class_name}</td>
                      <td className="hidden px-4 py-2 text-xs text-[var(--color-text-muted)] md:table-cell dark:text-gray-500">{student.student_email}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {allSelected && (
        <div className="mb-4 flex gap-3">
          <button
            onClick={handleGenerate}
            disabled={loading || students.length === 0}
            className="btn-press inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
          >
            <span>⚡</span>
            {t('results.generateComponents')}
          </button>
        </div>
      )}

      {loading && (
        <div className="py-12 text-center text-[var(--color-text-muted)] dark:text-gray-400">
          <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
          {t('common.loading')}...
        </div>
      )}

      {!loading && allSelected && components.length === 0 && (
        <div className="rounded-xl border border-dashed border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-8 text-center dark:border-gray-600 dark:bg-gray-800/50">
          <p className="mb-1 text-sm text-[var(--color-text-muted)] dark:text-gray-400">{t('results.noComponents')}</p>
          {students.length > 0 && (
            <p className="text-xs text-[var(--color-text-muted)] dark:text-gray-500">
              {t('results.studentsCount')}: {students.length}
            </p>
          )}
        </div>
      )}

      {(components || []).map(comp => (
        <div key={comp.id} className="mb-6 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-primary)] shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--color-border-light)] px-5 py-4 dark:border-gray-700">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full px-3 py-0.5 text-xs font-semibold capitalize" style={{ backgroundColor: comp.component_type === 'assignment' ? '#dbeafe' : comp.component_type === 'test' ? '#fef3c7' : '#fee2e2', color: comp.component_type === 'assignment' ? '#1d4ed8' : comp.component_type === 'test' ? '#92400e' : '#991b1b' }}>
                {comp.component_type === 'assignment' ? t('results.assignment') : comp.component_type === 'test' ? t('results.test') : t('results.exam')}
              </span>
              <h3 className="text-sm font-semibold text-[var(--color-text-primary)] dark:text-gray-100">{comp.name}</h3>
              <span className="text-xs text-[var(--color-text-muted)] dark:text-gray-500">
                {t('results.weight')}: {comp.weight}% · {t('results.maxScore')}: {comp.max_score}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-[var(--color-text-muted)] dark:text-gray-500">
                {existingScores[comp.id]?.length || 0}/{students.length} {t('results.scoresEntered')}
              </span>
              <button
                onClick={() => handleSaveScores(comp.id)}
                disabled={saving[comp.id]}
                className="btn-press rounded-lg bg-primary-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
              >
                {saving[comp.id] ? (
                  <span className="flex items-center gap-1.5">
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    {t('common.saving')}
                  </span>
                ) : t('common.save')}
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border-light)] bg-[var(--color-bg-secondary)] text-xs font-medium uppercase tracking-wider text-[var(--color-text-muted)] dark:border-gray-700 dark:bg-gray-700/50 dark:text-gray-400">
                  <th className="w-12 px-4 py-2.5 text-center">#</th>
                  <th className="px-4 py-2.5 text-start">{t('results.student')}</th>
                  <th className="w-40 px-4 py-2.5 text-center">{t('results.score')}</th>
                  <th className="w-56 px-4 py-2.5 text-start">{t('results.remarks')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border-light)] dark:divide-gray-700">
                {students.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-[var(--color-text-muted)] dark:text-gray-400">
                      {t('results.noStudents')}
                    </td>
                  </tr>
                ) : (students || []).map((student, idx) => (
                  <tr key={student.student} className="hover:bg-[var(--color-bg-secondary)] dark:hover:bg-gray-700/30">
                    <td className="px-4 py-2 text-center text-[var(--color-text-muted)] dark:text-gray-400">{idx + 1}</td>
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-100 text-xs font-semibold text-primary-700 dark:bg-primary-900/30 dark:text-primary-400">
                          {student.student_name?.charAt(0) || '?'}
                        </div>
                        <span className="font-medium text-[var(--color-text-primary)] dark:text-gray-100">{student.student_name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        min="0"
                        max={comp.max_score}
                        step="0.5"
                        value={scores[comp.id]?.[student.student] ?? ''}
                        onChange={e => handleScoreChange(comp.id, student.student, e.target.value)}
                        placeholder="0"
                        className="w-full rounded-lg border border-[var(--color-border)] bg-white px-3 py-1.5 text-center text-sm text-[var(--color-text-primary)] focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:focus:border-primary-500"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="text"
                        value={remarks[comp.id]?.[student.student] ?? ''}
                        onChange={e => handleRemarksChange(comp.id, student.student, e.target.value)}
                        placeholder={t('results.remarksPlaceholder')}
                        className="w-full rounded-lg border border-[var(--color-border)] bg-white px-3 py-1.5 text-sm text-[var(--color-text-primary)] focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:focus:border-primary-500"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {components.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-primary)] p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-[var(--color-text-secondary)] dark:text-gray-300">{t('results.status')}:</span>
            <span className={`rounded-full px-3 py-0.5 text-xs font-semibold ${
              getStatus() === 'submitted' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
              : getStatus() === 'in_progress' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
              : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
            }`}>
              {getStatus() === 'submitted' ? t('results.submitted')
                : getStatus() === 'in_progress' ? t('results.inProgress')
                : t('results.draft')}
            </span>
          </div>
          <button
            onClick={handleSubmit}
            disabled={submitting || getStatus() === 'submitted'}
            className="btn-press inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-6 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {submitting ? (
              <span className="flex items-center gap-1.5">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                {t('common.saving')}
              </span>
            ) : t('results.submitForReview')}
          </button>
        </div>
      )}
    </div>
  )
}

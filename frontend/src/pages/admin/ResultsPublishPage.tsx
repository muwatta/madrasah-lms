import { useState, useEffect } from 'react'
import { useLanguage } from '../../context/LanguageContext'
import { useExport } from '../../hooks/useExport'
import { resultsAPI } from '../../api'
import { fetchAllPages } from '../../api/client'
import toast from 'react-hot-toast'

export default function ResultsPublishPage() {
  const { t } = useLanguage()
  const { exporting, exportData } = useExport()

  const [pendingGroups, setPendingGroups] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [publishing, setPublishing] = useState<Record<string, boolean>>({})

  const loadPending = () => {
    setLoading(true)
    fetchAllPages((p) => resultsAPI.admin.pending(p))
      .then(results => {
        const groups: Record<string, any> = {}
        results.forEach((r: any) => {
          const key = `${r.subject}_${r.term}`
          if (!groups[key]) {
            groups[key] = {
              subject_id: r.subject,
              subject_name: r.subject_name,
              term_id: r.term,
              term_name: r.term_name,
              term_number: r.term_number,
              count: 0,
              students: [],
            }
          }
          groups[key].count++
          groups[key].students.push(r.student_name)
        })
        setPendingGroups(Object.values(groups))
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadPending() }, [])

  const handlePublish = async (subjectId: number, termId: number) => {
    const key = `${subjectId}_${termId}`
    setPublishing(prev => ({ ...prev, [key]: true }))
    try {
      await resultsAPI.admin.publish({ subject: subjectId, term: termId, action: 'publish' })
      toast.success(t('results.published'))
      loadPending()
    } catch (e: any) {
      toast.error(e.response?.data?.error || t('results.publishFailed'))
    } finally {
      setPublishing(prev => ({ ...prev, [key]: false }))
    }
  }

  const handleUnpublish = async (subjectId: number, termId: number) => {
    const key = `${subjectId}_${termId}`
    setPublishing(prev => ({ ...prev, [key]: true }))
    try {
      await resultsAPI.admin.publish({ subject: subjectId, term: termId, action: 'unpublish' })
      toast.success(t('results.unpublished'))
      loadPending()
    } catch (e: any) {
      toast.error(e.response?.data?.error || t('results.unpublishFailed'))
    } finally {
      setPublishing(prev => ({ ...prev, [key]: false }))
    }
  }

  const [activeTab, setActiveTab] = useState<'pending' | 'templates'>('pending')

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t('results.resultsManagement')}</h1>
        <div className="flex gap-2">
          <button
            onClick={() => exportData(() => resultsAPI.export.subjectResults(), 'subject_results.csv')}
            disabled={exporting}
            className="btn-press inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            {t('common.exportCsv')}
          </button>
          <button
            onClick={() => exportData(() => resultsAPI.export.termResults(), 'term_results.csv')}
            disabled={exporting}
            className="btn-press inline-flex items-center gap-2 rounded-lg border border-primary-200 bg-primary-50 px-4 py-2 text-sm font-medium text-primary-700 hover:bg-primary-100 disabled:opacity-50 dark:border-primary-700 dark:bg-primary-900/30 dark:text-primary-300 dark:hover:bg-primary-900/50"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            Term Results
          </button>
        </div>
      </div>

      <div className="mb-6 flex rounded-lg border border-gray-200 bg-gray-50 p-1 dark:border-gray-700 dark:bg-gray-800">
        <button
          className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'pending'
              ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-gray-100'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
          }`}
          onClick={() => setActiveTab('pending')}
        >
          {t('results.pendingResults')}
        </button>
        <button
          className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'templates'
              ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-gray-100'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
          }`}
          onClick={() => setActiveTab('templates')}
        >
          {t('results.weightTemplates')}
        </button>
      </div>

      {activeTab === 'pending' && (
        <>
          {loading && (
            <div className="text-center py-8">
              <svg className="mx-auto h-8 w-8 animate-spin text-emerald-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
          )}

          {!loading && pendingGroups.length === 0 && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-green-700 dark:border-green-800 dark:bg-green-900/20 dark:text-green-400">
              {t('results.noPendingResults')}
            </div>
          )}

          <div className="grid gap-4">
            {pendingGroups.map(group => {
              const key = `${group.subject_id}_${group.term_id}`
              return (
                <div key={key} className="rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
                  <div className="p-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{group.subject_name}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {t('results.term')}: {group.term_name} | {t('results.studentsCount')}: {group.count}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700"
                          onClick={() => handlePublish(group.subject_id, group.term_id)}
                          disabled={publishing[key]}
                        >
                          {publishing[key] ? (
                            <svg className="h-3.5 w-3.5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                          ) : t('results.publish')}
                        </button>
                        <button
                          className="rounded-lg bg-yellow-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-yellow-600"
                          onClick={() => handleUnpublish(group.subject_id, group.term_id)}
                          disabled={publishing[key]}
                        >
                          {t('results.unpublish')}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {activeTab === 'templates' && (
        <TemplateManager />
      )}
    </div>
  )
}

function TemplateManager() {
  const { t } = useLanguage()
  const [templates, setTemplates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [items, setItems] = useState<any[]>([])

  useEffect(() => {
    resultsAPI.admin.templates().then(r => setTemplates(r.data)).finally(() => setLoading(false))
  }, [])

  const handleEdit = async (id: number) => {
    try {
      const res = await resultsAPI.admin.getTemplate(id)
      setEditingId(id)
      setItems(res.data.items || [])
    } catch { toast.error(t('results.loadFailed')) }
  }

  const handleSave = async () => {
    if (!editingId) return
    try {
      await resultsAPI.admin.saveTemplateItems(editingId, { items })
      toast.success(t('results.templateSaved'))
      setEditingId(null)
    } catch { toast.error(t('results.saveFailed')) }
  }

  const addItem = () => {
    setItems(prev => [...prev, { component_type: 'assignment', name: '', weight: 0 }])
  }

  const updateItem = (index: number, field: string, value: any) => {
    setItems(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item))
  }

  const removeItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index))
  }

  const totalWeight = items.reduce((sum, item) => sum + Number(item.weight || 0), 0)

  if (loading) return (
    <div className="text-center py-8">
      <svg className="mx-auto h-8 w-8 animate-spin text-emerald-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
    </div>
  )

  return (
    <div className="space-y-4">
      {templates.length === 0 && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-blue-700 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
          {t('results.noTemplates')}
        </div>
      )}

      {templates.map(tmpl => (
        <div key={tmpl.id} className="rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="p-6">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{tmpl.school_class_name} - {tmpl.name}</h3>
              <div className="flex gap-2">
                {editingId === tmpl.id ? (
                  <>
                    <button className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700" onClick={handleSave}>{t('common.save')}</button>
                    <button className="rounded-lg px-2 py-1 text-xs font-medium text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700" onClick={() => setEditingId(null)}>{t('common.cancel')}</button>
                  </>
                ) : (
                  <button className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700" onClick={() => handleEdit(tmpl.id)}>{t('common.edit')}</button>
                )}
              </div>
            </div>

            {editingId === tmpl.id ? (
              <div>
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-gray-200 dark:border-gray-700">
                    <tr>
                      <th className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300">{t('results.componentType')}</th>
                      <th className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300">{t('results.componentName')}</th>
                      <th className="w-24 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300">{t('results.weight')} %</th>
                      <th className="w-20 px-4 py-2"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {items.map((item, i) => (
                      <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="px-4 py-2">
                          <select
                            className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                            value={item.component_type}
                            onChange={e => updateItem(i, 'component_type', e.target.value)}
                          >
                            <option value="assignment">{t('results.assignment')}</option>
                            <option value="test">{t('results.test')}</option>
                            <option value="exam">{t('results.exam')}</option>
                          </select>
                        </td>
                        <td className="px-4 py-2">
                          <input
                            className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                            value={item.name}
                            onChange={e => updateItem(i, 'name', e.target.value)}
                            placeholder={t('results.componentNamePlaceholder')}
                          />
                        </td>
                        <td className="px-4 py-2">
                          <input
                            className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                            type="number"
                            min="0"
                            max="100"
                            value={item.weight}
                            onChange={e => updateItem(i, 'weight', Number(e.target.value))}
                          />
                        </td>
                        <td className="px-4 py-2">
                          <button className="rounded-lg px-2 py-1 text-xs font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20" onClick={() => removeItem(i)}>✕</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="flex justify-between items-center mt-3">
                  <button className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700" onClick={addItem}>{t('results.addComponent')}</button>
                  <span className={`font-medium ${totalWeight !== 100 ? 'text-red-500' : 'text-emerald-600'}`}>
                    {t('results.totalWeight')}: {totalWeight}% {totalWeight !== 100 ? `(${t('results.mustBe100')})` : '✓'}
                  </span>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-gray-200 dark:border-gray-700">
                    <tr>
                      <th className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300">{t('results.componentType')}</th>
                      <th className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300">{t('results.componentName')}</th>
                      <th className="w-24 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300">{t('results.weight')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {tmpl.items?.map((item: any, i: number) => (
                      <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="px-4 py-2">
                          <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            item.component_type === 'assignment'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                              : item.component_type === 'test'
                                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                                : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                          }`}>{item.component_type}</span>
                        </td>
                        <td className="px-4 py-2">{item.name}</td>
                        <td className="px-4 py-2">{item.weight}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

import { useState, useEffect } from 'react'
import { useLanguage } from '../../context/LanguageContext'
import { useExport } from '../../hooks/useExport'
import { resultsAPI } from '../../api'
import toast from 'react-hot-toast'

export default function ResultsPublishPage() {
  const { t } = useLanguage()
  const { exporting, exportData } = useExport()

  const [pendingGroups, setPendingGroups] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [publishing, setPublishing] = useState<Record<string, boolean>>({})

  const loadPending = () => {
    setLoading(true)
    resultsAPI.admin.pending()
      .then(r => {
        const results = Array.isArray(r.data) ? r.data : r.data?.results || []
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
    <div className="p-4 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{t('results.resultsManagement')}</h1>
        <div className="flex gap-2">
          <button
            onClick={() => exportData(() => resultsAPI.export.subjectResults(), 'subject_results.csv')}
            disabled={exporting}
            className="btn-press inline-flex items-center gap-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            {t('common.exportCsv')}
          </button>
          <button
            onClick={() => exportData(() => resultsAPI.export.termResults(), 'term_results.csv')}
            disabled={exporting}
            className="btn-press inline-flex items-center gap-2 rounded-lg border border-primary-200 dark:border-primary-700 bg-primary-50 dark:bg-primary-900/30 px-4 py-2 text-sm font-medium text-primary-700 dark:text-primary-300 hover:bg-primary-100 dark:hover:bg-primary-900/50 disabled:opacity-50"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            Term Results
          </button>
        </div>
      </div>

      <div className="tabs tabs-box mb-6">
        <button className={`tab ${activeTab === 'pending' ? 'tab-active' : ''}`} onClick={() => setActiveTab('pending')}>
          {t('results.pendingResults')}
        </button>
        <button className={`tab ${activeTab === 'templates' ? 'tab-active' : ''}`} onClick={() => setActiveTab('templates')}>
          {t('results.weightTemplates')}
        </button>
      </div>

      {activeTab === 'pending' && (
        <>
          {loading && <div className="text-center py-8"><span className="loading loading-spinner loading-lg"></span></div>}

          {!loading && pendingGroups.length === 0 && (
            <div className="alert alert-success">{t('results.noPendingResults')}</div>
          )}

          <div className="grid gap-4">
            {pendingGroups.map(group => {
              const key = `${group.subject_id}_${group.term_id}`
              return (
                <div key={key} className="card bg-base-100 shadow-md">
                  <div className="card-body">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="card-title">{group.subject_name}</h3>
                        <p className="text-sm text-base-content/60">
                          {t('results.term')}: {group.term_name} | {t('results.studentsCount')}: {group.count}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          className="btn btn-success btn-sm"
                          onClick={() => handlePublish(group.subject_id, group.term_id)}
                          disabled={publishing[key]}
                        >
                          {publishing[key] ? <span className="loading loading-spinner loading-xs"></span> : t('results.publish')}
                        </button>
                        <button
                          className="btn btn-warning btn-sm"
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

  if (loading) return <div className="text-center py-8"><span className="loading loading-spinner loading-lg"></span></div>

  return (
    <div className="space-y-4">
      {templates.length === 0 && <div className="alert alert-info">{t('results.noTemplates')}</div>}

      {templates.map(tmpl => (
        <div key={tmpl.id} className="card bg-base-100 shadow-md">
          <div className="card-body">
            <div className="flex justify-between items-center mb-3">
              <h3 className="card-title">{tmpl.school_class_name} - {tmpl.name}</h3>
              <div className="flex gap-2">
                {editingId === tmpl.id ? (
                  <>
                    <button className="btn btn-primary btn-sm" onClick={handleSave}>{t('common.save')}</button>
                    <button className="btn btn-ghost btn-sm" onClick={() => setEditingId(null)}>{t('common.cancel')}</button>
                  </>
                ) : (
                  <button className="btn btn-outline btn-sm" onClick={() => handleEdit(tmpl.id)}>{t('common.edit')}</button>
                )}
              </div>
            </div>

            {editingId === tmpl.id ? (
              <div>
                <table className="table table-sm">
                  <thead>
                    <tr>
                      <th>{t('results.componentType')}</th>
                      <th>{t('results.componentName')}</th>
                      <th className="w-24">{t('results.weight')} %</th>
                      <th className="w-20"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, i) => (
                      <tr key={i}>
                        <td>
                          <select className="select select-bordered select-sm" value={item.component_type} onChange={e => updateItem(i, 'component_type', e.target.value)}>
                            <option value="assignment">{t('results.assignment')}</option>
                            <option value="test">{t('results.test')}</option>
                            <option value="exam">{t('results.exam')}</option>
                          </select>
                        </td>
                        <td>
                          <input className="input input-bordered input-sm w-full" value={item.name} onChange={e => updateItem(i, 'name', e.target.value)} placeholder={t('results.componentNamePlaceholder')} />
                        </td>
                        <td>
                          <input className="input input-bordered input-sm w-full" type="number" min="0" max="100" value={item.weight} onChange={e => updateItem(i, 'weight', Number(e.target.value))} />
                        </td>
                        <td>
                          <button className="btn btn-ghost btn-xs text-error" onClick={() => removeItem(i)}>✕</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="flex justify-between items-center mt-3">
                  <button className="btn btn-outline btn-sm" onClick={addItem}>{t('results.addComponent')}</button>
                  <span className={`font-medium ${totalWeight !== 100 ? 'text-error' : 'text-success'}`}>
                    {t('results.totalWeight')}: {totalWeight}% {totalWeight !== 100 ? `(${t('results.mustBe100')})` : '✓'}
                  </span>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="table table-sm">
                  <thead>
                    <tr>
                      <th>{t('results.componentType')}</th>
                      <th>{t('results.componentName')}</th>
                      <th className="w-24">{t('results.weight')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tmpl.items?.map((item: any, i: number) => (
                      <tr key={i}>
                        <td><span className={`badge badge-sm ${item.component_type === 'assignment' ? 'badge-info' : item.component_type === 'test' ? 'badge-warning' : 'badge-error'}`}>{item.component_type}</span></td>
                        <td>{item.name}</td>
                        <td>{item.weight}%</td>
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

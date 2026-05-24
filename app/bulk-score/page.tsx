'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Sidebar from '@/components/Sidebar'

type Scorecard = { id: string; name: string; sections: { criteria: { id: string; question: string; isCritical: boolean }[] }[] }
type TranscriptItem = { id: string; name: string; content: string; status: 'pending' | 'scoring' | 'done' | 'error'; result?: any }

export default function BulkScorePage() {
  const [scorecards, setScorecards] = useState<Scorecard[]>([])
  const [scorecardId, setScorecardId] = useState('')
  const [transcripts, setTranscripts] = useState<TranscriptItem[]>([])
  const [scoring, setScoring] = useState(false)
  const [results, setResults] = useState<any[]>([])
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch('/api/scorecards').then(r => r.json())
      .then(data => { setScorecards(Array.isArray(data) ? data : []) })
  }, [])

  const handleFiles = (files: FileList | null) => {
    if (!files) return
    const newItems: TranscriptItem[] = []
    Array.from(files).forEach(file => {
      const reader = new FileReader()
      reader.onload = e => {
        newItems.push({ id: Math.random().toString(36).slice(2), name: file.name.replace('.txt', ''), content: e.target?.result as string, status: 'pending' })
        if (newItems.length === files.length) {
          setTranscripts(t => [...t, ...newItems])
        }
      }
      reader.readAsText(file)
    })
  }

  const removeTranscript = (id: string) => setTranscripts(t => t.filter(item => item.id !== id))

  const runBulkScore = async () => {
    if (!scorecardId || transcripts.length === 0) return
    const sc = scorecards.find(s => s.id === scorecardId)
    if (!sc) return
    const criteria = sc.sections.flatMap(s => s.criteria)
    setScoring(true)

    // Score one at a time to show progress
    const allResults: any[] = []
    for (const t of transcripts) {
      setTranscripts(prev => prev.map(item => item.id === t.id ? { ...item, status: 'scoring' } : item))
      try {
        const res = await fetch('/api/bulk-score', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ transcripts: [{ id: t.id, content: t.content, agentName: t.name }], scorecardId, criteria }),
        })
        const data = await res.json()
        const result = data[0]
        allResults.push({ ...result, transcriptName: t.name })
        setTranscripts(prev => prev.map(item => item.id === t.id ? { ...item, status: 'done', result } : item))
      } catch {
        setTranscripts(prev => prev.map(item => item.id === t.id ? { ...item, status: 'error' } : item))
      }
    }
    setResults(allResults)
    setScoring(false)
  }

  const exportCSV = () => {
    if (results.length === 0) return
    const rows = results.map(r => [r.transcriptName, r.totalScore + '%', r.passed ? 'Pass' : 'Fail'])
    const csv = [['Transcript', 'Score', 'Result'], ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'bulk-results.csv'; a.click()
  }

  const done = transcripts.filter(t => t.status === 'done').length
  const progress = transcripts.length > 0 ? Math.round((done / transcripts.length) * 100) : 0

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 px-8 py-7">
        <div className="page-header">
          <div>
            <h1 className="page-title">Bulk AI Scoring</h1>
            <p className="page-subtitle">Score multiple call transcripts at once</p>
          </div>
          {results.length > 0 && (
            <button onClick={exportCSV} className="btn-secondary text-xs">↓ Export Results CSV</button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-5">
            {/* Config */}
            <div className="card p-5">
              <h2 className="text-sm font-semibold text-slate-700 mb-4">Configuration</h2>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Scorecard *</label>
                <select value={scorecardId} onChange={e => setScorecardId(e.target.value)} className="input">
                  <option value="">Select scorecard...</option>
                  {scorecards.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
            </div>

            {/* Upload */}
            <div className="card p-5">
              <h2 className="text-sm font-semibold text-slate-700 mb-4">Upload Transcripts</h2>
              <div
                onClick={() => fileRef.current?.click()}
                onDrop={e => { e.preventDefault(); handleFiles(e.dataTransfer.files) }}
                onDragOver={e => e.preventDefault()}
                className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center cursor-pointer hover:border-blue-300 hover:bg-blue-50/30 transition-all">
                <svg className="w-8 h-8 text-slate-300 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="text-sm text-slate-500 font-medium">Drop .txt files here</p>
                <p className="text-xs text-slate-400 mt-1">or click to browse — multiple files supported</p>
              </div>
              <input ref={fileRef} type="file" accept=".txt" multiple onChange={e => handleFiles(e.target.files)} className="hidden" />

              {transcripts.length > 0 && (
                <div className="mt-4 space-y-2">
                  {transcripts.map(t => (
                    <div key={t.id} className="flex items-center gap-3 bg-slate-50 rounded-lg px-3 py-2">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        t.status === 'done' ? 'bg-emerald-500' :
                        t.status === 'scoring' ? 'bg-blue-500 animate-pulse' :
                        t.status === 'error' ? 'bg-red-500' : 'bg-slate-300'
                      }`} />
                      <p className="text-xs text-slate-700 flex-1 truncate">{t.name}</p>
                      {t.result && <span className="text-xs font-semibold text-slate-600">{t.result.totalScore}%</span>}
                      {t.status === 'pending' && (
                        <button onClick={() => removeTranscript(t.id)} className="text-slate-300 hover:text-red-400 text-sm">×</button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Run */}
            {transcripts.length > 0 && scorecardId && (
              <div className="space-y-3">
                {scoring && (
                  <div>
                    <div className="flex justify-between text-xs text-slate-500 mb-1">
                      <span>Scoring {done} of {transcripts.length} transcripts...</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                )}
                <button onClick={runBulkScore} disabled={scoring}
                  className="w-full btn-primary disabled:opacity-50">
                  {scoring ? `✦ Scoring... (${done}/${transcripts.length})` : `✦ Score ${transcripts.length} Transcript${transcripts.length > 1 ? 's' : ''} with AI`}
                </button>
              </div>
            )}
          </div>

          {/* Results */}
          <div>
            {results.length > 0 ? (
              <div className="card overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-700">Results ({results.length})</p>
                  <div className="flex gap-3 text-xs">
                    <span className="text-emerald-600 font-medium">{results.filter(r => r.passed).length} passed</span>
                    <span className="text-red-500 font-medium">{results.filter(r => !r.passed).length} failed</span>
                  </div>
                </div>
                <div className="divide-y divide-slate-50">
                  {results.map((r, i) => (
                    <div key={i} className="px-5 py-3.5 flex items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800 truncate">{r.transcriptName}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${r.totalScore}%`, background: r.totalScore >= 80 ? '#3b82f6' : '#ef4444' }} />
                        </div>
                        <span className="text-sm font-semibold text-slate-700 w-10">{r.totalScore}%</span>
                        <span className={r.passed ? 'badge-green' : 'badge-red'}>{r.passed ? 'Pass' : 'Fail'}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="px-5 py-4 bg-slate-50 border-t border-slate-100">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Average Score</span>
                    <span className="font-semibold text-slate-800">
                      {Math.round(results.reduce((a, r) => a + r.totalScore, 0) / results.length)}%
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="card p-10 text-center">
                <svg className="w-10 h-10 text-slate-200 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-slate-400 text-sm">Results will appear here after scoring</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

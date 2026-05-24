'use client'
import { useState, useEffect } from 'react'
import Sidebar from '@/components/Sidebar'

type Employee = { id: string; firstName: string; lastName: string; jobTitle: string | null; hireDate: string; status: string }

const DEFAULT_TASKS = [
  { title: 'Complete I-9 / employment verification', dueWithin: 1, assignedTo: 'HR' },
  { title: 'Sign employment contract', dueWithin: 1, assignedTo: 'HR' },
  { title: 'Set up workstation and system access', dueWithin: 1, assignedTo: 'IT' },
  { title: 'Complete benefits enrollment', dueWithin: 3, assignedTo: 'HR' },
  { title: 'Complete required compliance training', dueWithin: 5, assignedTo: 'Training' },
  { title: 'Meet with direct supervisor', dueWithin: 1, assignedTo: 'Manager' },
  { title: 'Shadow experienced agent (3 calls)', dueWithin: 3, assignedTo: 'Team Lead' },
  { title: 'Complete product/service knowledge test', dueWithin: 7, assignedTo: 'Training' },
  { title: 'First QA evaluation', dueWithin: 14, assignedTo: 'QA' },
  { title: '30-day performance check-in', dueWithin: 30, assignedTo: 'Manager' },
]

export default function OnboardingPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Employee | null>(null)
  const [tasks, setTasks] = useState(DEFAULT_TASKS.map((t, i) => ({ ...t, id: i.toString(), completed: false, completedDate: '' })))
  const [newTask, setNewTask] = useState({ title: '', dueWithin: '', assignedTo: '' })
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetch('/api/hr/employees').then(r => r.json())
      .then(data => {
        const recent = (Array.isArray(data) ? data : [])
          .filter((e: Employee) => e.status === 'ACTIVE')
          .sort((a: Employee, b: Employee) => new Date(b.hireDate).getTime() - new Date(a.hireDate).getTime())
        setEmployees(recent); setLoading(false)
      }).catch(() => setLoading(false))
  }, [])

  const toggleTask = (id: string) => {
    setTasks(t => t.map(task => task.id === id ? { ...task, completed: !task.completed, completedDate: !task.completed ? new Date().toLocaleDateString() : '' } : task))
  }

  const addTask = () => {
    if (!newTask.title) return
    setTasks(t => [...t, { ...newTask, id: Date.now().toString(), completed: false, completedDate: '', dueWithin: parseInt(newTask.dueWithin) || 7 }])
    setNewTask({ title: '', dueWithin: '', assignedTo: '' })
  }

  const completed = tasks.filter(t => t.completed).length
  const progress = Math.round((completed / tasks.length) * 100)
  const filtered = employees.filter(e => `${e.firstName} ${e.lastName}`.toLowerCase().includes(search.toLowerCase()))

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg)" }}>
      <Sidebar />
      <main className="app-main flex-1">
        <div className="page-header">
          <div>
            <h1 className="page-title">Onboarding</h1>
            <p className="page-subtitle">New hire checklists and task tracking</p>
          </div>
        </div>

        <div className={`grid gap-6 ${selected ? 'grid-cols-3' : 'grid-cols-1'}`}>
          <div className={selected ? 'col-span-1' : 'col-span-1'}>
            <div className="mb-3">
              <input placeholder="Search employees..." value={search} onChange={e => setSearch(e.target.value)} className="input w-full" />
            </div>
            <div className="card overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-100">
                <p className="text-sm font-semibold text-slate-700">Active Employees</p>
              </div>
              {loading ? <div className="py-8 text-center text-sm text-slate-400">Loading...</div> :
              filtered.length === 0 ? <div className="py-8 text-center text-sm text-slate-400">No employees found.</div> : (
                <div className="divide-y divide-slate-50">
                  {filtered.map(e => {
                    const daysSinceHire = Math.floor((Date.now() - new Date(e.hireDate).getTime()) / (1000 * 60 * 60 * 24))
                    const isNew = daysSinceHire <= 90
                    return (
                      <div key={e.id} onClick={() => setSelected(selected?.id === e.id ? null : e)}
                        className={`px-5 py-3.5 cursor-pointer transition-colors ${selected?.id === e.id ? 'bg-blue-50' : 'hover:bg-slate-50'}`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-slate-900">{e.firstName} {e.lastName}</p>
                            <p className="text-xs text-slate-400">{e.jobTitle || '—'} · Hired {daysSinceHire}d ago</p>
                          </div>
                          {isNew && <span className="badge-green">New Hire</span>}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {selected && (
            <div className="col-span-2 space-y-4">
              <div className="card p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-base font-semibold text-slate-900">{selected.firstName} {selected.lastName} — Onboarding</h2>
                    <p className="text-sm text-slate-400">Hired {new Date(selected.hireDate).toLocaleDateString()}</p>
                  </div>
                  <button onClick={() => setSelected(null)} className="text-slate-300 hover:text-slate-500 text-lg">×</button>
                </div>

                {/* Progress */}
                <div className="mb-5">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-slate-600 font-medium">{completed} of {tasks.length} tasks complete</span>
                    <span className="font-semibold text-slate-800">{progress}%</span>
                  </div>
                  <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
                  </div>
                </div>

                {/* Tasks */}
                <div className="space-y-2 mb-4">
                  {tasks.map(task => (
                    <div key={task.id} onClick={() => toggleTask(task.id)}
                      className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors ${task.completed ? 'bg-emerald-50 border border-emerald-100' : 'bg-slate-50 hover:bg-slate-100 border border-slate-100'}`}>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${task.completed ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300'}`}>
                        {task.completed && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                      </div>
                      <div className="flex-1">
                        <p className={`text-sm font-medium ${task.completed ? 'text-emerald-700 line-through' : 'text-slate-800'}`}>{task.title}</p>
                        <div className="flex gap-3 mt-0.5">
                          <span className="text-xs text-slate-400">Due within {task.dueWithin}d</span>
                          {task.assignedTo && <span className="text-xs text-slate-400">→ {task.assignedTo}</span>}
                          {task.completedDate && <span className="text-xs text-emerald-500">✓ {task.completedDate}</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add task */}
                <div className="border-t border-slate-100 pt-4">
                  <p className="text-xs font-medium text-slate-500 mb-2">Add Custom Task</p>
                  <div className="flex gap-2">
                    <input value={newTask.title} onChange={e => setNewTask({ ...newTask, title: e.target.value })} placeholder="Task title" className="input flex-1 text-xs" />
                    <input value={newTask.dueWithin} onChange={e => setNewTask({ ...newTask, dueWithin: e.target.value })} placeholder="Days" type="number" className="input w-16 text-xs" />
                    <input value={newTask.assignedTo} onChange={e => setNewTask({ ...newTask, assignedTo: e.target.value })} placeholder="Owner" className="input w-24 text-xs" />
                    <button onClick={addTask} className="btn-primary text-xs px-3">Add</button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

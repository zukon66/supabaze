'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { Session } from '@supabase/supabase-js';
import TaskComments from '@/app/components/TaskComments';

type Task = {
    id: string;
    title: string;
    status: 'todo' | 'in_progress' | 'done';
    project_id: string;
};

type Project = {
    id: string;
    name: string;
};

export default function ProjectPage() {
    const router = useRouter();
    const params = useParams();
    const groupId = typeof params?.groupId === 'string' ? params.groupId : null;
    const projectId = typeof params?.projectId === 'string' ? params.projectId : null;

    const [session, setSession] = useState<Session | null>(null);
    const [project, setProject] = useState<Project | null>(null);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [addingTask, setAddingTask] = useState(false);
    const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);

    const fetchProjectAndTasks = useCallback(async () => {
        if (!projectId) return;
        setLoading(true);

        // Fetch Project
        const { data: projectData } = await supabase
            .from('projects')
            .select('id, name')
            .eq('id', projectId)
            .single();

        if (projectData) {
            setProject(projectData);
        }

        // Fetch Tasks
        const { data: tasksData } = await supabase
            .from('tasks')
            .select('*')
            .eq('project_id', projectId)
            .order('created_at', { ascending: false });

        if (tasksData) {
            setTasks(tasksData as Task[]);
        }

        setLoading(false);
    }, [projectId]);

    useEffect(() => {
        const getSession = async () => {
            const { data } = await supabase.auth.getSession();
            setSession(data.session);
        };
        getSession();
        fetchProjectAndTasks();
    }, [fetchProjectAndTasks]);

    const handleAddTask = async (e: FormEvent) => {
        e.preventDefault();
        if (!newTaskTitle.trim() || !session || !projectId) return;

        setAddingTask(true);
        const { data, error } = await supabase
            .from('tasks')
            .insert({
                title: newTaskTitle.trim(),
                project_id: projectId,
                status: 'todo',
                created_by: session.user.id,
            })
            .select()
            .single();

        if (error) {
            alert('Error adding task: ' + error.message);
        } else if (data) {
            setTasks((prev) => [data as Task, ...prev]);
            setNewTaskTitle('');
        }
        setAddingTask(false);
    };

    const updateStatus = async (taskId: string, newStatus: Task['status']) => {
        // Optimistic update
        setTasks((prev) =>
            prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
        );

        const { error } = await supabase
            .from('tasks')
            .update({ status: newStatus })
            .eq('id', taskId);

        if (error) {
            alert('Error updating status');
            fetchProjectAndTasks(); // Revert on error
        }
    };

    const deleteTask = async (taskId: string) => {
        if (!window.confirm('Delete this task?')) return;

        setTasks((prev) => prev.filter((t) => t.id !== taskId));

        const { error } = await supabase
            .from('tasks')
            .delete()
            .eq('id', taskId);

        if (error) {
            alert('Error deleting task');
            fetchProjectAndTasks(); // Revert on error
        }
    };

    const toggleComments = (taskId: string) => {
        setExpandedTaskId(prev => prev === taskId ? null : taskId);
    };

    if (loading && !project) {
        return <div className="p-10 text-center">Loading project...</div>;
    }

    if (!project) {
        return <div className="p-10 text-center text-rose-600">Project not found</div>;
    }

    return (
        <div className="min-h-screen bg-dark px-4 py-10">
            <div className="mx-auto w-full max-w-4xl">
                <div className="mb-6 flex items-center gap-2">
                    <Link
                        href={`/app/groups/${groupId}`}
                        className="text-sm font-medium text-slate-400 hover:text-white transition"
                    >
                        ← Gruba dön
                    </Link>
                </div>

                <header className="mb-8 rounded-2xl bg-surface p-6 shadow-lg border border-white/5">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-secondary">Proje Detayı</p>
                            <h1 className="mt-1 text-2xl font-bold text-white">{project.name}</h1>
                        </div>
                        <span className="text-xs font-mono text-slate-500 bg-dark/50 px-2 py-1 rounded">
                            ID: {project.id.slice(0, 8)}
                        </span>
                    </div>
                </header>

                <section className="rounded-2xl bg-surface p-6 shadow-lg border border-white/5">
                    <h2 className="mb-4 text-lg font-bold text-white">Görevler</h2>
                    <form onSubmit={handleAddTask} className="mb-6 flex gap-3">
                        <input
                            type="text"
                            value={newTaskTitle}
                            onChange={(e) => setNewTaskTitle(e.target.value)}
                            placeholder="Yeni görev ekle..."
                            className="flex-1 rounded-xl border border-slate-700 bg-dark/50 px-4 py-3 text-sm text-white shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-slate-600"
                            required
                        />
                        <button
                            type="submit"
                            disabled={addingTask}
                            className="rounded-xl bg-gradient-to-r from-primary to-blue-600 px-6 py-2 text-sm font-bold text-white shadow-lg shadow-blue-900/20 hover:bg-blue-500 hover:shadow-blue-900/40 disabled:opacity-50 transition"
                        >
                            {addingTask ? 'Ekleniyor...' : 'Ekle'}
                        </button>
                    </form>

                    <div className="space-y-3">
                        {tasks.length === 0 ? (
                            <div className="py-8 text-center border border-dashed border-slate-700 rounded-xl">
                                <p className="text-sm text-slate-500">Henüz görev yok.</p>
                            </div>
                        ) : (
                            tasks.map((task) => (
                                <div
                                    key={task.id}
                                    className="rounded-xl border border-slate-700 bg-dark/30 px-4 py-4 transition hover:bg-dark/50 hover:border-slate-600"
                                >
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                        <div className="flex items-start gap-3 flex-1">
                                            <div className={`mt-1.5 h-3 w-3 shrink-0 rounded-full shadow-sm ${task.status === 'done' ? 'bg-emerald-500 shadow-emerald-900/20' :
                                                task.status === 'in_progress' ? 'bg-blue-500 shadow-blue-900/20' : 'bg-slate-500'
                                                }`} />
                                            <span className={`text-sm font-medium leading-relaxed ${task.status === 'done' ? 'text-slate-500 line-through' : 'text-slate-200'}`}>
                                                {task.title}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-3 self-end sm:self-auto">
                                            <button
                                                onClick={() => toggleComments(task.id)}
                                                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition flex items-center gap-1.5 ${expandedTaskId === task.id
                                                    ? 'bg-secondary/20 text-secondary ring-1 ring-secondary/50'
                                                    : 'bg-dark/50 text-slate-400 hover:text-white hover:bg-slate-700'
                                                    }`}
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                                                {expandedTaskId === task.id ? 'Gizle' : 'Yorumlar'}
                                            </button>

                                            <select
                                                value={task.status}
                                                onChange={(e) => updateStatus(task.id, e.target.value as Task['status'])}
                                                className={`rounded-lg border border-slate-700 bg-dark/50 px-2 py-1.5 text-xs font-medium outline-none transition focus:border-slate-500 ${task.status === 'done' ? 'text-emerald-500' :
                                                    task.status === 'in_progress' ? 'text-blue-500' : 'text-slate-400'
                                                    }`}
                                            >
                                                <option value="todo">Yapılacak</option>
                                                <option value="in_progress">Sürüyor</option>
                                                <option value="done">Tamamlandı</option>
                                            </select>

                                            <button
                                                onClick={() => deleteTask(task.id)}
                                                className="p-1.5 text-slate-500 hover:text-rose-500 transition rounded-lg hover:bg-rose-950/30"
                                                title="Görevi Sil"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M3 6h18"></path>
                                                    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                                                    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                                                </svg>
                                            </button>
                                        </div>
                                    </div>

                                    {expandedTaskId === task.id && (
                                        <div className="mt-4 border-t border-slate-700/50 pt-4 pl-0 sm:pl-6">
                                            <TaskComments taskId={task.id} session={session} />
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
}

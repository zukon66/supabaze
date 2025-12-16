'use client';

import { FormEvent, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { Session } from '@supabase/supabase-js';

type Comment = {
    id: string;
    content: string;
    created_at: string;
    user_id: string;
    profiles: {
        username: string;
        full_name: string;
    } | null;
};

type TaskCommentsProps = {
    taskId: string;
    session: Session | null;
};

export default function TaskComments({ taskId, session }: TaskCommentsProps) {
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [loading, setLoading] = useState(true);
    const [adding, setAdding] = useState(false);

    useEffect(() => {
        fetchComments();
    }, [taskId]);

    const fetchComments = async () => {
        console.log('Fetching comments for taskId:', taskId);
        const { data, error } = await supabase
            .from('comments')
            .select('*, profiles(username, full_name)')
            .eq('task_id', taskId)
            .order('created_at', { ascending: true });

        if (error) {
            console.error('Error fetching comments:', error);
        } else {
            console.log('Comments fetched:', data);
            // Cast data because Typescript might complain about the joined shape
            setComments(data as any as Comment[]);
        }
        setLoading(false);
    };

    const handleAddComment = async (e: FormEvent) => {
        e.preventDefault();
        if (!newComment.trim() || !session) return;

        setAdding(true);
        const { error } = await supabase.from('comments').insert({
            content: newComment.trim(),
            task_id: taskId,
            user_id: session.user.id,
        });

        if (error) {
            alert('Error adding comment: ' + error.message);
        } else {
            setNewComment('');
            fetchComments(); // Refresh list to get the new comment with profile data
        }
        setAdding(false);
    };

    const handleDeleteComment = async (commentId: string) => {
        if (!confirm('Delete comment?')) return;

        // Optimistic remove
        setComments(prev => prev.filter(c => c.id !== commentId));

        const { error } = await supabase
            .from('comments')
            .delete()
            .eq('id', commentId);

        if (error) {
            alert('Could not delete comment');
            fetchComments();
        }
    }

    if (loading) return <div className="text-xs text-slate-500">Yorumlar yükleniyor...</div>;

    return (
        <div className="mt-4 rounded-xl bg-dark/30 p-4 border border-slate-700/50">
            <h3 className="mb-4 text-sm font-bold text-slate-300">Yorumlar ({comments.length})</h3>

            <div className="mb-4 space-y-4 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                {comments.map((comment) => {
                    const isMine = session?.user.id === comment.user_id;
                    return (
                        <div key={comment.id} className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                            <div className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm shadow-sm ${isMine
                                ? 'bg-primary text-white rounded-br-none'
                                : 'bg-surface text-slate-200 border border-slate-700 rounded-bl-none'
                                }`}>
                                <p>{comment.content}</p>
                            </div>
                            <div className="mt-1.5 flex items-center gap-2 px-1">
                                <span className="text-[10px] text-slate-500 font-medium">
                                    {comment.profiles?.full_name || comment.profiles?.username || 'Bilinmeyen'} • {new Date(comment.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                                {isMine && (
                                    <button onClick={() => handleDeleteComment(comment.id)} className="text-[10px] text-rose-500 hover:text-rose-400 hover:underline transition">
                                        Sil
                                    </button>
                                )}
                            </div>
                        </div>
                    )
                })}
                {comments.length === 0 && <p className="text-xs text-slate-500 italic text-center py-2">Henüz yorum yok. İlk yorumu sen yaz!</p>}
            </div>

            <form onSubmit={handleAddComment} className="flex gap-2">
                <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Yorum yap..."
                    className="flex-1 rounded-xl border border-slate-700 bg-black/20 px-4 py-2.5 text-sm text-white outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 placeholder:text-slate-600 transition"
                />
                <button
                    type="submit"
                    disabled={adding || !newComment.trim()}
                    className="rounded-xl bg-slate-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-slate-600 disabled:opacity-50 transition shadow-lg shadow-black/20"
                >
                    Gönder
                </button>
            </form>
        </div>
    );
}

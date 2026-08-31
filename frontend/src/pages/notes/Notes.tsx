import { useEffect, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Bold, Italic, List, ListOrdered, Quote, Download, Trash2, Plus } from 'lucide-react';
import { api } from '../../lib/api';
import type { PrivateNote } from '../../lib/types';
import { GlassCard } from '../../components/ui/GlassCard';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { LoadingState } from '../../components/shared/LoadingState';
import { ErrorState } from '../../components/shared/ErrorState';
import { EmptyState } from '../../components/shared/EmptyState';

const EMPTY_DOC = { type: 'doc', content: [{ type: 'paragraph' }] };

export default function Notes() {
  const [notes, setNotes] = useState<PrivateNote[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | 'new' | null>(null);
  const [title, setTitle] = useState('');
  const [saving, setSaving] = useState(false);
  const [exportingId, setExportingId] = useState<string | null>(null);

  const editor = useEditor({
    extensions: [StarterKit],
    content: EMPTY_DOC,
  });

  async function loadNotes() {
    setError(null);
    try {
      const { data } = await api.get<PrivateNote[]>('/notes');
      setNotes(data);
    } catch {
      setError('Could not load your notes.');
    }
  }

  useEffect(() => {
    loadNotes();
  }, []);

  function selectNote(note: PrivateNote) {
    setSelectedId(note.id);
    setTitle(note.title ?? '');
    editor?.commands.setContent(note.content_json);
  }

  function startNewNote() {
    setSelectedId('new');
    setTitle('');
    editor?.commands.setContent(EMPTY_DOC);
  }

  async function handleSave() {
    if (!editor) return;
    setSaving(true);
    try {
      const payload = {
        title: title || undefined,
        content_json: editor.getJSON(),
        content_html: editor.getHTML(),
      };
      if (selectedId === 'new' || selectedId === null) {
        const { data } = await api.post<PrivateNote>('/notes', payload);
        setSelectedId(data.id);
      } else {
        await api.patch(`/notes/${selectedId}`, payload);
      }
      await loadNotes();
    } catch {
      setError('Could not save this note.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await api.delete(`/notes/${id}`);
      if (selectedId === id) startNewNote();
      await loadNotes();
    } catch {
      setError('Could not delete this note.');
    }
  }

  async function handleExport(id: string, noteTitle: string | null) {
    setExportingId(id);
    try {
      const res = await api.get(`/notes/${id}/export.pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = `${(noteTitle || 'note').replace(/[^a-z0-9-_ ]/gi, '')}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      setError('Could not export this note.');
    } finally {
      setExportingId(null);
    }
  }

  if (error && notes === null) {
    return <ErrorState message={error} onRetry={loadNotes} />;
  }
  if (notes === null) {
    return <LoadingState message="Loading your notes…" />;
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-[280px_1fr]">
      <GlassCard className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-ink-900">Private notes</h2>
          <button
            onClick={startNewNote}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-sage-100 text-sage-700 hover:bg-sage-200"
            aria-label="New note"
          >
            <Plus size={16} />
          </button>
        </div>

        {notes.length === 0 && (
          <p className="px-1 py-6 text-center text-sm text-ink-400">No notes yet — create your first one.</p>
        )}

        <ul className="space-y-1">
          {notes.map((note) => (
            <li key={note.id}>
              <button
                onClick={() => selectNote(note)}
                className={`w-full rounded-xl px-3 py-2 text-left text-sm transition-colors ${
                  selectedId === note.id ? 'bg-sage-100 text-sage-800' : 'text-ink-700 hover:bg-sand-100'
                }`}
              >
                <div className="truncate font-medium">{note.title || 'Untitled note'}</div>
                <div className="text-xs text-ink-400">
                  {new Date(note.updated_at).toLocaleDateString()}
                </div>
              </button>
            </li>
          ))}
        </ul>
      </GlassCard>

      <GlassCard className="p-6">
        {selectedId === null && notes.length > 0 ? (
          <EmptyState title="Select a note" message="Choose a note from the list, or create a new one." />
        ) : (
          <>
            <div className="mb-4 flex items-center gap-3">
              <Input
                label=""
                placeholder="Untitled note"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="text-lg font-semibold"
              />
            </div>

            {editor && (
              <div className="mb-3 flex flex-wrap items-center gap-1 rounded-xl border border-sand-200 bg-sand-50 p-1.5">
                <ToolbarButton active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}>
                  <Bold size={15} />
                </ToolbarButton>
                <ToolbarButton active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}>
                  <Italic size={15} />
                </ToolbarButton>
                <ToolbarButton active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()}>
                  <List size={15} />
                </ToolbarButton>
                <ToolbarButton active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
                  <ListOrdered size={15} />
                </ToolbarButton>
                <ToolbarButton active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
                  <Quote size={15} />
                </ToolbarButton>
              </div>
            )}

            <div
              className="min-h-[300px] rounded-xl border border-sand-200 bg-white px-4 py-3 text-sm text-ink-800
                         [&_.ProseMirror]:min-h-[280px] [&_.ProseMirror]:outline-none
                         [&_p]:mb-3 [&_ul]:mb-3 [&_ul]:list-disc [&_ul]:pl-5
                         [&_ol]:mb-3 [&_ol]:list-decimal [&_ol]:pl-5
                         [&_blockquote]:border-l-2 [&_blockquote]:border-sage-300 [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:text-ink-500"
            >
              <EditorContent editor={editor} />
            </div>

            {error && (
              <div className="mt-3 rounded-xl bg-clay-50 px-4 py-3 text-sm text-clay-700">{error}</div>
            )}

            <div className="mt-4 flex items-center gap-2">
              <Button onClick={handleSave} loading={saving}>
                Save
              </Button>
              {selectedId && selectedId !== 'new' && (
                <>
                  <Button
                    variant="secondary"
                    onClick={() => handleExport(selectedId, title)}
                    loading={exportingId === selectedId}
                  >
                    <Download size={15} /> Export PDF
                  </Button>
                  <Button variant="ghost" onClick={() => handleDelete(selectedId)}>
                    <Trash2 size={15} /> Delete
                  </Button>
                </>
              )}
            </div>
          </>
        )}
      </GlassCard>
    </div>
  );
}

function ToolbarButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
        active ? 'bg-sage-500 text-white' : 'text-ink-600 hover:bg-sand-200'
      }`}
    >
      {children}
    </button>
  );
}

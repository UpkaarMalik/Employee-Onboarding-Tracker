import { useEffect, useState } from 'react';
import { Plus, Save } from 'lucide-react';
import { api } from '../../lib/api';
import { GlassCard } from '../../components/ui/GlassCard';
import { Button } from '../../components/ui/Button';
import { TaskEditorRow, type EditableTask } from '../../components/admin/TaskEditorRow';
import { LoadingState } from '../../components/shared/LoadingState';

interface Department {
  id: string;
  name: string;
}

interface TemplateSummary {
  id: string;
  department_id: string;
  name: string;
  version: number;
  is_active: boolean;
}

function emptyTask(): EditableTask {
  return {
    key: crypto.randomUUID(),
    title: '',
    description: '',
    task_type: 'ACTION',
    owner_type: 'EMPLOYEE',
    is_required: true,
    depends_on_key: null,
  };
}

export default function TemplateBuilder() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [departmentId, setDepartmentId] = useState('');
  const [templateName, setTemplateName] = useState('');
  const [tasks, setTasks] = useState<EditableTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await api.get<Department[]>('/departments');
      setDepartments(data);
      setLoading(false);
    })();
  }, []);

  async function loadActiveTemplate(deptId: string) {
    setDepartmentId(deptId);
    setSaved(false);
    setSaveError(null);
    setLoading(true);
    try {
      const { data: allTemplates } = await api.get<TemplateSummary[]>('/templates');
      const active = allTemplates.find((t) => t.department_id === deptId && t.is_active);

      if (!active) {
        setTemplateName('');
        setTasks([emptyTask()]);
        return;
      }

      const { data: full } = await api.get(`/templates/${active.id}`);
      setTemplateName(full.name);

      // template_tasks use depends_on_order_index; map that to our local key-based wiring.
      const keyByOrderIndex = new Map<number, string>();
      const editable: EditableTask[] = full.tasks.map((t: any) => {
        const key = crypto.randomUUID();
        keyByOrderIndex.set(t.order_index, key);
        return {
          key,
          title: t.title,
          description: t.description ?? '',
          task_type: t.task_type,
          owner_type: t.owner_type,
          is_required: t.is_required,
          depends_on_key: null, // resolved below, once every key exists
          _depends_on_order_index: t.depends_on_order_index, // temp field, stripped after resolution
        } as EditableTask & { _depends_on_order_index: number | null };
      });
      editable.forEach((t: any) => {
        t.depends_on_key = t._depends_on_order_index ? keyByOrderIndex.get(t._depends_on_order_index) ?? null : null;
        delete t._depends_on_order_index;
      });
      setTasks(editable);
    } finally {
      setLoading(false);
    }
  }

  function updateTask(index: number, next: EditableTask) {
    setTasks((prev) => prev.map((t, i) => (i === index ? next : t)));
  }

  function removeTask(index: number) {
    const removedKey = tasks[index].key;
    setTasks((prev) =>
      prev
        .filter((_, i) => i !== index)
        .map((t) => (t.depends_on_key === removedKey ? { ...t, depends_on_key: null } : t)),
    );
  }

  async function handleSave() {
    setSaving(true);
    setSaveError(null);
    setSaved(false);
    try {
      const keyToOrderIndex = new Map(tasks.map((t, i) => [t.key, i + 1]));
      const payload = {
        department_id: departmentId,
        name: templateName,
        tasks: tasks.map((t, i) => ({
          title: t.title,
          description: t.description || undefined,
          task_type: t.task_type,
          order_index: i + 1,
          owner_type: t.owner_type,
          is_required: t.is_required,
          depends_on_order_index: t.depends_on_key ? keyToOrderIndex.get(t.depends_on_key) : undefined,
        })),
      };
      // Creating a new POST with the same department_id auto-versions and
      // deactivates the prior version — this *is* the edit flow (see
      // TemplatesService.create()); there's no separate PATCH endpoint yet.
      await api.post('/templates', payload);
      setSaved(true);
    } catch (err: any) {
      setSaveError(err.response?.data?.message || 'Could not save template.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-sand-50 px-4 py-10">
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-6 text-2xl font-bold text-ink-900">Onboarding template builder</h1>

        <GlassCard className="mb-6 p-6">
          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-ink-700">Department</span>
              <select
                className="w-full rounded-xl border border-sand-300 bg-white/80 px-4 py-3 text-sm text-ink-900 outline-none focus:ring-2 focus:ring-sage-300"
                value={departmentId}
                onChange={(e) => loadActiveTemplate(e.target.value)}
              >
                <option value="">Select department…</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-ink-700">Template name</span>
              <input
                className="w-full rounded-xl border border-sand-300 bg-white/80 px-4 py-3 text-sm text-ink-900 outline-none focus:ring-2 focus:ring-sage-300"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
              />
            </label>
          </div>
        </GlassCard>

        {loading ? (
          <LoadingState />
        ) : departmentId ? (
          <>
            <div className="space-y-3">
              {tasks.map((task, i) => (
                <TaskEditorRow
                  key={task.key}
                  task={task}
                  index={i}
                  allTasks={tasks}
                  onChange={(next) => updateTask(i, next)}
                  onRemove={() => removeTask(i)}
                />
              ))}
            </div>

            <div className="mt-4 flex items-center justify-between">
              <Button variant="secondary" onClick={() => setTasks((prev) => [...prev, emptyTask()])}>
                <Plus className="h-4 w-4" /> Add task
              </Button>

              <div className="flex items-center gap-3">
                {saveError && <span className="text-xs text-clay-600">{saveError}</span>}
                {saved && <span className="text-xs text-sage-600">Saved as new version ✓</span>}
                <Button loading={saving} onClick={handleSave}>
                  <Save className="h-4 w-4" /> Save template
                </Button>
              </div>
            </div>
          </>
        ) : (
          <p className="text-sm text-ink-500">Select a department to build or edit its onboarding template.</p>
        )}
      </div>
    </div>
  );
}
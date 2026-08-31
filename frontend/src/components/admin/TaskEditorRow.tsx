import { Trash2, GripVertical } from 'lucide-react';
import { Input } from '../ui/Input';

export interface EditableTask {
  key: string; // local-only id for React keys / dependency wiring, not sent to the API
  title: string;
  description: string;
  task_type: 'ACTION' | 'READING';
  owner_type: 'EMPLOYEE' | 'HR' | 'DEPARTMENT_ADMIN';
  is_required: boolean;
  depends_on_key: string | null;
}

interface Props {
  task: EditableTask;
  index: number;
  allTasks: EditableTask[];
  onChange: (next: EditableTask) => void;
  onRemove: () => void;
}

export function TaskEditorRow({ task, index, allTasks, onChange, onRemove }: Props) {
  const dependencyOptions = allTasks.filter((t) => t.key !== task.key);

  return (
    <div className="flex items-start gap-3 rounded-2xl border border-sand-200 bg-white/60 p-4">
      <GripVertical className="mt-3 h-4 w-4 shrink-0 cursor-grab text-ink-300" />
      <span className="mt-3 w-5 shrink-0 text-xs font-semibold text-ink-400">{index + 1}</span>

      <div className="grid flex-1 grid-cols-2 gap-3">
        <Input
          label="Title"
          value={task.title}
          onChange={(e) => onChange({ ...task, title: e.target.value })}
        />
        <Input
          label="Description (optional)"
          value={task.description}
          onChange={(e) => onChange({ ...task, description: e.target.value })}
        />

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-ink-700">Type</span>
          <select
            className="w-full rounded-xl border border-sand-300 bg-white/80 px-4 py-3 text-sm text-ink-900 outline-none focus:ring-2 focus:ring-sage-300"
            value={task.task_type}
            onChange={(e) => onChange({ ...task, task_type: e.target.value as EditableTask['task_type'] })}
          >
            <option value="ACTION">Action</option>
            <option value="READING">Reading</option>
          </select>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-ink-700">Owner</span>
          <select
            className="w-full rounded-xl border border-sand-300 bg-white/80 px-4 py-3 text-sm text-ink-900 outline-none focus:ring-2 focus:ring-sage-300"
            value={task.owner_type}
            onChange={(e) => onChange({ ...task, owner_type: e.target.value as EditableTask['owner_type'] })}
          >
            <option value="EMPLOYEE">Employee</option>
            <option value="HR">HR</option>
            <option value="DEPARTMENT_ADMIN">Department Admin</option>
          </select>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-ink-700">Depends on</span>
          <select
            className="w-full rounded-xl border border-sand-300 bg-white/80 px-4 py-3 text-sm text-ink-900 outline-none focus:ring-2 focus:ring-sage-300"
            value={task.depends_on_key ?? ''}
            onChange={(e) => onChange({ ...task, depends_on_key: e.target.value || null })}
          >
            <option value="">None</option>
            {dependencyOptions.map((t) => (
              <option key={t.key} value={t.key}>{t.title || '(untitled)'}</option>
            ))}
          </select>
        </label>

        <label className="flex items-center gap-2 self-end pb-3">
          <input
            type="checkbox"
            checked={task.is_required}
            onChange={(e) => onChange({ ...task, is_required: e.target.checked })}
            className="h-4 w-4 rounded border-sand-300 text-sage-600 focus:ring-sage-300"
          />
          <span className="text-sm text-ink-700">Required</span>
        </label>
      </div>

      <button onClick={onRemove} className="mt-3 shrink-0 text-ink-300 hover:text-clay-600" aria-label="Remove task">
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}
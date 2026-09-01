import { useState } from 'react';
import { ArrowRight, BookOpen, Mail, X } from 'lucide-react';
import type { ChecklistTask } from '../../lib/types';
import { GlassCard } from '../ui/GlassCard';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { TaskStatusIcon } from './TaskStatusIcon';

const STATUS_LABEL: Record<string, string> = {
  WAITING: 'Waiting',
  AVAILABLE: 'Ready to start',
  IN_PROGRESS: 'In progress',
  COMPLETED: 'Completed',
};

interface Props {
  task: ChecklistTask;
  actionable: boolean;
  busy: boolean;
  onClose: () => void;
  onStart: () => void;
  onComplete: (officialEmail?: string) => void;
  onCompleteProfile: (mobile: string, dob: string, address: string) => void;
  onRead: () => void;
}

export function TaskDetailModal({ task, actionable, busy, onClose, onStart, onComplete, onCompleteProfile, onRead }: Props) {
  const [officialEmail, setOfficialEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [dob, setDob] = useState('');
  const [address, setAddress] = useState('');
  const isDone = task.effective_status === 'COMPLETED';
  const isWaiting = task.effective_status === 'WAITING';
  const needsEmail = task.title === 'Company Email ID Issuance';
  const needsProfileDetails = task.title === 'Complete Personal Details';

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-navy-950/40 px-4 backdrop-blur-sm animate-fade-slide-up"
      onClick={onClose}
    >
      <GlassCard
        className="w-full max-w-md animate-reveal-scale bg-white p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <TaskStatusIcon status={task.effective_status} />
            <h2 className="text-base font-semibold text-ink-900">{task.title}</h2>
          </div>
          <button onClick={onClose} className="text-ink-300 hover:text-ink-600" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <span className="rounded-full bg-sand-100 px-2.5 py-1 text-[11px] font-medium text-ink-500">
            {STATUS_LABEL[task.effective_status]}
          </span>
          {task.is_required && (
            <span className="rounded-full bg-lavender-100 px-2.5 py-1 text-[11px] font-medium text-lavender-700">Required</span>
          )}
          <span className="rounded-full bg-sky-100 px-2.5 py-1 text-[11px] font-medium text-sky-700">
            {task.owner_type.replace('_', ' ')}
          </span>
        </div>

        <p className="mt-4 text-sm text-ink-600">
          {task.description || 'No additional details for this task.'}
        </p>

        {isWaiting && (
          <p className="mt-4 rounded-xl bg-sand-50 px-4 py-3 text-xs text-ink-500">
            This task unlocks once its dependency is completed.
          </p>
        )}

        {needsEmail && actionable && task.effective_status === 'IN_PROGRESS' && (
          <div className="mt-4">
            <Input
              label="Official email address"
              placeholder="employee@company.com"
              value={officialEmail}
              onChange={(e) => setOfficialEmail(e.target.value)}
            />
          </div>
        )}

        {needsProfileDetails && actionable && task.effective_status === 'IN_PROGRESS' && (
          <div className="mt-4 space-y-3">
            <Input
              label="Mobile number"
              placeholder="+91 90000 00000"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
            />
            <Input
              label="Date of birth"
              type="date"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
            />
            <Input
              label="Address"
              placeholder="Your current address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>
        )}

        <div className="mt-6 flex items-center justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>

          {task.task_type === 'READING' && !isDone && actionable && (
            <Button variant="secondary" onClick={onRead}>
              <BookOpen size={14} /> Read
            </Button>
          )}

          {actionable && task.effective_status === 'AVAILABLE' && (
            <Button variant="secondary" loading={busy} onClick={onStart}>
              Start
            </Button>
          )}

          {actionable && task.effective_status === 'IN_PROGRESS' && needsProfileDetails && (
            <Button
              variant="accent"
              loading={busy}
              disabled={!mobile || !dob || !address}
              onClick={() => onCompleteProfile(mobile, dob, address)}
            >
              Save &amp; Complete <ArrowRight size={14} />
            </Button>
          )}

          {actionable && task.effective_status === 'IN_PROGRESS' && !needsProfileDetails && (
            <Button
              variant="accent"
              loading={busy}
              disabled={needsEmail && !officialEmail}
              onClick={() => onComplete(needsEmail ? officialEmail : undefined)}
            >
              {needsEmail ? <><Mail size={14} /> Confirm</> : <>Mark as Completed <ArrowRight size={14} /></>}
            </Button>
          )}
        </div>
      </GlassCard>
    </div>
  );
}

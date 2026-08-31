import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { api } from '../../lib/api';
import type { OnboardingInstance } from '../../lib/types';
import { Button } from '../../components/ui/Button';
import { LoadingState } from '../../components/shared/LoadingState';
import { ErrorState } from '../../components/shared/ErrorState';
import { ReadingViewer } from '../../components/reading/ReadingViewer';

export default function ReadingTask() {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const [instance, setInstance] = useState<OnboardingInstance | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setError(null);
    try {
      const { data } = await api.get<OnboardingInstance>('/onboarding/instances/me');
      setInstance(data);
    } catch {
      setError('Could not load this reading task.');
    }
  }

  useEffect(() => {
    load();
  }, []);

  if (error) {
    return <ErrorState message={error} onRetry={load} />;
  }
  if (instance === null) {
    return <LoadingState message="Loading…" />;
  }

  const task = instance.tasks.find((t) => t.id === taskId);
  if (!task) {
    return <ErrorState title="Task not found" message="This reading task could not be found." />;
  }

  return (
    <div className="space-y-4">
      <Button variant="ghost" className="px-3 py-2 text-xs" onClick={() => navigate('/checklist')}>
        <ArrowLeft size={14} /> Back to checklist
      </Button>
      <ReadingViewer
        taskId={task.id}
        title={task.title}
        content={task.description || 'No content has been attached to this reading task yet.'}
      />
    </div>
  );
}

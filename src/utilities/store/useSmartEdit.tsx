// src/utilities/store/useSmartEdit.ts
import type { Project } from '@store/useStudioStore';
import { useStudioStore } from '@store/useStudioStore';
import { useState, useCallback } from 'react';
import { client } from '@api/index';
import { useEditorUiStore } from '@store/useEditorUiStore';

type Args = {
  project?: Project;
};

const MASK = "http://localhost:5051/media";
const MASK2 = "http://localhost:5858/media";
const ACTUAL = `${process.env.EXPO_PUBLIC_DEV_API_BASE_URL}/api/v1/openstudio/media`;
export const unmaskUrl = (url: string) => url.replace(MASK, ACTUAL).replace(MASK2, ACTUAL).replace("%2F", '/');

export function useSmartEdit({ project }: Args) {
  const [isSmartEditing, setIsSmartEditing] = useState(false);
  const [smartPreviewUrl, setSmartPreviewUrl] = useState<string | null>(null);

  const setBusyReason = useEditorUiStore((s) => s.setBusyReason);
  const updateProject = useStudioStore((s) => s.updateProject);

  const runSmartEdit = useCallback(async () => {
    if (!project) return;

    setIsSmartEditing(true);
    setBusyReason('smart-edit'); // Global "loading" UI
    try {
      const res = await client.post('/api/v1/openstudio/ai/smart-edit', {
        project,
      });

      const data = {
        ...res.data,
        previewUrl: unmaskUrl(res.data.previewUrl)
       } as {
        project: Project;
        previewUrl?: string;
        meta?: { appliedEffects?: string[]; notes?: string };
      };

      console.log("Smart Edit Data: ", data, data.project.overlays, JSON.stringify(data, null, 2))

      if (data.project) {
        updateProject(project.id, () => data.project);
      }
      if (data.previewUrl) {
        setSmartPreviewUrl(data.previewUrl);
      }
    } catch (e) {
      console.error('Smart edit failed', e);
    } finally {
      setIsSmartEditing(false);
      setBusyReason('none'); // Global "loading" UI
    }
  }, [project, updateProject]);

  return {
    isSmartEditing,
    smartPreviewUrl,
    runSmartEdit,
  };
}
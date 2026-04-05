import { useState, useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  joinProject,
  onGenerationStatus,
  onGenerationComplete,
  onGenerationError,
  removeGenerationListeners
} from '../services/socket';

export const useGenerationStatus = (projectId, { onComplete } = {}) => {
  const queryClient = useQueryClient();
  const [generatingVersionId, setGeneratingVersionId] = useState(null);
  const [generationProgress, setGenerationProgress] = useState(null); // { progress, message }
  const [generationError, setGenerationError] = useState(null);

  useEffect(() => {
    if (!projectId) return;

    joinProject(projectId);

    onGenerationStatus((data) => {
      setGeneratingVersionId(data.versionId ?? null);
      setGenerationProgress({ progress: data.progress, message: data.message });
      setGenerationError(null);
    });

    onGenerationComplete((data) => {
      setGeneratingVersionId(null);
      setGenerationProgress(null);
      setGenerationError(null);
      queryClient.invalidateQueries({ queryKey: ['versions', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['projects', 'recent'] });
      if (onComplete) onComplete(data.versionId);
    });

    onGenerationError((data) => {
      setGeneratingVersionId(null);
      setGenerationProgress(null);
      // Worker emits { versionId, error: error.message }
      setGenerationError(data.error ?? data.message ?? 'Generation failed');
      queryClient.invalidateQueries({ queryKey: ['versions', projectId] });
    });

    return () => {
      removeGenerationListeners();
    };
  }, [projectId, queryClient]);


  const recoverFromRefresh = useCallback((versions) => {
    if (!versions?.length) return;
    const active = versions.find(
      (v) => v.status === 'pending' || v.status === 'processing'
    );
    if (active) {
      setGeneratingVersionId(active.id);
      setGenerationError(null);
    }
  }, []);

  const isGenerating = generatingVersionId !== null;

  return {
    generatingVersionId,
    generationProgress,
    generationError,
    isGenerating,
    recoverFromRefresh
  };
};

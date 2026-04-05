import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useGenerationStatus } from '../hooks/useGenerationStatus';
import { SkeletonVersionItem } from '../components/Skeleton';
import api from '../services/api';

const GalleryDetailPage = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedVersionId, setSelectedVersionId] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState('after'); // 'before' | 'after'
  const [prompt, setPrompt] = useState('');
  const [lightbox, setLightbox] = useState(false);
  const recoveredRef = useRef(false);

  const { data: projectData, isLoading: projectLoading } = useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => {
      const res = await api.get(`/projects/${projectId}`);
      return res.data;
    }
  });

  const { data: versionsData, isLoading: versionsLoading } = useQuery({
    queryKey: ['versions', projectId],
    queryFn: async () => {
      const res = await api.get(`/projects/${projectId}/versions`);
      return res.data;
    }
  });

  const {
    generatingVersionId,
    generationProgress,
    generationError,
    isGenerating,
    recoverFromRefresh
  } = useGenerationStatus(projectId, {
    onComplete: (versionId) => {
      setSelectedVersionId(versionId);
      setSelectedSlot('after');
    }
  });

  useEffect(() => {
    if (versionsData?.versions && !recoveredRef.current) {
      recoveredRef.current = true;
      recoverFromRefresh(versionsData.versions);
    }
  }, [versionsData, recoverFromRefresh]);

  useEffect(() => {
    if (versionsData?.versions?.length > 0 && !selectedVersionId) {
      setSelectedVersionId(versionsData.versions[0].id);
      setSelectedSlot('after');
    }
  }, [versionsData, selectedVersionId]);

  useEffect(() => {
    if (selectedVersionId && versionsData?.versions) {
      const v = versionsData.versions.find((v) => v.id === selectedVersionId);
      if (v) setPrompt(v.prompt ?? '');
    }
  }, [selectedVersionId, versionsData]);

  const [regenerateError, setRegenerateError] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const regenerateMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post(`/projects/${projectId}/versions`, {
        prompt,
        beforeVersionId: selectedVersionId,
        slot: selectedSlot
      });
      return res.data;
    },
    onSuccess: (data) => {
      setRegenerateError(null);
      queryClient.invalidateQueries({ queryKey: ['versions', projectId] });
      setSelectedVersionId(data.version.id);
      setSelectedSlot('after');
    },
    onError: (err) => {
      const msg = err?.response?.data?.error ?? err?.response?.data?.message ?? 'Something went wrong';
      setRegenerateError(msg);
    }
  });

  const deleteProjectMutation = useMutation({
    mutationFn: async () => {
      await api.delete(`/projects/${projectId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['projects', 'recent'] });
      navigate('/dress-maker');
    }
  });

  const versions = versionsData?.versions ?? [];
  const selectedVersion = versions.find((v) => v.id === selectedVersionId);

  // The image shown in the main viewer depends on which slot is selected
  const mainImage =
    selectedSlot === 'before'
      ? selectedVersion?.beforeImage
      : selectedVersion?.afterImage;

  const displayError =
    (selectedVersion?.status === 'failed' && selectedVersion?.errorMessage)
      ? selectedVersion.errorMessage
      : generationError;

  const isSelectedGenerating =
    generatingVersionId === selectedVersionId ||
    selectedVersion?.status === 'pending' ||
    selectedVersion?.status === 'processing';

  if (projectLoading || versionsLoading) {
    return (
      <div className="grid grid-cols-12 gap-5 max-w-6xl animate-pulse">
        <div className="col-span-1 space-y-4">
          <div className="h-3 bg-slate-200 rounded w-1/2" />
          {[1, 2].map((i) => <SkeletonVersionItem key={i} />)}
        </div>
        <div className="col-span-10">
          <div className="bg-white rounded-xl p-4">
            <div className="aspect-banner bg-slate-100 rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (!projectData?.project) {
    return (
      <div className="text-center py-12">
        <p className="text-[#64748B]">Project not found.</p>
        <Link to="/dress-maker" className="mt-4 inline-block text-[#2563EB] text-sm hover:underline">
          ← Back to Dress Maker
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-10xl">

      {/* Slim top bar: back + delete only */}
      <div className="flex items-center justify-between">
        <Link
          to="/dress-maker"
          className="p-2 rounded-lg hover:bg-slate-100 text-[#64748B]"
          aria-label="Back"
        >
          <BackIcon className="w-5 h-5" />
        </Link>
        <button
          onClick={() => setShowDeleteModal(true)}
          disabled={deleteProjectMutation.isPending}
          className="text-sm text-red-500 hover:text-red-600 hover:bg-red-50 px-3 py-1.5
            rounded-lg transition-colors disabled:opacity-50"
        >
          Delete
        </button>
      </div>

      {/* Error banner */}
      {displayError && (
        <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          <ErrorIcon className="w-4 h-4 shrink-0" />
          {displayError}
        </div>
      )}

      <div className="grid grid-cols-12 gap-5">

        {/* ── Versions sidebar ─── */}
        <div className="col-span-1 space-y-3">
          <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wide">Versions</p>
          <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb]:rounded-full">
            {versions.map((version, idx) => {
              const isActive = selectedVersionId === version.id;
              const vIsGenerating =
                generatingVersionId === version.id ||
                version.status === 'pending' ||
                version.status === 'processing';

              const selectSlot = (slot) => {
                setSelectedVersionId(version.id);
                setSelectedSlot(slot);
                setPrompt(version.prompt ?? '');
              };

              const isBeforeActive = isActive && selectedSlot === 'before';
              const isAfterActive = isActive && selectedSlot === 'after';

              return (
                <div key={version.id} className="space-y-0.5">
                  {/* Before thumbnail */}
                  <button
                    onClick={() => selectSlot('before')}
                    className={`w-full rounded-t-xl overflow-hidden border-2 transition-colors relative block
                      ${isBeforeActive ? 'border-[#2563EB]' : 'border-transparent hover:border-slate-300'}`}
                  >
                    <div className="aspect-square bg-slate-50">
                      <img
                        src={version.beforeImage}
                        alt={`v${idx + 1} sketch`}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                    <span className="absolute top-1 left-1 text-[10px] bg-black/40 text-white px-1.5 py-0.5 rounded font-medium">
                      Before
                    </span>
                  </button>

                  {/* After thumbnail */}
                  <button
                    onClick={() => selectSlot('after')}
                    disabled={vIsGenerating || !version.afterImage}
                    className={`w-full rounded-b-xl overflow-hidden border-2 transition-colors relative block
                      ${isAfterActive ? 'border-[#2563EB]' : 'border-transparent hover:border-slate-300'}
                      disabled:cursor-default`}
                  >
                    <div className="aspect-square bg-slate-100 relative">
                      {vIsGenerating ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-[#8B5CF6]/10">
                          <LoadingSpinner className="w-5 h-5 text-[#8B5CF6]" />
                        </div>
                      ) : version.afterImage ? (
                        <img
                          src={version.afterImage}
                          alt={`v${idx + 1} generated`}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-[10px] text-[#64748B]">Pending</span>
                        </div>
                      )}
                      {!vIsGenerating && (
                        <span className="absolute top-1 left-1 text-[10px] bg-black/40 text-white px-1.5 py-0.5 rounded font-medium">
                          After
                        </span>
                      )}
                    </div>
                  </button>

                  {/* Version label */}
                  <div className={`px-2 py-1 rounded-lg ${isActive ? 'bg-blue-50' : ''}`}>
                    <p className="text-[11px] font-medium text-[#64748B]">v{idx + 1}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Center: main image + prompt below ─── */}
        <div className="col-span-10 space-y-4">

          {/* Main image */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4">
            {isSelectedGenerating ? (
              <div className="aspect-banner flex flex-col items-center justify-center gap-4
                bg-gradient-to-br from-blue-50 to-violet-50 rounded-lg">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full border-4 border-slate-200" />
                  <div className="absolute inset-0 w-16 h-16 rounded-full border-4 border-[#8B5CF6] border-t-transparent animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <SparklesIcon className="w-6 h-6 text-[#8B5CF6]" />
                  </div>
                </div>
                <div className="text-center">
                  <p className="font-semibold text-[#1E293B] mb-1">
                    {generationProgress?.message ?? 'Generating your design…'}
                  </p>
                  <p className="text-sm text-[#64748B]">This usually takes under 2 minutes</p>
                </div>
                {generationProgress?.progress != null && (
                  <div className="w-48">
                    <div className="bg-white/70 rounded-full h-1.5">
                      <div
                        className="bg-[#8B5CF6] rounded-full h-1.5 transition-all duration-500"
                        style={{ width: `${generationProgress.progress}%` }}
                      />
                    </div>
                    <p className="text-xs text-[#64748B] mt-1 text-center">
                      {generationProgress.progress}%
                    </p>
                  </div>
                )}
              </div>
            ) : mainImage ? (
              <button
                onClick={() => setLightbox(true)}
                className="w-full aspect-banner rounded-lg overflow-hidden bg-slate-50
                  cursor-zoom-in group relative"
              >
                <img
                  src={mainImage}
                  alt="Generated design"
                  className="w-full h-full object-contain"
                />
                <div className="absolute inset-0 flex items-center justify-center
                  opacity-0 group-hover:opacity-100 transition-opacity bg-black/10">
                  <div className="bg-white/90 rounded-full p-2">
                    <ZoomIcon className="w-5 h-5 text-[#1E293B]" />
                  </div>
                </div>
              </button>
            ) : (
              <div className="aspect-banner flex items-center justify-center bg-slate-50 rounded-lg">
                <p className="text-sm text-[#64748B]">No generated image yet</p>
              </div>
            )}
          </div>

          {/* Prompt + regenerate — below the image */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4">
            {regenerateError && (
              <div className="flex items-start gap-2 px-3 py-2.5 mb-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                <ErrorIcon className="w-4 h-4 shrink-0 mt-0.5" />
                {regenerateError}
              </div>
            )}
            <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wide mb-3">Prompt</p>
            <div className="flex gap-3">
              <textarea
                value={prompt}
                onChange={(e) => { setPrompt(e.target.value); setRegenerateError(null); }}
                rows={3}
                placeholder="Describe your vision…"
                className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm resize-none
                  focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent
                  text-[#1E293B] placeholder:text-[#64748B]"
              />
            </div>
            <div className="flex justify-end mt-3">
              <button
                  onClick={() => regenerateMutation.mutate()}
                  disabled={regenerateMutation.isPending || isGenerating}
                  className="self-end px-5 py-2 bg-[#2563EB] text-white rounded-lg text-sm font-semibold
                    hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                    flex items-center gap-2 shrink-0"
                >
                  {regenerateMutation.isPending ? (
                    <LoadingSpinner className="w-4 h-4" />
                  ) : (
                    <>
                      <SparklesIcon className="w-4 h-4" />
                      Regenerate
                    </>
                  )}
                </button>
            </div>
          </div>

        </div>
      </div>

      {/* Delete confirmation modal */}
      {showDeleteModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={() => !deleteProjectMutation.isPending && setShowDeleteModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <TrashIcon className="w-6 h-6 text-red-500" />
            </div>
            <h2 className="text-lg font-semibold text-[#1E293B] text-center mb-2">Delete project?</h2>
            <p className="text-sm text-[#64748B] text-center mb-6">
              This cannot be undone. All versions and generated images will be permanently removed.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={deleteProjectMutation.isPending}
                className="flex-1 py-2.5 rounded-lg border border-slate-200 text-sm font-medium
                  text-[#64748B] hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteProjectMutation.mutate()}
                disabled={deleteProjectMutation.isPending}
                className="flex-1 py-2.5 rounded-lg bg-red-500 text-white text-sm font-semibold
                  hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deleteProjectMutation.isPending ? (
                  <LoadingSpinner className="w-4 h-4" />
                ) : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightbox && mainImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightbox(false)}
        >
          <button
            onClick={() => setLightbox(false)}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20
              text-white transition-colors"
          >
            <CloseIcon className="w-6 h-6" />
          </button>
          <img
            src={mainImage}
            alt="Generated design"
            className="max-w-full max-h-full object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
};

/* ─── Icons ─── */
const BackIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
  </svg>
);

const SparklesIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
  </svg>
);

const LoadingSpinner = ({ className }) => (
  <svg className={`animate-spin ${className}`} fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
  </svg>
);

const ErrorIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
);

const ZoomIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
  </svg>
);

const CloseIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const TrashIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

export default GalleryDetailPage;

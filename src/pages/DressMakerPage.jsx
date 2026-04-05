import { useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useDropzone } from 'react-dropzone';
import api from '../services/api';

const DressMakerPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [view, setView] = useState('gallery'); // 'gallery' | 'create' | 'submitting'
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [prompt, setPrompt] = useState('');
  const [submitError, setSubmitError] = useState(null);

  const { data: projectsData, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const res = await api.get('/projects');
      return res.data;
    }
  });

  const createProjectMutation = useMutation({
    mutationFn: async (formData) => {
      const res = await api.post('/projects', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      navigate(`/gallery/${data.project.id}`);
    },
    onError: (err) => {
      const msg = err?.response?.data?.error ?? err?.response?.data?.message ?? 'Something went wrong';
      setSubmitError(msg);
      setView('create');
    }
  });

  const onDrop = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0];
    if (file) {
      setSelectedFile(file);
      setPreview(URL.createObjectURL(file));
      setSubmitError(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.webp'] },
    maxSize: 10 * 1024 * 1024,
    multiple: false
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedFile) return;

    setView('submitting');

    const formData = new FormData();
    formData.append('sketch', selectedFile);
    formData.append('prompt', prompt);

    createProjectMutation.mutate(formData);
  };

  const handleReset = () => {
    setSelectedFile(null);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setPrompt('');
    setSubmitError(null);
    setView('gallery');
  };

  const projects = projectsData?.projects ?? [];

  // Full-page loading state while project is being created
  if (view === 'submitting') {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
        <div className="relative mb-8">
          <div className="w-24 h-24 rounded-full border-4 border-slate-200" />
          <div className="absolute inset-0 w-24 h-24 rounded-full border-4 border-[#2563EB] border-t-transparent animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <SparklesIcon className="w-8 h-8 text-[#2563EB]" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-[#1E293B] mb-2">
          Turning your sketch into reality
        </h2>
        <p className="text-[#64748B] max-w-sm">
          Gemini AI is analysing your design. You'll be redirected automatically
          once the project is ready.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl">

      {view === 'gallery' && (
        <>
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-[#1E293B]">Dress Maker</h1>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* New Project card — click only, no dropzone */}
            <button
              onClick={() => setView('create')}
              className="aspect-square rounded-xl border-2 border-dashed cursor-pointer transition-colors
                flex flex-col items-center justify-center gap-2
                border-slate-300 hover:border-[#2563EB] hover:bg-blue-50/40"
            >
              <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center">
                <PlusIcon className="w-6 h-6 text-[#2563EB]" />
              </div>
              <p className="text-sm font-medium text-[#1E293B]">New Project</p>
              <p className="text-xs text-[#64748B] text-center px-2">Click to start</p>
            </button>

            {isLoading && (
              <>
                {[1, 2, 3].map((i) => (
                  <div key={i} className="aspect-square bg-slate-200 rounded-xl animate-pulse" />
                ))}
              </>
            )}

            {projects.map((project) => (
              <Link
                key={project.id}
                to={`/gallery/${project.id}`}
                className="group relative aspect-square bg-white rounded-xl overflow-hidden
                  shadow-sm hover:shadow-md transition-shadow border border-slate-100"
              >
                <img
                  src={project.thumbnail || project.originalImage}
                  alt="Project"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </Link>
            ))}
          </div>
        </>
      )}

      {view === 'create' && (
        <form onSubmit={handleSubmit} className="max-w-2xl">
          <div className="flex items-center gap-3 mb-6">
            <button
              type="button"
              onClick={handleReset}
              className="p-2 rounded-lg hover:bg-slate-100 text-[#64748B]"
              aria-label="Back"
            >
              <BackIcon className="w-5 h-5" />
            </button>
            <h1 className="text-2xl font-bold text-[#1E293B]">New Project</h1>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 space-y-5">
            {submitError && (
              <div className="flex items-start gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                <ErrorIcon className="w-4 h-4 shrink-0 mt-0.5" />
                {submitError}
              </div>
            )}
            {/* Sketch upload / preview */}
            {!selectedFile ? (
              <div
                {...getRootProps()}
                className={`rounded-lg border-2 border-dashed cursor-pointer transition-colors
                  flex flex-col items-center justify-center gap-3 py-16
                  ${isDragActive
                    ? 'border-[#2563EB] bg-blue-50'
                    : 'border-slate-300 hover:border-[#2563EB] hover:bg-blue-50/40'}`}
              >
                <input {...getInputProps()} />
                <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center">
                  <UploadIcon className="w-7 h-7 text-[#2563EB]" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-[#1E293B]">
                    {isDragActive ? 'Drop it here' : 'Drop your sketch here'}
                  </p>
                  <p className="text-xs text-[#64748B] mt-1">or click to browse</p>
                  <p className="text-[10px] text-[#64748B] mt-2">JPEG · JPG · PNG · WEBP · max 10MB</p>
                </div>
              </div>
            ) : (
              <div className="rounded-lg overflow-hidden bg-slate-50 border border-slate-200">
                <div className="relative aspect-[3/4] max-h-72 mx-auto">
                  <img
                    src={preview}
                    alt="Sketch preview"
                    className="w-full h-full object-contain"
                  />
                  <div className="absolute bottom-2 right-2">
                    <input {...getInputProps()} />
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); open(); }}
                      className="text-xs px-3 py-1.5 bg-white/90 text-[#64748B] rounded-lg
                        border border-slate-200 hover:bg-white hover:text-[#1E293B] transition-colors"
                    >
                      Replace
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between px-3 py-2 border-t border-slate-200 bg-white">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileIcon className="w-4 h-4 text-[#64748B] shrink-0" />
                    <span className="text-xs text-[#1E293B] truncate font-medium">
                      {selectedFile.name}
                    </span>
                  </div>
                  <span className="text-[10px] text-[#64748B] shrink-0 ml-2">
                    JPEG · JPG · PNG · WEBP
                  </span>
                </div>
              </div>
            )}

            {/* Prompt */}
            <div>
              <label className="block text-sm font-medium text-[#1E293B] mb-1.5">
                Describe your vision <span className="text-[#64748B] font-normal">(optional)</span>
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Elegant silk evening gown with lace details, deep navy blue..."
                rows={4}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm resize-none
                  focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent
                  text-[#1E293B] placeholder:text-[#64748B]"
              />
              <p className="mt-1 text-xs text-[#64748B]">
                Include fabric type, colour, style details, and any embellishments
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-1">
              <button
                type="button"
                onClick={handleReset}
                className="px-4 py-2 text-sm text-[#64748B] hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!selectedFile}
                className="inline-flex items-center gap-2 px-5 py-2 bg-[#2563EB] text-white
                  rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors
                  disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <SparklesIcon className="w-4 h-4" />
                Generate
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};

const PlusIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const SparklesIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
  </svg>
);

const BackIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
  </svg>
);

const UploadIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
  </svg>
);

const ErrorIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
);

const FileIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

export default DressMakerPage;

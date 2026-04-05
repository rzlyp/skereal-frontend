import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { SkeletonGalleryGrid } from '../components/Skeleton';
import api from '../services/api';

const DashboardPage = () => {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['projects', 'recent'],
    queryFn: async () => {
      const res = await api.get('/projects?limit=4');
      return res.data;
    }
  });

  const projects = data?.projects ?? [];

  return (
    <div className="space-y-8 max-w-6xl">

      <div className="relative overflow-hidden rounded-2xl bg-[#2563EB] text-white px-8 py-10">
        <div className="absolute -right-12 -top-12 w-56 h-56 rounded-full bg-white/10" />
        <div className="absolute -right-4 -bottom-16 w-72 h-72 rounded-full bg-white/5" />

        <div className="relative z-10">
          <p className="text-blue-100 text-sm font-medium mb-1">Hi, {user?.name?.split(' ')[0]} 👋</p>
          <h1 className="text-3xl font-bold mb-2">Convert Your Sketch to Reality</h1>
          <p className="text-blue-100 mb-6 max-w-md">
            Transform your fashion sketches into photorealistic images — in under 2 minutes.
          </p>
          <Link
            to="/dress-maker"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-[#2563EB]
              font-semibold rounded-lg hover:bg-blue-50 transition-colors text-sm"
          >
            <PlusIcon className="w-4 h-4" />
            New Project
          </Link>
        </div>
      </div>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-[#1E293B]">Recent Projects</h2>
          <Link
            to="/dress-maker"
            className="text-sm text-[#2563EB] hover:underline font-medium"
          >
            View all →
          </Link>
        </div>

        {isLoading ? (
          <SkeletonGalleryGrid count={4} />
        ) : projects.length === 0 ? (
          <div className="bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-4">
              <ImageIcon className="w-6 h-6 text-[#2563EB]" />
            </div>
            <p className="text-[#1E293B] font-medium mb-1">No projects yet</p>
            <p className="text-[#64748B] text-sm mb-4">Create your first fashion design</p>
            <Link
              to="/dress-maker"
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#2563EB] text-white
                rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              <PlusIcon className="w-4 h-4" />
              Create Project
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

const ProjectCard = ({ project }) => (
  <Link
    to={`/gallery/${project.id}`}
    className="group relative bg-white rounded-xl overflow-hidden shadow-sm
      hover:shadow-md transition-shadow border border-slate-100"
  >
    <div className="aspect-square bg-slate-50">
      <img
        src={project.thumbnail || project.originalImage}
        alt={project.name}
        className="w-full h-full object-cover"
        loading="lazy"
      />
    </div>
    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent
      opacity-0 group-hover:opacity-100 transition-opacity rounded-xl">
      <div className="absolute bottom-0 left-0 right-0 p-3">
        <p className="text-white text-sm font-medium truncate">{project.name}</p>
      </div>
    </div>
  </Link>
);

const PlusIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const ImageIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);



export default DashboardPage;

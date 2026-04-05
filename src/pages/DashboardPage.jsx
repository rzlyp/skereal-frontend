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
        </div>
      </div>
    </div>
  );
};


export default DashboardPage;

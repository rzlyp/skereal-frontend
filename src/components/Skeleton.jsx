/* Reusable skeleton loader components */

export const Skeleton = ({ className = '' }) => (
  <div className={`animate-pulse bg-slate-200 rounded ${className}`} />
);

export const SkeletonCard = () => (
  <div className="bg-white rounded-xl overflow-hidden shadow-sm">
    <Skeleton className="aspect-square w-full rounded-none" />
    <div className="p-3 space-y-2">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
    </div>
  </div>
);

export const SkeletonGalleryGrid = ({ count = 4 }) => (
  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
    {Array.from({ length: count }).map((_, i) => (
      <SkeletonCard key={i} />
    ))}
  </div>
);

export const SkeletonText = ({ lines = 3 }) => (
  <div className="space-y-2">
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton
        key={i}
        className={`h-4 ${i === lines - 1 ? 'w-2/3' : 'w-full'}`}
      />
    ))}
  </div>
);

export const SkeletonVersionItem = () => (
  <div className="space-y-1">
    <Skeleton className="w-full aspect-square rounded-lg" />
    <Skeleton className="w-full aspect-square rounded-lg" />
  </div>
);

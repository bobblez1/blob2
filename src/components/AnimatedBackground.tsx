const AnimatedBackground = () => {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute top-10 left-10 w-20 h-20 bg-blue-500/20 rounded-full animate-blob-1"></div>
      <div className="absolute top-32 right-16 w-16 h-16 bg-purple-500/20 rounded-full animate-blob-2"></div>
      <div className="absolute bottom-40 left-20 w-12 h-12 bg-pink-500/20 rounded-full animate-blob-3"></div>
      <div className="absolute bottom-20 right-10 w-24 h-24 bg-green-500/20 rounded-full animate-blob-4"></div>
    </div>
  );
};

export default AnimatedBackground;
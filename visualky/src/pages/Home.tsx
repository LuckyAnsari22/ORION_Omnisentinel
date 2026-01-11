import { Link } from 'react-router-dom';
import { Camera, Settings, Play } from 'lucide-react';
import { useEffect } from 'react';
import { useVoiceAnnouncer } from '../components/Accessibility/VoiceAnnouncer';
import { LivingInterface } from '../components/3D/LivingInterface';

const Home = () => {
  const voiceAnnouncer = useVoiceAnnouncer();

  useEffect(() => {
    // Announce page on load
    voiceAnnouncer.announce(
      'Welcome to LocalLens. Use your voice or press Start Camera.',
      { priority: 'normal' }
    );
  }, [voiceAnnouncer]);

  return (
    <div className="relative h-screen w-full bg-black overflow-hidden pointer-events-auto">

      {/* Immersive 3D Experience */}
      <div className="absolute inset-0 z-0">
        <LivingInterface />
      </div>

      {/* Interactive Overlay */}
      <div className="absolute inset-0 z-10 flex flex-col justify-end items-center pb-24 pointer-events-none">

        {/* Buttons (Pointer events auto to allow clicking) */}
        <div className="flex gap-4 pointer-events-auto">
          <Link
            to="/camera"
            className="flex items-center gap-3 bg-white/10 backdrop-blur-md border border-white/20 text-white px-8 py-4 rounded-full font-bold hover:bg-white/20 transition-all hover:scale-105 active:scale-95"
          >
            <Camera size={20} />
            <span>Start Camera</span>
          </Link>

          <Link
            to="/demo" // Or settings
            className="flex items-center gap-3 bg-black/30 backdrop-blur-md border border-white/10 text-slate-300 px-6 py-4 rounded-full font-medium hover:bg-black/50 transition-all"
          >
            <Play size={20} />
            <span>Demo</span>
          </Link>
        </div>

      </div>

      {/* Top Right Settings */}
      <div className="absolute top-6 right-6 z-20 pointer-events-auto">
        <Link to="/settings" className="text-slate-500 hover:text-white transition-colors">
          <Settings size={24} />
        </Link>
      </div>

    </div>
  );
};

export default Home;

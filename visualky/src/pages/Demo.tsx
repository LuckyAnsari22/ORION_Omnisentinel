import { Link } from 'react-router-dom';
import { ChevronLeft, Play, RotateCcw } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useVoiceAnnouncer } from '../components/Accessibility/VoiceAnnouncer';
import AccessibleButton from '../components/Common/AccessibleButton';

interface DemoScenario {
  id: string;
  title: string;
  description: string;
  scenario: string;
  expected: string;
}

const DEMO_SCENARIOS: DemoScenario[] = [
  {
    id: 'kitchen',
    title: 'Kitchen Scene',
    description: 'Typical kitchen with common items',
    scenario: 'You enter your kitchen. There is a table in the center with a coffee mug on the right side. Behind the mug is a kettle. To your left is the refrigerator.',
    expected: 'Description: "You are in a kitchen. There is a table with a coffee mug on the right and a kettle behind it. The refrigerator is on your left."',
  },
  {
    id: 'document',
    title: 'Document Reading',
    description: 'Menu or text document',
    scenario: 'You are holding a menu. It reads: "CAFE MENU - Coffee Section: Espresso $3.50, Latte $4.00, Cappuccino $4.50"',
    expected: 'Text Reading: "Cafe Menu. Coffee Section. Espresso three dollars fifty cents. Latte four dollars. Cappuccino four dollars fifty cents."',
  },
  {
    id: 'object-finding',
    title: 'Find My Keys',
    description: 'Looking for a specific object',
    scenario: 'You ask "Where are my keys?" Your keys are on the right side of your desk, near the lamp.',
    expected: 'Object Finding: "Your keys are on your right, next to the lamp on your desk."',
  },
  {
    id: 'navigation',
    title: 'Navigation Safety',
    description: 'Checking for obstacles',
    scenario: 'You\'re walking forward. There is a staircase 5 feet ahead descending downward.',
    expected: 'Navigation: "Warning: Stairs ahead at about 5 feet. They descend downward."',
  },
  {
    id: 'colors',
    title: 'Color Identification',
    description: 'Understanding clothing colors',
    scenario: 'You\'re wearing a blue shirt with white stripes. Your pants are black.',
    expected: 'Color Analysis: "You are wearing a blue shirt with white vertical stripes and black pants."',
  },
];

const DemoPage = () => {
  const voiceAnnouncer = useVoiceAnnouncer();
  const [currentScenario, setCurrentScenario] = useState<DemoScenario | null>(null);
  const [showResult, setShowResult] = useState(false);

  useEffect(() => {
    voiceAnnouncer.announce(
      'Welcome to LocalLens interactive demo. Choose a scenario to explore how the app works.',
      { priority: 'normal' }
    );
  }, [voiceAnnouncer]);

  const handleScenarioStart = (scenario: DemoScenario) => {
    setCurrentScenario(scenario);
    setShowResult(false);
    voiceAnnouncer.announce(`Starting demo: ${scenario.title}. ${scenario.scenario}`, { priority: 'high' });
  };

  const handleShowResult = () => {
    if (currentScenario) {
      setShowResult(true);
      voiceAnnouncer.announce(`Expected result: ${currentScenario.expected}`, { priority: 'high' });
    }
  };

  const handleReset = () => {
    setCurrentScenario(null);
    setShowResult(false);
    voiceAnnouncer.announce('Demo reset. Choose another scenario.', { priority: 'normal' });
  };

  if (currentScenario) {
    return (
      <div className="min-h-screen bg-white text-black">
        {/* Header */}
        <div className="bg-blue-900 text-white p-6 section-spacing">
          <Link
            to="/"
            className="flex items-center gap-2 text-yellow-400 font-bold text-lg mb-4 hover:text-yellow-300"
          >
            <ChevronLeft size={24} />
            Back to Home
          </Link>
          <h1 className="text-4xl font-bold">Demo: {currentScenario.title}</h1>
        </div>

        {/* Demo Content */}
        <div className="section-spacing space-y-8 max-w-2xl">
          {/* Scenario Description */}
          <section className="border-4 border-blue-900 p-8 rounded-lg bg-blue-50 space-y-4">
            <h2 className="text-3xl font-bold text-blue-900">Scenario</h2>
            <p className="text-xl leading-relaxed text-black">
              {currentScenario.scenario}
            </p>
          </section>

          {/* Result */}
          {showResult && (
            <section className="border-4 border-green-600 p-8 rounded-lg bg-green-50 space-y-4 animate-pulse-slow">
              <h2 className="text-3xl font-bold text-green-600">What LocalLens Would Say</h2>
              <div className="bg-white border-2 border-green-600 p-6 rounded-lg">
                <p className="text-xl leading-relaxed text-black">
                  {currentScenario.expected}
                </p>
              </div>
              <div className="bg-yellow-50 border-2 border-yellow-600 p-4 rounded-lg">
                <p className="text-base font-bold text-black">
                  ✨ This demo uses our sample scripts. In real usage, LocalLens would analyze actual camera feed with Google Gemini Nano.
                </p>
              </div>
            </section>
          )}

          {/* Controls */}
          <div className="flex flex-col gap-4">
            {!showResult && (
              <button
                onClick={handleShowResult}
                className="flex items-center justify-center gap-4 bg-green-600 text-white p-6 rounded-2xl text-2xl font-bold hover:bg-green-700 active:scale-95 transition-all min-h-12"
              >
                <Play size={32} />
                Show AI Response
              </button>
            )}

            <button
              onClick={handleReset}
              className="flex items-center justify-center gap-4 bg-gray-600 text-white p-6 rounded-2xl text-2xl font-bold hover:bg-gray-700 active:scale-95 transition-all min-h-12"
            >
              <RotateCcw size={32} />
              Try Another Scenario
            </button>
          </div>

          {/* Info */}
          <div className="bg-purple-50 border-2 border-purple-600 p-6 rounded-lg space-y-3">
            <p className="text-lg font-bold text-black">💡 About This Demo</p>
            <ul className="space-y-2 text-base text-black">
              <li>✅ These scenarios showcase LocalLens capabilities</li>
              <li>✅ Real processing happens offline on your device</li>
              <li>✅ Google Gemini Nano provides accurate descriptions</li>
              <li>✅ No internet or cloud services required</li>
              <li>✅ Your privacy is completely protected</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-black">
      {/* Header */}
      <div className="bg-blue-900 text-white p-6 section-spacing">
        <Link
          to="/"
          className="flex items-center gap-2 text-yellow-400 font-bold text-lg mb-4 hover:text-yellow-300"
        >
          <ChevronLeft size={24} />
          Back to Home
        </Link>
        <h1 className="text-4xl font-bold">Interactive Demo</h1>
        <p className="text-lg mt-2">Explore LocalLens with guided scenarios</p>
      </div>

      {/* Scenarios Grid */}
      <div className="section-spacing">
        <div className="space-y-6 max-w-3xl">
          <div className="bg-blue-50 border-2 border-blue-900 p-6 rounded-lg">
            <p className="text-lg font-bold text-black">
              Choose a scenario to see how LocalLens helps you understand your surroundings using AI.
            </p>
          </div>

          <div className="grid gap-4">
            {DEMO_SCENARIOS.map(scenario => (
              <button
                key={scenario.id}
                onClick={() => handleScenarioStart(scenario)}
                className="text-left p-6 border-4 border-black rounded-lg hover:bg-blue-50 active:scale-95 transition-all focus-visible:outline-4 focus-visible:outline-blue-900 outline-offset-2"
              >
                <h3 className="text-2xl font-bold text-blue-900 mb-2 flex items-center gap-3">
                  <Play size={24} />
                  {scenario.title}
                </h3>
                <p className="text-lg text-black mb-3">{scenario.description}</p>
                <p className="text-base text-gray-700">
                  {scenario.scenario.substring(0, 100)}...
                </p>
              </button>
            ))}
          </div>

          {/* Demo Info Section */}
          <div className="space-y-6">
            <div className="border-4 border-green-600 bg-green-50 p-8 rounded-lg space-y-4">
              <h2 className="text-3xl font-bold text-green-600">🎯 Key Features Demonstrated</h2>
              <div className="space-y-3 text-lg text-black font-bold">
                <p>✅ Real-time scene analysis with spatial descriptions</p>
                <p>✅ Text detection and reading (OCR)</p>
                <p>✅ Object finding and location guidance</p>
                <p>✅ Safety navigation with warnings</p>
                <p>✅ Color and pattern identification</p>
              </div>
            </div>

            <div className="border-4 border-yellow-600 bg-yellow-50 p-8 rounded-lg space-y-4">
              <h2 className="text-3xl font-bold text-yellow-600">🔒 Privacy & Offline</h2>
              <ul className="space-y-2 text-base text-black">
                <li className="text-lg font-bold">• All processing happens on your device</li>
                <li className="text-lg font-bold">• Your camera feed never leaves your phone</li>
                <li className="text-lg font-bold">• No internet connection required</li>
                <li className="text-lg font-bold">• No tracking, analytics, or ads</li>
                <li className="text-lg font-bold">• 100% open source - you can audit the code</li>
              </ul>
            </div>

            <div className="border-4 border-purple-600 bg-purple-50 p-8 rounded-lg space-y-4">
              <h2 className="text-3xl font-bold text-purple-600">⚡ Technology Stack</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-base font-bold text-black mb-2">AI & Vision</p>
                  <ul className="space-y-1 text-sm text-gray-700">
                    <li>• Google Gemini Nano</li>
                    <li>• MediaPipe</li>
                    <li>• Web Speech API</li>
                  </ul>
                </div>
                <div>
                  <p className="text-base font-bold text-black mb-2">Framework</p>
                  <ul className="space-y-1 text-sm text-gray-700">
                    <li>• React 19</li>
                    <li>• TypeScript</li>
                    <li>• Vite</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Call to Action */}
            <div className="flex flex-col gap-4 items-center">
              <Link to="/camera" className="w-full max-w-sm">
                <AccessibleButton
                  label="Ready? Try the Camera"
                  variant="primary"
                  size="xl"
                  className="w-full"
                />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DemoPage;

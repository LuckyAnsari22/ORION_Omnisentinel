import { Link } from 'react-router-dom';
import { ChevronLeft, Volume2, Eye, Vibrate, Globe } from 'lucide-react';
import { useState, useEffect } from 'react';
import AccessibleButton from '../components/Common/AccessibleButton';
import { useVoiceAnnouncer } from '../components/Accessibility/VoiceAnnouncer';

interface Settings {
  speechRate: number;
  speechPitch: number;
  vibrationIntensity: number;
  language: string;
  detailLevel: 'brief' | 'detailed' | 'very-detailed';
  highContrast: boolean;
  hapticFeedback: boolean;
  autoReadPreferences: boolean;
}

const SettingsPage = () => {
  const voiceAnnouncer = useVoiceAnnouncer();
  const [settings, setSettings] = useState<Settings>(() => {
    const saved = localStorage.getItem('locallens-settings');
    return saved ? JSON.parse(saved) : {
      speechRate: 1.0,
      speechPitch: 1.0,
      vibrationIntensity: 0.8,
      language: 'en-US',
      detailLevel: 'detailed',
      highContrast: false,
      hapticFeedback: true,
      autoReadPreferences: true,
    };
  });

  // Save settings to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('locallens-settings', JSON.stringify(settings));
  }, [settings]);

  const handleSpeechRateChange = (newRate: number) => {
    const clamped = Math.max(0.5, Math.min(2, newRate));
    setSettings(prev => ({ ...prev, speechRate: clamped }));
    voiceAnnouncer.announce(`Speech rate set to ${Math.round(clamped * 100)} percent`, { priority: 'normal' });
  };

  const handleSpeechPitchChange = (newPitch: number) => {
    const clamped = Math.max(0.5, Math.min(2, newPitch));
    setSettings(prev => ({ ...prev, speechPitch: clamped }));
    voiceAnnouncer.announce(`Speech pitch adjusted`, { priority: 'normal' });
  };

  const handleVibrationChange = (newIntensity: number) => {
    const clamped = Math.max(0, Math.min(1, newIntensity));
    setSettings(prev => ({ ...prev, vibrationIntensity: clamped }));
    // Test vibration
    if (navigator.vibrate && clamped > 0) {
      navigator.vibrate([100, 50, 100]);
    }
    voiceAnnouncer.announce(`Vibration intensity set to ${Math.round(clamped * 100)} percent`, { priority: 'normal' });
  };

  const handleDetailLevelChange = (level: 'brief' | 'detailed' | 'very-detailed') => {
    setSettings(prev => ({ ...prev, detailLevel: level }));
    const messages = {
      'brief': 'Brief descriptions enabled',
      'detailed': 'Detailed descriptions enabled',
      'very-detailed': 'Very detailed descriptions enabled'
    };
    voiceAnnouncer.announce(messages[level], { priority: 'normal' });
  };

  const toggleSetting = (key: keyof Omit<Settings, 'speechRate' | 'speechPitch' | 'vibrationIntensity' | 'language' | 'detailLevel'>) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
    const value = !settings[key];
    voiceAnnouncer.announce(`${key.replace(/([A-Z])/g, ' $1').trim()} ${value ? 'enabled' : 'disabled'}`, { priority: 'normal' });
  };

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
        <h1 className="text-4xl font-bold">Settings & Accessibility</h1>
        <p className="text-lg mt-2">Customize your LocalLens experience</p>
      </div>

      {/* Settings Sections */}
      <div className="section-spacing space-y-8 max-w-2xl">
        
        {/* Voice Settings */}
        <section className="space-y-4 border-2 border-black p-6 rounded-lg">
          <h2 className="text-3xl font-bold text-blue-900 flex items-center gap-3">
            <Volume2 size={32} />
            Voice Settings
          </h2>
          
          <div className="space-y-4">
            {/* Speech Rate */}
            <div>
              <label htmlFor="speech-rate" className="block text-xl font-bold mb-3">
                Speech Rate: {Math.round(settings.speechRate * 100)}%
              </label>
              <input
                id="speech-rate"
                type="range"
                min="0.5"
                max="2"
                step="0.1"
                value={settings.speechRate}
                onChange={(e) => handleSpeechRateChange(parseFloat(e.target.value))}
                className="w-full h-3 bg-gray-300 rounded-lg cursor-pointer"
                aria-label="Speech rate"
              />
              <p className="text-base text-gray-700 mt-2">
                Slow (0.5x) ← → Fast (2x)
              </p>
            </div>

            {/* Speech Pitch */}
            <div>
              <label htmlFor="speech-pitch" className="block text-xl font-bold mb-3">
                Speech Pitch: {Math.round(settings.speechPitch * 100)}%
              </label>
              <input
                id="speech-pitch"
                type="range"
                min="0.5"
                max="2"
                step="0.1"
                value={settings.speechPitch}
                onChange={(e) => handleSpeechPitchChange(parseFloat(e.target.value))}
                className="w-full h-3 bg-gray-300 rounded-lg cursor-pointer"
                aria-label="Speech pitch"
              />
              <p className="text-base text-gray-700 mt-2">
                Deep (0.5x) ← → High (2x)
              </p>
            </div>
          </div>
        </section>

        {/* Analysis Settings */}
        <section className="space-y-4 border-2 border-black p-6 rounded-lg">
          <h2 className="text-3xl font-bold text-blue-900 flex items-center gap-3">
            <Eye size={32} />
            Analysis Preferences
          </h2>

          <div className="space-y-3">
            <label className="flex items-center gap-4 p-4 bg-gray-100 rounded-lg cursor-pointer hover:bg-gray-200">
              <input
                type="radio"
                name="detail-level"
                value="brief"
                checked={settings.detailLevel === 'brief'}
                onChange={() => handleDetailLevelChange('brief')}
                className="w-6 h-6 cursor-pointer"
              />
              <div>
                <p className="text-lg font-bold text-black">Brief Descriptions</p>
                <p className="text-base text-gray-700">Quick, concise information</p>
              </div>
            </label>

            <label className="flex items-center gap-4 p-4 bg-gray-100 rounded-lg cursor-pointer hover:bg-gray-200">
              <input
                type="radio"
                name="detail-level"
                value="detailed"
                checked={settings.detailLevel === 'detailed'}
                onChange={() => handleDetailLevelChange('detailed')}
                className="w-6 h-6 cursor-pointer"
              />
              <div>
                <p className="text-lg font-bold text-black">Detailed Descriptions</p>
                <p className="text-base text-gray-700">Balanced, comprehensive information</p>
              </div>
            </label>

            <label className="flex items-center gap-4 p-4 bg-gray-100 rounded-lg cursor-pointer hover:bg-gray-200">
              <input
                type="radio"
                name="detail-level"
                value="very-detailed"
                checked={settings.detailLevel === 'very-detailed'}
                onChange={() => handleDetailLevelChange('very-detailed')}
                className="w-6 h-6 cursor-pointer"
              />
              <div>
                <p className="text-lg font-bold text-black">Very Detailed Descriptions</p>
                <p className="text-base text-gray-700">Complete, thorough information</p>
              </div>
            </label>
          </div>
        </section>

        {/* Haptic Settings */}
        <section className="space-y-4 border-2 border-black p-6 rounded-lg">
          <h2 className="text-3xl font-bold text-blue-900 flex items-center gap-3">
            <Vibrate size={32} />
            Haptic Feedback
          </h2>

          <div>
            <label htmlFor="vibration-intensity" className="block text-xl font-bold mb-3">
              Vibration Intensity: {Math.round(settings.vibrationIntensity * 100)}%
            </label>
            <input
              id="vibration-intensity"
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={settings.vibrationIntensity}
              onChange={(e) => handleVibrationChange(parseFloat(e.target.value))}
              className="w-full h-3 bg-gray-300 rounded-lg cursor-pointer"
              aria-label="Vibration intensity"
            />
            <p className="text-base text-gray-700 mt-2">
              Off (0%) ← → Strong (100%)
            </p>
          </div>

          <label className="flex items-center gap-4 p-4 bg-blue-50 border-2 border-blue-900 rounded-lg cursor-pointer">
            <input
              type="checkbox"
              checked={settings.hapticFeedback}
              onChange={() => toggleSetting('hapticFeedback')}
              className="w-6 h-6 cursor-pointer"
            />
            <span className="text-lg font-bold text-black">Enable Haptic Feedback for Buttons</span>
          </label>
        </section>

        {/* Language Settings */}
        <section className="space-y-4 border-2 border-black p-6 rounded-lg">
          <h2 className="text-3xl font-bold text-blue-900 flex items-center gap-3">
            <Globe size={32} />
            Language & Region
          </h2>

          <div>
            <label htmlFor="language" className="block text-xl font-bold mb-3">
              Language
            </label>
            <select
              id="language"
              value={settings.language}
              onChange={(e) => {
                setSettings(prev => ({ ...prev, language: e.target.value }));
                voiceAnnouncer.announce(`Language changed to ${e.target.value}`, { priority: 'normal' });
              }}
              className="w-full p-4 text-lg border-2 border-black rounded-lg bg-white text-black"
            >
              <option value="en-US">English (US)</option>
              <option value="en-GB">English (UK)</option>
              <option value="es-ES">Spanish</option>
              <option value="fr-FR">French</option>
              <option value="de-DE">German</option>
              <option value="ja-JP">Japanese</option>
              <option value="zh-CN">Simplified Chinese</option>
            </select>
          </div>
        </section>

        {/* Accessibility Options */}
        <section className="space-y-4 border-2 border-black p-6 rounded-lg">
          <h2 className="text-3xl font-bold text-blue-900">Accessibility Options</h2>

          <div className="space-y-3">
            <label className="flex items-center gap-4 p-4 bg-blue-50 border-2 border-blue-900 rounded-lg cursor-pointer">
              <input
                type="checkbox"
                checked={settings.highContrast}
                onChange={() => toggleSetting('highContrast')}
                className="w-6 h-6 cursor-pointer"
              />
              <span className="text-lg font-bold text-black">High Contrast Mode</span>
            </label>

            <label className="flex items-center gap-4 p-4 bg-blue-50 border-2 border-blue-900 rounded-lg cursor-pointer">
              <input
                type="checkbox"
                checked={settings.autoReadPreferences}
                onChange={() => toggleSetting('autoReadPreferences')}
                className="w-6 h-6 cursor-pointer"
              />
              <span className="text-lg font-bold text-black">Auto-Read Preferences</span>
            </label>
          </div>

          <div className="bg-yellow-50 border-2 border-yellow-600 p-4 rounded-lg">
            <p className="text-base font-bold text-black">
              💡 Tip: Press Tab to navigate all settings, Enter or Space to activate buttons
            </p>
          </div>
        </section>

        {/* Data Management */}
        <section className="space-y-4 border-2 border-black p-6 rounded-lg bg-gray-50">
          <h2 className="text-3xl font-bold text-blue-900">Data & Privacy</h2>
          <div className="space-y-3 text-lg">
            <p className="font-bold text-black">
              ✅ All data stored locally on your device only
            </p>
            <p className="font-bold text-black">
              ✅ No internet connection required
            </p>
            <p className="font-bold text-black">
              ✅ No analytics or tracking
            </p>
            <p className="font-bold text-black">
              ✅ No ads or third-party services
            </p>
          </div>

          <button
            onClick={() => {
              localStorage.removeItem('locallens-settings');
              voiceAnnouncer.announce('Settings reset to defaults', { priority: 'high' });
              setSettings({
                speechRate: 1.0,
                speechPitch: 1.0,
                vibrationIntensity: 0.8,
                language: 'en-US',
                detailLevel: 'detailed',
                highContrast: false,
                hapticFeedback: true,
                autoReadPreferences: true,
              });
            }}
            className="w-full mt-4 px-6 py-3 bg-gray-600 text-white font-bold text-lg rounded-lg hover:bg-gray-700 transition-colors"
          >
            Reset to Defaults
          </button>
        </section>

        {/* Back Button */}
        <div className="flex justify-center mt-8">
          <Link to="/camera">
            <AccessibleButton label="Return to Camera" variant="primary" size="xl" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;

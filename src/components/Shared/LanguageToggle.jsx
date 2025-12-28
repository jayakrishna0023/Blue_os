import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { Languages } from 'lucide-react';

const LanguageToggle = ({ className = '' }) => {
  const { language, toggleLanguage, t } = useLanguage();

  return (
    <button
      onClick={toggleLanguage}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800/50 border border-slate-700 hover:bg-slate-700/50 transition-all ${className}`}
      title={t('language')}
    >
      <Languages className="w-4 h-4 text-blue-400" />
      <span className="text-sm font-medium">
        {language === 'en' ? 'EN' : 'த'}
      </span>
      <div className="relative w-10 h-5 bg-slate-700 rounded-full">
        <div 
          className={`absolute top-0.5 w-4 h-4 rounded-full transition-all duration-300 ${
            language === 'en' 
              ? 'left-0.5 bg-blue-500' 
              : 'left-5 bg-green-500'
          }`}
        />
      </div>
      <span className="text-xs text-slate-400">
        {language === 'en' ? 'தமிழ்' : 'ENG'}
      </span>
    </button>
  );
};

export default LanguageToggle;

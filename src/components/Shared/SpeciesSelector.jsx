import React, { useState, useMemo } from 'react';
import { Search, X, Fish, Check, ChevronRight } from 'lucide-react';
import { FAO_SPECIES, searchSpecies } from '../../services/faoConstants';

// Species images mapping - using placeholder URLs that can be replaced with actual images
const SPECIES_IMAGES = {
  'YFT': 'https://www.fishwatch.gov/sites/default/files/yellowfin_tuna.png',
  'SKJ': 'https://www.fishwatch.gov/sites/default/files/skipjack_tuna.png',
  'BET': 'https://www.fishwatch.gov/sites/default/files/bigeye_tuna.png',
  'GRO': '/species/grouper.png',
  'SNP': '/species/snapper.png',
  'COM': '/species/seerfish.png',
  'SWO': 'https://www.fishwatch.gov/sites/default/files/swordfish.png',
  'SAI': '/species/sailfish.png',
  'DOL': 'https://www.fishwatch.gov/sites/default/files/mahi_mahi.png',
  'CBA': '/species/cobia.png',
  'POB': '/species/pomfret.png',
  'MAC': '/species/mackerel.png',
  'SAR': '/species/sardine.png',
  'SQU': '/species/squid.png',
  'CTL': '/species/cuttlefish.png',
  'OCT': '/species/octopus.png',
  'PEN': '/species/prawns.png',
  'LOB': '/species/lobster.png',
  'CRB': '/species/crab.png',
  'BAR': '/species/barracuda.png',
  'ANE': '/species/anchovy.png',
  'TRE': '/species/trevally.png'
};

// Fallback SVG for species without images
const FishPlaceholder = ({ className }) => (
  <svg className={className} viewBox="0 0 100 60" fill="currentColor">
    <path d="M85 30c-5-15-25-25-45-25C20 5 5 15 5 30s15 25 35 25c20 0 40-10 45-25zm-60 0c-2.5 0-4.5-2-4.5-4.5s2-4.5 4.5-4.5 4.5 2 4.5 4.5-2 4.5-4.5 4.5z"/>
    <path d="M95 30l-10-15v30z"/>
  </svg>
);

const SpeciesSelector = ({ isOpen, onClose, onSelect, selectedSpecies }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [imageErrors, setImageErrors] = useState({});

  // Get unique categories
  const categories = useMemo(() => {
    const cats = [...new Set(FAO_SPECIES.map(s => s.category))];
    return ['all', ...cats.sort()];
  }, []);

  // Filter species based on search and category
  const filteredSpecies = useMemo(() => {
    let results = searchSpecies(searchQuery);
    if (selectedCategory !== 'all') {
      results = results.filter(s => s.category === selectedCategory);
    }
    return results;
  }, [searchQuery, selectedCategory]);

  // Handle image error
  const handleImageError = (code) => {
    setImageErrors(prev => ({ ...prev, [code]: true }));
  };

  // Get image source for species
  const getImageSrc = (species) => {
    if (imageErrors[species.code]) return null;
    return SPECIES_IMAGES[species.code] || species.image;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center">
      <div className="bg-slate-900 w-full sm:w-[500px] sm:max-h-[85vh] max-h-[90vh] rounded-t-3xl sm:rounded-2xl flex flex-col overflow-hidden border border-slate-700">
        {/* Header */}
        <div className="p-4 border-b border-slate-700 flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Fish className="w-6 h-6 text-cyan-400" />
              Select Species
            </h2>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-slate-800 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>

          {/* Search */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, code, or scientific name..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Category Filter */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === cat
                    ? 'bg-cyan-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                {cat === 'all' ? 'All Species' : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Species Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-2 gap-3">
            {filteredSpecies.map(species => {
              const isSelected = selectedSpecies?.code === species.code;
              const imgSrc = getImageSrc(species);
              
              return (
                <button
                  key={species.code}
                  onClick={() => {
                    onSelect(species);
                    onClose();
                  }}
                  className={`relative p-3 rounded-xl border-2 transition-all text-left ${
                    isSelected
                      ? 'border-cyan-500 bg-cyan-500/10'
                      : 'border-slate-700 bg-slate-800/50 hover:border-slate-600 hover:bg-slate-800'
                  }`}
                >
                  {isSelected && (
                    <div className="absolute top-2 right-2 bg-cyan-500 rounded-full p-1">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}
                  
                  {/* Species Image */}
                  <div className="w-full h-20 mb-2 bg-white rounded-lg flex items-center justify-center overflow-hidden">
                    {imgSrc ? (
                      <img
                        src={imgSrc}
                        alt={species.name}
                        className="w-full h-full object-contain p-1"
                        onError={() => handleImageError(species.code)}
                      />
                    ) : (
                      <FishPlaceholder className="w-16 h-12 text-slate-300" />
                    )}
                  </div>
                  
                  {/* Species Info */}
                  <div>
                    <div className="flex items-center gap-1 mb-0.5">
                      <span className="text-cyan-400 font-mono text-xs font-bold">{species.code}</span>
                    </div>
                    <p className="text-white font-medium text-sm leading-tight">
                      {species.name}
                    </p>
                    <p className="text-slate-500 text-xs truncate" title={species.scientificName}>
                      ({species.scientificName})
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {filteredSpecies.length === 0 && (
            <div className="text-center py-12">
              <Fish className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">No species found</p>
              <p className="text-slate-500 text-sm">Try a different search term</p>
            </div>
          )}
        </div>

        {/* Selected Species Display */}
        {selectedSpecies && (
          <div className="p-4 border-t border-slate-700 bg-slate-800/50 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center overflow-hidden">
                {getImageSrc(selectedSpecies) ? (
                  <img
                    src={getImageSrc(selectedSpecies)}
                    alt={selectedSpecies.name}
                    className="w-full h-full object-contain p-1"
                  />
                ) : (
                  <FishPlaceholder className="w-8 h-6 text-slate-400" />
                )}
              </div>
              <div className="flex-1">
                <p className="text-white font-medium">
                  <span className="text-cyan-400 font-mono">{selectedSpecies.code}</span> - {selectedSpecies.name}
                </p>
                <p className="text-slate-400 text-sm">{selectedSpecies.scientificName}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-500" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SpeciesSelector;

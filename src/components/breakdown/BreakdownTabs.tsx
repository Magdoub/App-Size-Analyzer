/**
 * Breakdown Tabs Component
 *
 * Tab navigation for filtering breakdown view
 */

import type { Platform } from '../../types/analysis';

export interface BreakdownTabsProps {
  activeTab: 'all' | 'frameworks' | 'assets' | 'localizations';
  onTabChange: (tab: 'all' | 'frameworks' | 'assets' | 'localizations') => void;
  platform: Platform;
}

export function BreakdownTabs({ activeTab, onTabChange, platform }: BreakdownTabsProps) {
  const tabs = [
    { id: 'all' as const, label: 'All Files', icon: '📁' },
    {
      id: 'frameworks' as const,
      label: platform === 'iOS' ? 'Frameworks' : 'Libraries',
      icon: '📦',
    },
    { id: 'assets' as const, label: 'Assets', icon: '🖼️' },
    { id: 'localizations' as const, label: 'Localizations', icon: '🌐' },
  ];

  return (
    <div className="bg-white border-b border-gray-200">
      <div className="px-6">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`
                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                transition-colors duration-200
                ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}

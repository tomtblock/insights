'use client';

import { useState } from 'react';
import { Save, Key, Bell, Database, Palette, Shield, RefreshCw } from 'lucide-react';
import clsx from 'clsx';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('api');
  const [saved, setSaved] = useState(false);

  // Form states
  const [finfeedApiKey, setFinfeedApiKey] = useState('a5d8925b-027f-42c0-a000-421699c8c86d');
  const [refreshInterval, setRefreshInterval] = useState('5');
  const [notifications, setNotifications] = useState({
    opportunities: true,
    alerts: true,
    healthWarnings: true,
  });

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const tabs = [
    { id: 'api', label: 'API Keys', icon: Key },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'data', label: 'Data Settings', icon: Database },
    { id: 'appearance', label: 'Appearance', icon: Palette },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-zinc-500 mt-1">Configure platform preferences and integrations</p>
        </div>
        <button
          onClick={handleSave}
          className={clsx(
            'flex items-center gap-2 px-4 py-2 rounded-lg transition-colors font-medium',
            saved 
              ? 'bg-emerald-600 text-white'
              : 'bg-zinc-800 hover:bg-zinc-700'
          )}
        >
          {saved ? (
            <>
              <Shield className="w-4 h-4" />
              Saved!
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Save Changes
            </>
          )}
        </button>
      </div>

      <div className="flex gap-6">
        {/* Sidebar */}
        <div className="w-48 space-y-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={clsx(
                  'w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-left',
                  activeTab === tab.id
                    ? 'bg-emerald-500/10 text-emerald-400'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
                )}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1">
          {activeTab === 'api' && (
            <div className="card p-6 space-y-6">
              <div>
                <h3 className="font-semibold mb-4">API Configuration</h3>
                <p className="text-sm text-zinc-400 mb-6">
                  Configure API keys for external data sources
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">FinFeed API Key</label>
                  <input
                    type="password"
                    value={finfeedApiKey}
                    onChange={(e) => setFinfeedApiKey(e.target.value)}
                    className="w-full px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm focus:outline-none focus:border-emerald-500"
                  />
                  <p className="text-xs text-zinc-500 mt-1">
                    Used for prediction markets and stocks data
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Polymarket API (Optional)</label>
                  <input
                    type="password"
                    placeholder="Enter API key..."
                    className="w-full px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Kalshi API (Optional)</label>
                  <input
                    type="password"
                    placeholder="Enter API key..."
                    className="w-full px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="card p-6 space-y-6">
              <div>
                <h3 className="font-semibold mb-4">Notification Preferences</h3>
                <p className="text-sm text-zinc-400 mb-6">
                  Configure which events trigger notifications
                </p>
              </div>

              <div className="space-y-4">
                <label className="flex items-center justify-between p-4 bg-zinc-900 rounded-lg cursor-pointer">
                  <div>
                    <p className="font-medium">New Opportunities</p>
                    <p className="text-sm text-zinc-500">Get notified when new arb opportunities are detected</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifications.opportunities}
                    onChange={(e) => setNotifications({ ...notifications, opportunities: e.target.checked })}
                    className="w-5 h-5 rounded border-zinc-700 bg-zinc-800 text-emerald-500 focus:ring-emerald-500"
                  />
                </label>

                <label className="flex items-center justify-between p-4 bg-zinc-900 rounded-lg cursor-pointer">
                  <div>
                    <p className="font-medium">Rule Alerts</p>
                    <p className="text-sm text-zinc-500">Get notified when rules are triggered</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifications.alerts}
                    onChange={(e) => setNotifications({ ...notifications, alerts: e.target.checked })}
                    className="w-5 h-5 rounded border-zinc-700 bg-zinc-800 text-emerald-500 focus:ring-emerald-500"
                  />
                </label>

                <label className="flex items-center justify-between p-4 bg-zinc-900 rounded-lg cursor-pointer">
                  <div>
                    <p className="font-medium">Health Warnings</p>
                    <p className="text-sm text-zinc-500">Get notified about system health issues</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifications.healthWarnings}
                    onChange={(e) => setNotifications({ ...notifications, healthWarnings: e.target.checked })}
                    className="w-5 h-5 rounded border-zinc-700 bg-zinc-800 text-emerald-500 focus:ring-emerald-500"
                  />
                </label>
              </div>
            </div>
          )}

          {activeTab === 'data' && (
            <div className="card p-6 space-y-6">
              <div>
                <h3 className="font-semibold mb-4">Data Settings</h3>
                <p className="text-sm text-zinc-400 mb-6">
                  Configure data refresh and storage preferences
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Data Refresh Interval</label>
                  <select
                    value={refreshInterval}
                    onChange={(e) => setRefreshInterval(e.target.value)}
                    className="w-full px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm focus:outline-none focus:border-emerald-500"
                  >
                    <option value="1">1 second</option>
                    <option value="5">5 seconds</option>
                    <option value="10">10 seconds</option>
                    <option value="30">30 seconds</option>
                    <option value="60">1 minute</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Historical Data Retention</label>
                  <select className="w-full px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm focus:outline-none focus:border-emerald-500">
                    <option value="7">7 days</option>
                    <option value="30">30 days</option>
                    <option value="90">90 days</option>
                    <option value="365">1 year</option>
                  </select>
                </div>

                <div className="pt-4 border-t border-zinc-800">
                  <button className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors text-sm">
                    <RefreshCw className="w-4 h-4" />
                    Clear Cache
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'appearance' && (
            <div className="card p-6 space-y-6">
              <div>
                <h3 className="font-semibold mb-4">Appearance</h3>
                <p className="text-sm text-zinc-400 mb-6">
                  Customize the look and feel of the platform
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Theme</label>
                  <div className="flex gap-3">
                    <button className="flex-1 p-4 bg-zinc-900 border-2 border-emerald-500 rounded-lg text-center">
                      <div className="w-full h-8 bg-zinc-950 rounded mb-2" />
                      <span className="text-sm">Dark</span>
                    </button>
                    <button className="flex-1 p-4 bg-zinc-900 border border-zinc-700 rounded-lg text-center opacity-50 cursor-not-allowed">
                      <div className="w-full h-8 bg-zinc-200 rounded mb-2" />
                      <span className="text-sm">Light (Coming Soon)</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Accent Color</label>
                  <div className="flex gap-2">
                    <button className="w-8 h-8 rounded-full bg-emerald-500 ring-2 ring-emerald-500 ring-offset-2 ring-offset-zinc-900" />
                    <button className="w-8 h-8 rounded-full bg-blue-500" />
                    <button className="w-8 h-8 rounded-full bg-purple-500" />
                    <button className="w-8 h-8 rounded-full bg-amber-500" />
                    <button className="w-8 h-8 rounded-full bg-red-500" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Font Size</label>
                  <select className="w-full px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm focus:outline-none focus:border-emerald-500">
                    <option value="sm">Small</option>
                    <option value="md">Medium (Default)</option>
                    <option value="lg">Large</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


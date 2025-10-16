/**
 * Usage Display Component
 *
 * Displays usage statistics and progress bars
 *
 * @module components/billing/UsageDisplay
 */

'use client';

import React from 'react';
import { useUsage, getUsageColor, formatUsageDisplay } from '@/hooks/useUsage';

interface UsageDisplayProps {
  className?: string;
}

/**
 * Display current usage statistics
 *
 * @example
 * ```tsx
 * <UsageDisplay />
 * ```
 */
export function UsageDisplay({ className = '' }: UsageDisplayProps) {
  const { usage, isLoading, error } = useUsage();

  if (isLoading) {
    return <div className={className}>Loading usage...</div>;
  }

  if (error) {
    return <div className={`text-red-600 ${className}`}>Error loading usage: {error.message}</div>;
  }

  if (!usage) {
    return null;
  }

  const reports = usage.usage.report_generated;
  const transcriptions = usage.usage.transcription;
  const exports = usage.usage.export;

  return (
    <div className={`space-y-4 ${className}`}>
      <div>
        <h3 className="text-lg font-semibold mb-4">Usage Statistics</h3>
        <p className="text-sm text-gray-600 mb-2">
          Plan: <span className="font-medium">{usage.subscription.plan_name}</span>
        </p>
        <p className="text-sm text-gray-600 mb-4">
          Billing period ends in {usage.subscription.days_remaining} days
        </p>
      </div>

      {/* Reports */}
      <UsageItem label="Reports Generated" stats={reports} />

      {/* Transcriptions */}
      <UsageItem label="Transcriptions" stats={transcriptions} />

      {/* Exports */}
      <UsageItem label="Exports" stats={exports} />
    </div>
  );
}

interface UsageItemProps {
  label: string;
  stats: {
    current: number;
    limit: number;
    percentage: number;
    warningThreshold: boolean;
  };
}

function UsageItem({ label, stats }: UsageItemProps) {
  const color = getUsageColor(stats.percentage);
  const barColor = {
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    red: 'bg-red-500',
  }[color];

  return (
    <div>
      <div className="flex justify-between mb-1">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-sm text-gray-600">{formatUsageDisplay(stats)}</span>
      </div>

      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`${barColor} h-2 rounded-full transition-all`}
          style={{ width: `${Math.min(100, stats.percentage)}%` }}
        />
      </div>

      {stats.warningThreshold && (
        <p className="text-xs text-yellow-600 mt-1">⚠️ Approaching limit</p>
      )}
    </div>
  );
}

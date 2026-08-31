import React, { useEffect, useState, useCallback } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Menu, RefreshCw, TrendingDown, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { getInventoryOverview, getInventoryForecastTrend } from '../api/inventoryApi';

const STATUS_META = {
  'Critical Stockout Risk (Reorder Now)': { className: 'status-critical', Icon: AlertTriangle },
  'Low Stock (Prepare PO)': { className: 'status-low', Icon: TrendingDown },
  'Critical Stockout Risk': { className: 'status-critical', Icon: AlertTriangle },
  'Low Stock': { className: 'status-low', Icon: TrendingDown },
  Stable: { className: 'status-stable', Icon: CheckCircle2 },
};

function formatBufferMargin(estimatedDaysRemaining, leadTimeBufferDays) {
  if (typeof estimatedDaysRemaining !== 'number' || typeof leadTimeBufferDays !== 'number') {
    return 'N/A';
  }

  const margin = estimatedDaysRemaining - leadTimeBufferDays;
  if (margin === 0) {
    return 'At buffer';
  }

  return `${margin > 0 ? '+' : ''}${margin}d`;
}

export default function InventoryDashboard({ onOpenNav }) {
  const [forecasts, setForecasts] = useState([]);
  const [productsNeedingAttention, setProductsNeedingAttention] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [trend, setTrend] = useState([]);
  const [isLoadingSummary, setIsLoadingSummary] = useState(true);
  const [isLoadingTrend, setIsLoadingTrend] = useState(false);
  const [error, setError] = useState('');

  const loadOverview = useCallback(async () => {
    setIsLoadingSummary(true);
    setError('');
    try {
      const data = await getInventoryOverview();
      setForecasts(data.forecasts || []);
      setProductsNeedingAttention(data.products_needing_attention || []);
      if (data.forecasts?.length) {
        setSelectedItem((current) => current || data.forecasts[0].item_name);
      }
    } catch (err) {
      setError(err.message || 'Failed to load inventory overview.');
    } finally {
      setIsLoadingSummary(false);
    }
  }, []);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  useEffect(() => {
    if (!selectedItem) {
      return;
    }
    let cancelled = false;
    setIsLoadingTrend(true);
    getInventoryForecastTrend(selectedItem, 30)
      .then((data) => {
        if (!cancelled) {
          setTrend(Array.isArray(data) ? data : []);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message || 'Failed to load forecast trend.');
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoadingTrend(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [selectedItem]);

  const selectedForecast = forecasts.find((f) => f.item_name === selectedItem);

  return (
    <div className="inventory-workspace">
      <header className="chat-header-bar inventory-header-bar">
        <div className="header-title-wrapper">
          <div className="header-brandline">
            <button
              type="button"
              className="mobile-nav-toggle-btn"
              onClick={onOpenNav}
              aria-label="Open navigation"
            >
              <Menu size={18} />
            </button>
            <h1>Inventory Forecast</h1>
          </div>
          <p>Lead-time-aware stockout projections (60 days transit + 15 days safety stock).</p>
        </div>
        <button type="button" className="inventory-refresh-btn" onClick={loadOverview} disabled={isLoadingSummary}>
          <RefreshCw size={15} className={isLoadingSummary ? 'spin' : ''} />
          <span>Refresh</span>
        </button>
      </header>

      {error && (
        <div className="chat-status-wrap">
          <div className="status-banner status-error">
            <span>{error}</span>
            <button onClick={() => setError('')} className="status-close-btn">&times;</button>
          </div>
        </div>
      )}

      <div className="inventory-panel-shell">
        <div className="inventory-product-grid">
          {isLoadingSummary && forecasts.length === 0 && (
            <p className="inventory-empty-state">Loading product forecasts...</p>
          )}
          {!isLoadingSummary && forecasts.length === 0 && (
            <p className="inventory-empty-state">No inventory history found yet.</p>
          )}
          {forecasts.map((forecast) => {
            const meta = STATUS_META[forecast.status] || STATUS_META.Stable;
            const StatusIcon = meta.Icon;
            const needsAttention = productsNeedingAttention.includes(forecast.item_name);
            return (
              <button
                type="button"
                key={forecast.item_name}
                className={`inventory-product-card ${meta.className} ${
                  selectedItem === forecast.item_name ? 'active' : ''
                }`}
                onClick={() => setSelectedItem(forecast.item_name)}
              >
                <div className="inventory-product-card-header">
                  <span className="inventory-product-name">{forecast.item_name}</span>
                  <span className={`inventory-status-badge ${meta.className}`}>
                    <StatusIcon size={12} />
                    {forecast.status}
                  </span>
                </div>
                <div className="inventory-product-stats">
                  <div>
                    <span className="inventory-stat-value">{forecast.current_stock}</span>
                    <span className="inventory-stat-label">Current Stock</span>
                  </div>
                  <div>
                    <span className="inventory-stat-value">{forecast.estimated_days_remaining}d</span>
                    <span className="inventory-stat-label">Runway</span>
                  </div>
                  <div>
                    <span className="inventory-stat-value">
                      {formatBufferMargin(
                        forecast.estimated_days_remaining,
                        forecast.lead_time_buffer_days
                      )}
                    </span>
                    <span className="inventory-stat-label">Vs 75d Buffer</span>
                  </div>
                </div>
                {needsAttention && (
                  <p className="inventory-alert-text">
                    Reorder by <strong>{forecast.recommended_reorder_date}</strong> to avoid a stockout
                    around <strong>{forecast.projected_stockout_date}</strong>.
                  </p>
                )}
              </button>
            );
          })}
        </div>

        <div className="inventory-chart-card">
          <div className="inventory-chart-header">
            <h3>{selectedItem || 'Select a product'}</h3>
            {selectedForecast && (
              <span className={`inventory-status-badge ${(STATUS_META[selectedForecast.status] || STATUS_META.Stable).className}`}>
                {selectedForecast.status}
              </span>
            )}
          </div>
          {isLoadingTrend ? (
            <p className="inventory-empty-state">Loading trend...</p>
          ) : trend.length > 0 ? (
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={trend}>
                <defs>
                  <linearGradient id="stockGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} minTickGap={24} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="predicted_stock"
                  stroke="#7c3aed"
                  fill="url(#stockGradient)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <p className="inventory-empty-state">No trend data available for this product.</p>
          )}
        </div>
      </div>
    </div>
  );
}

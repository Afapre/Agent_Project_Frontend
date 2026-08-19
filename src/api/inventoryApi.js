import { request } from './httpClient';

/**
 * Fetches the inventory forecast summary metrics for a specific item.
 * Maps to the backend: /api/v1/inventory/forecast/{itemName}
 */
export async function getInventoryForecastSummary(itemName) {
  return request(`/api/v1/inventory/forecast/${encodeURIComponent(itemName)}`);
}

/**
 * Fetches the daily projected stock timeline for dashboard charts.
 * Maps to the backend: /api/v1/inventory/forecast/{itemName}/trend
 */
export async function getInventoryForecastTrend(itemName, daysOut = 30) {
  return request(`/api/v1/inventory/forecast/${encodeURIComponent(itemName)}/trend?days_out=${daysOut}`);
}

/**
 * Fetches forecast summaries for every tracked product plus the list of
 * products needing attention. Maps to the backend: /api/v1/inventory/summary
 */
export async function getInventoryOverview() {
  return request('/api/v1/inventory/summary');
}

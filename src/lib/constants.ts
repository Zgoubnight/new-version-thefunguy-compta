import { SaleChannel } from '@shared/types';
// For Tailwind CSS class names used in Badges
export const CHANNEL_BADGE_COLORS: Record<SaleChannel, string> = {
  pharmacy: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  amazon: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  site: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
  reseller: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  cse: 'bg-gray-800 text-gray-100 dark:bg-gray-200 dark:text-gray-800',
  influencer: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  unknown: 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
};
// For Recharts Pie Chart fills
export const CHANNEL_CHART_COLORS: Record<SaleChannel, string> = {
  pharmacy: 'hsl(221, 83%, 53%)',   // blue-500
  amazon: 'hsl(0, 72%, 51%)',     // red-600
  site: 'hsl(336, 80%, 50%)',     // pink-600
  reseller: 'hsl(35, 92%, 50%)',  // orange-500
  cse: 'hsl(222, 47%, 11%)',      // gray-900
  influencer: 'hsl(262, 80%, 58%)', // purple-600
  unknown: 'hsl(215, 20%, 65%)',   // gray-500
};
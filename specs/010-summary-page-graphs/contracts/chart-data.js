/**
 * Contract: Chart Data Transformation Functions
 *
 * This contract defines the function signatures for transforming aggregated data
 * into ECharts-compatible option objects. Each function is a pure builder that
 * takes data and returns an ECharts configuration object.
 *
 * All builders follow the pattern:
 * - Accept data + formatting options
 * - Return ECharts option object (ready for v-chart :option prop)
 * - No side effects (pure functions)
 *
 * Location: src/utils/chart-options.js
 */

/**
 * Build ECharts options for vertical bar chart
 *
 * @param {BarChartData} data - Chart data with categories and series
 * @param {string} title - Chart title
 * @param {Function} valueFormatter - Format function for Y-axis values (e.g., formatBytes)
 * @param {Object} [options] - Additional options
 * @param {boolean} [options.showLegend=true] - Show legend
 * @param {string} [options.legendPosition='top'] - Legend position
 * @returns {Object} ECharts option object
 *
 * @example
 * const data = {
 *   categories: ["Frameworks", "Executables", "Resources"],
 *   series: [
 *     {
 *       name: "Install Size",
 *       data: [45000000, 8000000, 12000000],
 *       colors: ["#3b82f6", "#ef4444", "#06b6d4"]
 *     }
 *   ]
 * };
 * const options = buildVerticalBarChartOptions(
 *   data,
 *   "File Type Distribution (Size)",
 *   formatBytes,
 *   { showLegend: true }
 * );
 */
export function buildVerticalBarChartOptions(data, title, valueFormatter, options = {}) {}

/**
 * BarChartData structure
 * @typedef {Object} BarChartData
 * @property {string[]} categories - X-axis category labels
 * @property {BarChartSeries[]} series - One or more data series
 */

/**
 * BarChartSeries structure
 * @typedef {Object} BarChartSeries
 * @property {string} name - Series name (appears in legend)
 * @property {number[]} data - Y-axis values (aligned with categories)
 * @property {string[]} colors - Bar colors (aligned with categories)
 */

/**
 * Build ECharts options for grouped/stacked vertical bar chart (iOS download vs install)
 *
 * @param {GroupedBarChartData} data - Chart data with multiple series
 * @param {string} title - Chart title
 * @param {Function} valueFormatter - Format function for Y-axis values
 * @param {Object} [options] - Additional options
 * @param {boolean} [options.stacked=false] - Stack bars instead of grouping
 * @returns {Object} ECharts option object
 *
 * @example
 * const data = {
 *   categories: ["Frameworks", "Executables"],
 *   series: [
 *     {
 *       name: "Install Size",
 *       data: [45000000, 8000000],
 *       color: "#3b82f6"
 *     },
 *     {
 *       name: "Download Size",
 *       data: [12000000, 6000000],
 *       color: "#10b981"
 *     }
 *   ]
 * };
 * const options = buildGroupedBarChartOptions(data, "Size Comparison", formatBytes);
 */
export function buildGroupedBarChartOptions(data, title, valueFormatter, options = {}) {}

/**
 * GroupedBarChartData structure
 * @typedef {Object} GroupedBarChartData
 * @property {string[]} categories - X-axis category labels
 * @property {GroupedBarChartSeries[]} series - Multiple series for grouping/stacking
 */

/**
 * GroupedBarChartSeries structure
 * @typedef {Object} GroupedBarChartSeries
 * @property {string} name - Series name
 * @property {number[]} data - Values per category
 * @property {string} color - Single color for this series (all bars same color)
 */

/**
 * Build ECharts options for horizontal bar chart
 *
 * @param {HorizontalBarChartData} data - Chart data with items
 * @param {string} title - Chart title
 * @param {Function} valueFormatter - Format function for X-axis values
 * @param {Object} [options] - Additional options
 * @param {boolean} [options.inverse=true] - Show largest at top
 * @returns {Object} ECharts option object
 *
 * @example
 * const data = {
 *   items: [
 *     {
 *       name: "ReactNative.framework/ReactNative",
 *       value: 12000000,
 *       color: "#3b82f6",
 *       tooltip: "Frameworks/ReactNative.framework (12 MB)"
 *     },
 *     // ... more items
 *   ]
 * };
 * const options = buildHorizontalBarChartOptions(
 *   data,
 *   "Top 10 Largest Files",
 *   formatBytes
 * );
 */
export function buildHorizontalBarChartOptions(data, title, valueFormatter, options = {}) {}

/**
 * HorizontalBarChartData structure
 * @typedef {Object} HorizontalBarChartData
 * @property {HorizontalBarChartItem[]} items - Array of items to display
 */

/**
 * HorizontalBarChartItem structure
 * @typedef {Object} HorizontalBarChartItem
 * @property {string} name - Item label (Y-axis)
 * @property {number} value - Item value (X-axis)
 * @property {string} color - Bar color
 * @property {string} [tooltip] - Optional custom tooltip text
 */

/**
 * Build ECharts options for stacked bar chart (compression efficiency)
 *
 * @param {StackedBarChartData} data - Chart data with stacked series
 * @param {string} title - Chart title
 * @param {Function} valueFormatter - Format function for Y-axis values
 * @param {Object} [options] - Additional options
 * @param {string} [options.stackId='total'] - Stack group ID
 * @returns {Object} ECharts option object
 *
 * @example
 * const data = {
 *   categories: ["Frameworks", "Executables"],
 *   series: [
 *     {
 *       name: "Compressed Size",
 *       data: [12000000, 6000000],
 *       stack: "total",
 *       color: "#10b981"
 *     },
 *     {
 *       name: "Removed by Compression",
 *       data: [33000000, 2000000],
 *       stack: "total",
 *       color: "#94a3b8"
 *     }
 *   ]
 * };
 * const options = buildStackedBarChartOptions(
 *   data,
 *   "Compression Efficiency",
 *   formatBytes
 * );
 */
export function buildStackedBarChartOptions(data, title, valueFormatter, options = {}) {}

/**
 * StackedBarChartData structure
 * @typedef {Object} StackedBarChartData
 * @property {string[]} categories - X-axis category labels
 * @property {StackedBarChartSeries[]} series - Series that stack on top of each other
 */

/**
 * StackedBarChartSeries structure
 * @typedef {Object} StackedBarChartSeries
 * @property {string} name - Series name (appears in legend)
 * @property {number[]} data - Values per category
 * @property {string} stack - Stack group ID (same value = stacked together)
 * @property {string} color - Series color
 */

/**
 * Build common tooltip configuration
 *
 * @param {Function} valueFormatter - Format function for values
 * @param {Object} [options] - Tooltip options
 * @param {string} [options.trigger='axis'] - Tooltip trigger type
 * @param {string} [options.axisPointerType='shadow'] - Axis pointer type
 * @returns {Object} ECharts tooltip configuration
 *
 * @example
 * const tooltip = buildTooltipConfig(formatBytes, { trigger: 'axis' });
 */
export function buildTooltipConfig(valueFormatter, options = {}) {}

/**
 * Build common grid configuration (chart area padding)
 *
 * @param {Object} [options] - Grid options
 * @param {string|number} [options.left='10%'] - Left padding
 * @param {string|number} [options.right='10%'] - Right padding
 * @param {string|number} [options.top=60] - Top padding
 * @param {string|number} [options.bottom=30] - Bottom padding
 * @returns {Object} ECharts grid configuration
 *
 * @example
 * const grid = buildGridConfig({ left: '20%', right: '10%' });
 */
export function buildGridConfig(options = {}) {}

/**
 * Build common legend configuration
 *
 * @param {Object} [options] - Legend options
 * @param {string} [options.position='top'] - Legend position
 * @param {string} [options.align='center'] - Legend alignment
 * @param {number} [options.top=20] - Top offset
 * @returns {Object} ECharts legend configuration
 *
 * @example
 * const legend = buildLegendConfig({ position: 'bottom', align: 'left' });
 */
export function buildLegendConfig(options = {}) {}

/**
 * Build title configuration
 *
 * @param {string} text - Title text
 * @param {Object} [options] - Title options
 * @param {string} [options.position='center'] - Title position
 * @param {number} [options.top=20] - Top offset
 * @param {Object} [options.textStyle] - Text style overrides
 * @returns {Object} ECharts title configuration
 *
 * @example
 * const title = buildTitleConfig("File Type Distribution", { position: 'left' });
 */
export function buildTitleConfig(text, options = {}) {}

/**
 * Build responsive configuration (auto-resize behavior)
 *
 * @returns {Object} ECharts responsive configuration
 *
 * @example
 * const responsive = buildResponsiveConfig();
 */
export function buildResponsiveConfig() {}

/**
 * Transform CategoryAggregation[] to BarChartData
 *
 * @param {CategoryAggregation[]} categories - Aggregated category data
 * @param {string} metric - 'size' or 'count' (which metric to chart)
 * @param {boolean} includeCompressed - Include compressed size series (iOS only)
 * @returns {BarChartData} Chart-ready data structure
 *
 * @example
 * const chartData = transformCategoriesToBarChart(
 *   categoryAggregations,
 *   'size',
 *   true  // Include compressed size for iOS
 * );
 */
export function transformCategoriesToBarChart(categories, metric, includeCompressed = false) {}

/**
 * Transform ComponentAggregation to BarChartData
 *
 * @param {ComponentAggregation} components - Internal vs external data
 * @param {string} metric - 'size' or 'count'
 * @param {boolean} includeCompressed - Include compressed size series (iOS only)
 * @returns {BarChartData} Chart-ready data structure
 *
 * @example
 * const chartData = transformComponentsToBarChart(componentAggregation, 'size', false);
 */
export function transformComponentsToBarChart(components, metric, includeCompressed = false) {}

/**
 * Transform FileEntry[] to HorizontalBarChartData
 *
 * @param {FileEntry[]} files - Top files array
 * @param {Function} valueFormatter - Format function for tooltips
 * @returns {HorizontalBarChartData} Chart-ready data structure
 *
 * @example
 * const chartData = transformFilesToHorizontalBarChart(topFiles, formatBytes);
 */
export function transformFilesToHorizontalBarChart(files, valueFormatter) {}

/**
 * Transform CompressionAnalysis[] to StackedBarChartData
 *
 * @param {CompressionAnalysis[]} compressionData - Compression data per category
 * @returns {StackedBarChartData} Chart-ready data structure
 *
 * @example
 * const chartData = transformCompressionToStackedBarChart(compressionAnalyses);
 */
export function transformCompressionToStackedBarChart(compressionData) {}

/**
 * Transform LocalizationEntry[] to BarChartData
 *
 * @param {LocalizationEntry[]} localizations - Localization data
 * @param {string} metric - 'size' or 'count'
 * @returns {BarChartData} Chart-ready data structure
 *
 * @example
 * const chartData = transformLocalizationsToBarChart(localizationEntries, 'size');
 */
export function transformLocalizationsToBarChart(localizations, metric) {}

/**
 * Transform ArchitectureEntry[] to BarChartData
 *
 * @param {ArchitectureEntry[]} architectures - Architecture data
 * @param {string} metric - 'size' or 'count'
 * @returns {BarChartData} Chart-ready data structure
 *
 * @example
 * const chartData = transformArchitecturesToBarChart(architectureEntries, 'size');
 */
export function transformArchitecturesToBarChart(architectures, metric) {}

/**
 * Transform AssetTypeAggregation[] to BarChartData
 *
 * @param {AssetTypeAggregation[]} assets - Asset type data
 * @param {string} metric - 'size' or 'count'
 * @param {boolean} includeCompressed - Include compressed size series (iOS only)
 * @returns {BarChartData} Chart-ready data structure
 *
 * @example
 * const chartData = transformAssetsToBarChart(assetAggregations, 'size', true);
 */
export function transformAssetsToBarChart(assets, metric, includeCompressed = false) {}

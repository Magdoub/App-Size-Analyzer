/**
 * ECharts Option Builders for Summary Page Charts
 *
 * This module provides reusable functions for building ECharts configuration objects.
 * All functions are pure (no side effects) and return complete ECharts option objects.
 *
 * @module chart-options
 */

import { formatBytes, formatNumber } from './formatters.js';

/**
 * Build tooltip configuration
 * @param {Function} valueFormatter - Function to format values (e.g., formatBytes)
 * @param {Object} options - Additional options
 * @returns {Object} Tooltip configuration
 */
export function buildTooltipConfig(valueFormatter, options = {}) {
  return {
    trigger: 'axis',
    axisPointer: {
      type: 'shadow'
    },
    formatter: options.formatter || ((params) => {
      if (!Array.isArray(params)) params = [params];
      let result = `<strong>${params[0].name}</strong><br/>`;
      params.forEach(param => {
        const marker = param.marker || '';
        const value = valueFormatter(param.value);
        result += `${marker} ${param.seriesName}: ${value}<br/>`;
      });
      return result;
    }),
    ...options
  };
}

/**
 * Build grid configuration
 * @param {Object} options - Grid customization options
 * @returns {Object} Grid configuration
 */
export function buildGridConfig(options = {}) {
  return {
    left: options.left || '10%',
    right: options.right || '10%',
    top: options.top || 80,
    bottom: options.bottom || 40,
    containLabel: true,
    ...options
  };
}

/**
 * Build legend configuration
 * @param {Object} options - Legend customization options
 * @returns {Object} Legend configuration
 */
export function buildLegendConfig(options = {}) {
  return {
    top: options.top || 10,
    left: options.left || 'center',
    ...options
  };
}

/**
 * Build title configuration
 * @param {string} text - Chart title
 * @param {Object} options - Title customization options
 * @returns {Object} Title configuration
 */
export function buildTitleConfig(text, options = {}) {
  return {
    text,
    left: options.left || 'center',
    top: options.top || 20,
    textStyle: {
      fontSize: options.fontSize || 16,
      fontWeight: options.fontWeight || 'bold',
      ...options.textStyle
    },
    ...options
  };
}

/**
 * Build vertical bar chart options (single or multiple series)
 * @param {Object} data - Chart data {categories: string[], series: Array<{name, data, colors?}>}
 * @param {string} title - Chart title
 * @param {Function} valueFormatter - Format function for values
 * @param {Object} options - Additional options
 * @returns {Object} Complete ECharts option object
 */
export function buildVerticalBarChartOptions(data, title, valueFormatter, options = {}) {
  const hasSingleSeries = data.series.length === 1;

  return {
    title: buildTitleConfig(title, options.title),
    tooltip: buildTooltipConfig(valueFormatter, options.tooltip),
    legend: hasSingleSeries ? {} : buildLegendConfig(options.legend),
    grid: buildGridConfig(options.grid),
    xAxis: {
      type: 'category',
      data: data.categories,
      axisLabel: {
        rotate: data.categories.length > 4 ? 45 : 0,
        interval: 0,
        fontSize: 11,
        margin: 10
      }
    },
    yAxis: {
      type: 'value',
      splitNumber: 4,
      axisLabel: {
        formatter: (v) => valueFormatter(v, 0)
      }
    },
    series: data.series.map((s, idx) => ({
      name: s.name,
      type: 'bar',
      data: s.data.map((value, i) => ({
        value,
        itemStyle: {
          color: s.colors ? s.colors[i] : undefined
        }
      })),
      ...options.seriesOptions
    }))
  };
}

/**
 * Build grouped bar chart options (multiple series side by side)
 * @param {Object} data - Chart data {categories: string[], series: Array<{name, data, colors?}>}
 * @param {string} title - Chart title
 * @param {Function} valueFormatter - Format function for values
 * @param {Object} options - Additional options
 * @returns {Object} Complete ECharts option object
 */
export function buildGroupedBarChartOptions(data, title, valueFormatter, options = {}) {
  return buildVerticalBarChartOptions(data, title, valueFormatter, {
    ...options,
    seriesOptions: {
      barGap: '10%',
      ...options.seriesOptions
    }
  });
}

/**
 * Build horizontal bar chart options
 * @param {Object} data - Chart data {items: Array<{name, value, color?, tooltip?}>}
 * @param {string} title - Chart title
 * @param {Function} valueFormatter - Format function for values
 * @param {Object} options - Additional options
 * @returns {Object} Complete ECharts option object
 */
export function buildHorizontalBarChartOptions(data, title, valueFormatter, options = {}) {
  return {
    title: buildTitleConfig(title, options.title),
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      },
      formatter: (params) => {
        const item = params[0];
        const customTooltip = data.items[item.dataIndex]?.tooltip;
        if (customTooltip) return customTooltip;
        return `${item.name}: ${valueFormatter(item.value)}`;
      }
    },
    grid: buildGridConfig({
      left: '30%',
      right: '10%',
      ...options.grid
    }),
    xAxis: {
      type: 'value',
      splitNumber: 3,
      axisLabel: {
        formatter: options.axisFormatter || ((v) => valueFormatter(v, 0))
      },
      min: 0
    },
    yAxis: {
      type: 'category',
      data: data.items.map(d => d.name),
      inverse: true,
      axisLabel: {
        formatter: (value) => {
          // Truncate long file names
          return value.length > 30 ? value.substring(0, 27) + '...' : value;
        }
      }
    },
    series: [{
      type: 'bar',
      data: data.items.map(d => ({
        value: d.value,
        itemStyle: {
          color: d.color
        }
      }))
    }]
  };
}

/**
 * Build stacked bar chart options
 * @param {Object} data - Chart data {categories: string[], series: Array<{name, data, stack, color}>}
 * @param {string} title - Chart title
 * @param {Function} valueFormatter - Format function for values
 * @param {Object} options - Additional options
 * @returns {Object} Complete ECharts option object
 */
export function buildStackedBarChartOptions(data, title, valueFormatter, options = {}) {
  return {
    title: buildTitleConfig(title, options.title),
    tooltip: buildTooltipConfig(valueFormatter, options.tooltip),
    legend: buildLegendConfig(options.legend),
    grid: buildGridConfig(options.grid),
    xAxis: {
      type: 'category',
      data: data.categories,
      axisLabel: {
        rotate: data.categories.length > 4 ? 45 : 0,
        interval: 0,
        fontSize: 11,
        margin: 10
      }
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        formatter: valueFormatter
      }
    },
    series: data.series.map(s => ({
      name: s.name,
      type: 'bar',
      stack: s.stack || 'total',
      data: s.data,
      itemStyle: {
        color: s.color
      },
      ...options.seriesOptions
    }))
  };
}

/**
 * Transform category aggregations to bar chart data
 * @param {Array<CategoryAggregation>} categories - Category aggregations
 * @param {string} metric - 'size' or 'count'
 * @param {boolean} includeCompressed - Include compressed size series (iOS only)
 * @returns {Object} Bar chart data structure
 */
export function transformCategoriesToBarChart(categories, metric = 'size', includeCompressed = false) {
  const validCategories = categories.filter(c => c[metric] > 0);

  // Sort so "Other" category is always last
  const sortedCategories = validCategories.sort((a, b) => {
    if (a.category === 'Other') return 1;
    if (b.category === 'Other') return -1;
    return 0;
  });

  const series = [{
    name: metric === 'size' ? 'Install Size' : 'File Count',
    data: sortedCategories.map(c => c[metric]),
    colors: sortedCategories.map(c => c.color)
  }];

  if (includeCompressed && metric === 'size') {
    series.push({
      name: 'Download Size',
      data: sortedCategories.map(c => c.compressedSize || 0),
      colors: sortedCategories.map(c => c.color)
    });
  }

  return {
    categories: sortedCategories.map(c => c.category),
    series
  };
}

/**
 * Transform component aggregations to bar chart data
 * @param {ComponentAggregation} components - Internal/external aggregation
 * @param {string} metric - 'size' or 'count'
 * @param {boolean} includeCompressed - Include compressed size series (iOS only)
 * @returns {Object} Bar chart data structure
 */
export function transformComponentsToBarChart(components, metric = 'size', includeCompressed = false) {
  const items = [components.internal, components.external];

  const series = [{
    name: metric === 'size' ? 'Install Size' : 'File Count',
    data: items.map(c => c[metric]),
    colors: items.map(c => c.color)
  }];

  if (includeCompressed && metric === 'size') {
    series.push({
      name: 'Download Size',
      data: items.map(c => c.compressedSize || 0),
      colors: items.map(c => c.color)
    });
  }

  return {
    categories: items.map(c => c.category),
    series
  };
}

/**
 * Transform file entries to horizontal bar chart data
 * @param {Array<FileEntry>} files - Top files array
 * @param {Function} valueFormatter - Format function for tooltip
 * @returns {Object} Horizontal bar chart data structure
 */
export function transformFilesToHorizontalBarChart(files, valueFormatter) {
  // Find duplicate names and add parent context
  const nameCounts = {};
  files.forEach(f => {
    nameCounts[f.name] = (nameCounts[f.name] || 0) + 1;
  });

  return {
    items: files.map(f => {
      let displayName = f.name;
      // Add parent directory for duplicate names
      if (nameCounts[f.name] > 1 && f.path) {
        const parts = f.path.split('/');
        if (parts.length >= 2) {
          displayName = `${parts[parts.length - 2]}/${f.name}`;
        }
      }
      return {
        name: displayName,
        value: f.size,
        color: f.color,
        tooltip: `<strong>${f.name}</strong><br/>` +
                 `Path: ${f.path}<br/>` +
                 `Size: ${valueFormatter(f.size)} (${f.percentage.toFixed(1)}%)`
      };
    })
  };
}

/**
 * Transform compression analysis to stacked bar chart data
 * @param {Array<CompressionAnalysis>} compressionData - Compression analysis per category
 * @returns {Object} Stacked bar chart data structure
 */
export function transformCompressionToStackedBarChart(compressionData) {
  const validData = compressionData.filter(c => c.uncompressed > 0);

  return {
    categories: validData.map(c => c.category),
    series: [
      {
        name: 'Compressed Size',
        data: validData.map(c => c.compressed),
        stack: 'total',
        color: '#10b981' // Green - good (small)
      },
      {
        name: 'Removed by Compression',
        data: validData.map(c => c.uncompressed - c.compressed),
        stack: 'total',
        color: '#94a3b8' // Gray - removed bytes
      }
    ]
  };
}

/**
 * Transform localization entries to bar chart data
 * @param {Array<LocalizationEntry>} localizations - Localization entries
 * @param {string} metric - 'size' or 'count'
 * @returns {Object} Bar chart data structure
 */
export function transformLocalizationsToBarChart(localizations, metric = 'size') {
  const validLocalizations = localizations.filter(l => l[metric] > 0);

  return {
    categories: validLocalizations.map(l => l.displayName || l.locale),
    series: [{
      name: metric === 'size' ? 'Size' : 'File Count',
      data: validLocalizations.map(l => l[metric]),
      colors: validLocalizations.map(l => l.color)
    }]
  };
}

/**
 * Transform architecture entries to bar chart data
 * @param {Array<ArchitectureEntry>} architectures - Architecture entries
 * @param {string} metric - 'size' or 'count'
 * @returns {Object} Bar chart data structure
 */
export function transformArchitecturesToBarChart(architectures, metric = 'size') {
  const validArchitectures = architectures.filter(a => a[metric] > 0);

  return {
    categories: validArchitectures.map(a => a.displayName || a.architecture),
    series: [{
      name: metric === 'size' ? 'Size' : 'File Count',
      data: validArchitectures.map(a => a[metric]),
      colors: validArchitectures.map(a => a.color)
    }]
  };
}

/**
 * Transform asset type aggregations to bar chart data
 * @param {Array<AssetTypeAggregation>} assets - Asset type aggregations
 * @param {string} metric - 'size' or 'count'
 * @param {boolean} includeCompressed - Include compressed size series (iOS only)
 * @returns {Object} Bar chart data structure
 */
export function transformAssetsToBarChart(assets, metric = 'size', includeCompressed = false) {
  const validAssets = assets.filter(a => a[metric] > 0);

  // Sort so "Other" assetType is always last
  const sortedAssets = validAssets.sort((a, b) => {
    if (a.assetType === 'Other') return 1;
    if (b.assetType === 'Other') return -1;
    return 0;
  });

  const series = [{
    name: metric === 'size' ? 'Install Size' : 'File Count',
    data: sortedAssets.map(a => a[metric]),
    colors: sortedAssets.map(a => a.color)
  }];

  if (includeCompressed && metric === 'size') {
    series.push({
      name: 'Download Size',
      data: sortedAssets.map(a => a.compressedSize || 0),
      colors: sortedAssets.map(a => a.color)
    });
  }

  return {
    categories: sortedAssets.map(a => a.assetType),
    series
  };
}

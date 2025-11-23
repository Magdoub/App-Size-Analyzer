/**
 * ChatGPT Prompt Generator
 *
 * Generates deterministic, platform-specific prompts for debugging app size issues
 */

import { formatBytes } from '../../utils/formatters.js';

/**
 * Generate a persona string based on platform and format
 * @param {string} platform - 'iOS' or 'Android'
 * @param {string} format - 'ipa', 'apk', 'aab', etc.
 * @returns {string} Persona description
 */
function getPersona(platform, format) {
  if (platform === 'iOS') {
    return 'You are a Senior iOS Architect specialized in App Size Optimization. Act as a Teacher and a Coach.';
  }

  if (platform === 'Android') {
    if (format === 'aab') {
      return 'You are a Senior Android Engineer specialized in App Bundle Optimization. Act as a Teacher and a Coach.';
    }
    return 'You are a Senior Android Engineer specialized in APK Optimization. Act as a Teacher and a Coach.';
  }

  return 'You are a Senior Mobile Engineer specialized in App Size Optimization. Act as a Teacher and a Coach.';
}

/**
 * Generate the "ask" section based on platform and format
 * @param {string} platform - 'iOS' or 'Android'
 * @param {string} format - 'ipa', 'apk', 'aab', etc.
 * @returns {string} The ask section
 */
function getAskSection(platform, format) {
  if (platform === 'iOS') {
    return `What are the EXACT steps I can take to optimize this? Provide a numbered list of specific, actionable steps with commands, file paths, and Xcode settings where applicable. If you don't know how to optimize this specific file type or issue, say "I don't know how to optimize this" and explain why.

Be brief. Focus only on concrete implementation steps.`;
  }

  if (platform === 'Android' && format === 'aab') {
    return `What are the EXACT steps I can take to optimize this? Provide a numbered list of specific, actionable steps with Gradle configurations, dynamic feature module setup, and Play Console settings where applicable. If you don't know how to optimize this specific file type or issue, say "I don't know how to optimize this" and explain why.

Be brief. Focus only on concrete implementation steps.`;
  }

  if (platform === 'Android') {
    return `What are the EXACT steps I can take to optimize this? Provide a numbered list of specific, actionable steps with Gradle configurations, ProGuard/R8 rules, and commands where applicable. If you don't know how to optimize this specific file type or issue, say "I don't know how to optimize this" and explain why.

Be brief. Focus only on concrete implementation steps.`;
  }

  return `What are the EXACT steps I can take to optimize this? Provide a numbered list of specific, actionable steps. If you don't know how to optimize this specific file type or issue, say "I don't know how to optimize this" and explain why.

Be brief. Focus only on concrete implementation steps.`;
}

/**
 * Generate ChatGPT prompt for a single insight
 *
 * @param {Object} params - Prompt parameters
 * @param {string} params.platform - 'iOS' or 'Android'
 * @param {string} params.format - 'ipa', 'apk', 'aab', etc.
 * @param {string} [params.appName] - Application name
 * @param {string} [params.bundleId] - Bundle identifier or package name
 * @param {string} [params.version] - Version string
 * @param {number} [params.versionCode] - Android version code
 * @param {number} params.totalSize - Total install size in bytes
 * @param {number} [params.totalDownloadSize] - Total download size in bytes
 * @param {Array} params.affectedFiles - Array of affected file objects
 * @param {number} params.totalAffectedSize - Total size of all affected files
 * @param {number} [params.percentOfTotal] - Percentage of total app size
 * @param {string} params.category - Insight category
 * @param {string} params.insightTitle - The insight title
 * @param {string} params.insightDescription - The insight description
 * @param {string} params.insightRecommendation - The suggestion provided
 * @param {number} [params.potentialSavings] - Potential savings in bytes
 * @returns {Object} Object with prompt string and metadata
 */
export function generateIndividualPrompt(params) {
  const {
    platform,
    format,
    appName,
    bundleId,
    version,
    versionCode,
    totalSize,
    totalDownloadSize,
    affectedFiles,
    totalAffectedSize,
    percentOfTotal,
    category,
    insightTitle,
    insightDescription,
    insightRecommendation,
    potentialSavings,
  } = params;

  const persona = getPersona(platform, format);
  const askSection = getAskSection(platform, format);

  // Format sizes
  const totalSizeFormatted = formatBytes(totalSize);
  const totalAffectedSizeFormatted = formatBytes(totalAffectedSize);
  const downloadSizeFormatted = totalDownloadSize ? formatBytes(totalDownloadSize) : null;
  const potentialSavingsFormatted = potentialSavings ? formatBytes(potentialSavings) : null;

  // Build app context section
  let appContext = `App Context:
- Platform: ${platform}
- Format: ${format.toUpperCase()}`;

  if (appName) {
    appContext += `\n- App Name: ${appName}`;
  }

  if (bundleId) {
    const label = platform === 'iOS' ? 'Bundle ID' : 'Package Name';
    appContext += `\n- ${label}: ${bundleId}`;
  }

  if (version) {
    appContext += `\n- Version: ${version}`;
    if (versionCode && platform === 'Android') {
      appContext += ` (code: ${versionCode})`;
    }
  }

  appContext += `\n- Total App Size: ${totalSizeFormatted}`;

  if (downloadSizeFormatted) {
    appContext += `\n- Download Size: ${downloadSizeFormatted}`;
  }

  // Build issue section with all files
  let issueSection = `Issue Detected: ${insightTitle}
- Category: ${category}
- Files Affected: ${affectedFiles.length} file${affectedFiles.length > 1 ? 's' : ''}
- Total Size of Affected Files: ${totalAffectedSizeFormatted}`;

  if (percentOfTotal !== undefined && percentOfTotal !== null) {
    issueSection += ` (${percentOfTotal.toFixed(1)}% of total app)`;
  }

  if (potentialSavingsFormatted) {
    issueSection += `\n- Potential Savings: ${potentialSavingsFormatted}`;
  }

  // List all affected files with details
  issueSection += `\n\nDetailed File Breakdown:`;
  affectedFiles.forEach((file, index) => {
    const fileNum = index + 1;
    const fileSizeFormatted = formatBytes(file.size);
    const filePercent = totalSize > 0 ? ((file.size / totalSize) * 100).toFixed(2) : 0;

    issueSection += `\n${fileNum}. ${file.path}`;
    issueSection += `\n   - Size: ${fileSizeFormatted} (${filePercent}% of total app)`;

    if (file.type) {
      issueSection += `\n   - Type: ${file.type}`;
    }

    if (file.context) {
      issueSection += `\n   - Context: ${file.context}`;
    }

    if (file.recommendation) {
      issueSection += `\n   - Per-file recommendation: ${file.recommendation}`;
    }
  });

  // Build full prompt
  const prompt = `${persona}

${appContext}

${issueSection}

Current Analysis:
${insightDescription}

Our Suggestion:
${insightRecommendation}

${askSection}

THINK HARD.`;

  return {
    prompt,
    metadata: {
      platform,
      format,
      fileCount: affectedFiles.length,
      category,
    },
  };
}

/**
 * Generate ChatGPT prompt for multiple insights in a section
 *
 * @param {Object} params - Prompt parameters
 * @param {string} params.platform - 'iOS' or 'Android'
 * @param {string} params.format - 'ipa', 'apk', 'aab', etc.
 * @param {string} [params.appName] - Application name
 * @param {string} [params.bundleId] - Bundle identifier or package name
 * @param {string} [params.version] - Version string
 * @param {number} [params.versionCode] - Android version code
 * @param {number} params.totalSize - Total install size in bytes
 * @param {number} [params.totalDownloadSize] - Total download size in bytes
 * @param {Array} params.insights - Array of insight objects
 * @returns {Object} Object with prompt string and metadata
 */
export function generateSectionPrompt(params) {
  const {
    platform,
    format,
    appName,
    bundleId,
    version,
    versionCode,
    totalSize,
    totalDownloadSize,
    insights,
  } = params;

  const persona = getPersona(platform, format);
  const askSection = getAskSection(platform, format);

  // Format sizes
  const totalSizeFormatted = formatBytes(totalSize);
  const downloadSizeFormatted = totalDownloadSize ? formatBytes(totalDownloadSize) : null;

  // Build app context section
  let appContext = `App Context:
- Platform: ${platform}
- Format: ${format.toUpperCase()}`;

  if (appName) {
    appContext += `\n- App Name: ${appName}`;
  }

  if (bundleId) {
    const label = platform === 'iOS' ? 'Bundle ID' : 'Package Name';
    appContext += `\n- ${label}: ${bundleId}`;
  }

  if (version) {
    appContext += `\n- Version: ${version}`;
    if (versionCode && platform === 'Android') {
      appContext += ` (code: ${versionCode})`;
    }
  }

  appContext += `\n- Total Size: ${totalSizeFormatted}`;

  if (downloadSizeFormatted) {
    appContext += `\n- Download Size: ${downloadSizeFormatted}`;
  }

  appContext += `\n- Issues Found: ${insights.length} optimization opportunities`;

  // Group insights by category
  const byCategory = insights.reduce((acc, insight) => {
    if (!acc[insight.category]) {
      acc[insight.category] = [];
    }
    acc[insight.category].push(insight);
    return acc;
  }, {});

  // Calculate total savings
  const totalSavings = insights.reduce((sum, insight) => sum + (insight.potentialSavings || 0), 0);
  const savingsPercent = totalSize > 0 ? ((totalSavings / totalSize) * 100).toFixed(0) : 0;

  // Build category summaries
  let categorySummary = '\nDetected Issues Summary:';

  // Category icons
  const categoryIcons = {
    'duplicates': '📋',
    'optimization': '⚡',
    'size-optimization': '⚡',
    'unused': '🗑️',
    'over-bundling': '📦',
    'compression': '🗜️',
    'architecture': '🏗️',
  };

  Object.entries(byCategory).forEach(([category, categoryInsights]) => {
    const icon = categoryIcons[category] || '💡';
    const categorySavings = categoryInsights.reduce((sum, i) => sum + (i.potentialSavings || 0), 0);
    const count = categoryInsights.length;
    const largestFile = categoryInsights.reduce((largest, insight) => {
      const files = insight.affectedFiles || insight.affectedItems || [];
      const largestInInsight = files.reduce((max, file) => {
        const fileSize = file.size || 0;
        return fileSize > max.size ? { path: file.path || file, size: fileSize } : max;
      }, { path: '', size: 0 });

      return largestInInsight.size > largest.size ? largestInInsight : largest;
    }, { path: '', size: 0 });

    categorySummary += `\n${icon} ${category} (${count} issue${count > 1 ? 's' : ''}, ~${formatBytes(categorySavings)} potential savings)`;

    if (largestFile.path) {
      categorySummary += `\n- Largest: ${largestFile.path} (${formatBytes(largestFile.size)})`;
    }
    categorySummary += '\n';
  });

  categorySummary += `\nTotal Potential Savings: ${formatBytes(totalSavings)} (${savingsPercent}% size reduction)`;

  // Build full prompt
  const prompt = `${persona}

${appContext}
${categorySummary}

Please provide:
1. Prioritized optimization roadmap (high impact first)
2. Expected size reduction for top 3 optimizations
3. Quick wins vs. long-term improvements
4. Any overlapping optimizations to combine

Be brief and provide organized action points with clear next steps.

THINK HARD.`;

  return {
    prompt,
    metadata: {
      platform,
      format,
      insightCount: insights.length,
      totalSavings,
    },
  };
}

/**
 * Generate ChatGPT URL with pre-filled prompt
 * @param {string} prompt - The prompt text
 * @returns {string} ChatGPT URL
 */
export function generateChatGPTUrl(prompt) {
  const encoded = encodeURIComponent(prompt);
  return `https://chatgpt.com/?q=${encoded}`;
}

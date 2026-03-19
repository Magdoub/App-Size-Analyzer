/**
 * ChatGPT Prompt Composable
 *
 * Vue composable for generating and opening ChatGPT debugging prompts
 */

import { generateIndividualPrompt } from '../lib/prompts/chatgpt-prompts.js';
import { useAnalysisStore } from '../stores/analysisStore.js';

/**
 * Composable for ChatGPT debugging integration
 * @returns {Object} Methods for debugging with ChatGPT
 */
export function useChatGPTPrompt() {
  const analysisStore = useAnalysisStore();

  /**
   * Get the debugging prompt for a specific insight (without opening ChatGPT)
   * @param {Object} insight - The insight object
   * @param {Object} [affectedFile] - Specific file if debugging a single file
   * @returns {Object|null} Object with prompt and metadata, or null if error
   */
  function getInsightPrompt(insight, _affectedFile = null) {
    const metadata = analysisStore.metadata;
    const format = analysisStore.format || 'unknown';

    if (!metadata) {
      console.error('Cannot generate prompt: No metadata available');
      return null;
    }

    // Get all affected files
    let allAffectedFiles = [];
    if (insight.affectedFiles && insight.affectedFiles.length > 0) {
      allAffectedFiles = insight.affectedFiles.map(file => ({
        path: file.path,
        size: file.size,
        type: file.type,
        context: file.context,
        recommendation: file.recommendation,
      }));
    } else if (insight.affectedItems && insight.affectedItems.length > 0) {
      // Fallback to legacy affectedItems
      allAffectedFiles = insight.affectedItems.map(item => ({
        path: item.path || item,
        size: item.size || 0,
      }));
    }

    if (allAffectedFiles.length === 0) {
      console.error('Cannot generate prompt: No affected files found');
      return null;
    }

    // Calculate total size and percent of total
    const totalSize = analysisStore.currentAnalysis?.totalInstallSize || metadata.totalSize || 0;
    const totalAffectedSize = allAffectedFiles.reduce((sum, file) => sum + file.size, 0);
    const percentOfTotal = totalSize > 0 ? (totalAffectedSize / totalSize) * 100 : 0;

    // Generate prompt
    return generateIndividualPrompt({
      platform: metadata.platform,
      format,
      appName: metadata.appName,
      bundleId: metadata.bundleId || metadata.packageName,
      version: metadata.version,
      versionCode: metadata.versionCode,
      totalSize,
      totalDownloadSize: metadata.downloadSize || analysisStore.currentAnalysis?.totalDownloadSize,
      affectedFiles: allAffectedFiles,
      totalAffectedSize,
      percentOfTotal,
      category: insight.category,
      insightTitle: insight.title,
      insightDescription: insight.description,
      insightRecommendation: insight.recommendation || insight.fixSuggestion || 'No specific recommendation provided.',
      potentialSavings: insight.potentialSavings || 0,
    });
  }

  /**
   * Open ChatGPT with a debugging prompt for a specific insight (legacy method)
   * @param {Object} insight - The insight object
   * @param {Object} [affectedFile] - Specific file if debugging a single file
   */
  function debugInsightWithChatGPT(insight, _affectedFile = null) {
    const metadata = analysisStore.metadata;
    const format = analysisStore.format || 'unknown';

    if (!metadata) {
      console.error('Cannot generate prompt: No metadata available');
      return;
    }

    // Get all affected files
    let allAffectedFiles = [];
    if (insight.affectedFiles && insight.affectedFiles.length > 0) {
      allAffectedFiles = insight.affectedFiles.map(file => ({
        path: file.path,
        size: file.size,
        type: file.type,
        context: file.context,
        recommendation: file.recommendation,
      }));
    } else if (insight.affectedItems && insight.affectedItems.length > 0) {
      // Fallback to legacy affectedItems
      allAffectedFiles = insight.affectedItems.map(item => ({
        path: item.path || item,
        size: item.size || 0,
      }));
    }

    if (allAffectedFiles.length === 0) {
      console.error('Cannot generate prompt: No affected files found');
      return;
    }

    // Calculate total size and percent of total
    const totalSize = analysisStore.currentAnalysis?.totalInstallSize || metadata.totalSize || 0;
    const totalAffectedSize = allAffectedFiles.reduce((sum, file) => sum + file.size, 0);
    const percentOfTotal = totalSize > 0 ? (totalAffectedSize / totalSize) * 100 : 0;

    // Generate prompt
    const promptData = generateIndividualPrompt({
      platform: metadata.platform,
      format,
      appName: metadata.appName,
      bundleId: metadata.bundleId || metadata.packageName,
      version: metadata.version,
      versionCode: metadata.versionCode,
      totalSize,
      totalDownloadSize: metadata.downloadSize || analysisStore.currentAnalysis?.totalDownloadSize,
      affectedFiles: allAffectedFiles,
      totalAffectedSize,
      percentOfTotal,
      category: insight.category,
      insightTitle: insight.title,
      insightDescription: insight.description,
      insightRecommendation: insight.recommendation || insight.fixSuggestion || 'No specific recommendation provided.',
      potentialSavings: insight.potentialSavings || 0,
    });

    // Copy prompt to clipboard
    navigator.clipboard.writeText(promptData.prompt).then(() => {
      // Open ChatGPT in new tab
      window.open('https://chatgpt.com/', '_blank', 'noopener,noreferrer');

      // Show notification (optional - you can add a toast notification here)
      console.log('Prompt copied to clipboard! Paste it in ChatGPT.');
    }).catch((err) => {
      console.error('Failed to copy prompt to clipboard:', err);
      // Fallback: Open ChatGPT anyway
      window.open('https://chatgpt.com/', '_blank', 'noopener,noreferrer');
      alert(`Please copy this prompt and paste it in ChatGPT:\n\n${promptData.prompt.substring(0, 500)}...`);
    });
  }

  /**
   * Debug multiple insights together (section-wide)
   * @param {Array} insights - Array of insight objects
   */
  function debugSectionWithChatGPT(insights) {
    const metadata = analysisStore.metadata;
    const format = analysisStore.format || 'unknown';

    if (!metadata) {
      console.error('Cannot generate prompt: No metadata available');
      return;
    }

    if (!insights || insights.length === 0) {
      console.error('Cannot generate prompt: No insights provided');
      return;
    }

    const totalSize = analysisStore.currentAnalysis?.totalInstallSize || metadata.totalSize || 0;

    // Import section prompt generator
    import('../lib/prompts/chatgpt-prompts.js').then(({ generateSectionPrompt }) => {
      const promptData = generateSectionPrompt({
        platform: metadata.platform,
        format,
        appName: metadata.appName,
        bundleId: metadata.bundleId || metadata.packageName,
        version: metadata.version,
        versionCode: metadata.versionCode,
        totalSize,
        totalDownloadSize: metadata.downloadSize || analysisStore.currentAnalysis?.totalDownloadSize,
        insights,
      });

      // Copy prompt to clipboard
      navigator.clipboard.writeText(promptData.prompt).then(() => {
        // Open ChatGPT in new tab
        window.open('https://chatgpt.com/', '_blank', 'noopener,noreferrer');

        // Show notification
        console.log('Prompt copied to clipboard! Paste it in ChatGPT.');
      }).catch((err) => {
        console.error('Failed to copy prompt to clipboard:', err);
        // Fallback: Open ChatGPT anyway
        window.open('https://chatgpt.com/', '_blank', 'noopener,noreferrer');
        alert(`Please copy this prompt and paste it in ChatGPT:\n\n${promptData.prompt.substring(0, 500)}...`);
      });
    });
  }

  return {
    getInsightPrompt,
    debugInsightWithChatGPT,
    debugSectionWithChatGPT,
  };
}

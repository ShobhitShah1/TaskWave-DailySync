const urlRegex =
  /(?:(?:https?:\/\/|www\.)[\w-]+(?:\.[\w-]+)+)(?:[\w.,@?^=%&:/~+#-]*[\w@?^=%&/~+#-])?/g;

export function linkifyText(text: string): Array<{ type: 'text' | 'url'; value: string }> {
  if (!text) return [];

  const result: Array<{ type: 'text' | 'url'; value: string }> = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  // Reset regex state
  urlRegex.lastIndex = 0;

  // Single pass through the text
  while ((match = urlRegex.exec(text)) !== null) {
    const urlMatch = match[0];
    const index = match.index;

    // Quick validation to avoid heavy processing
    if (urlMatch.length >= 4 && !/^\d+\.\d+$/.test(urlMatch)) {
      // Add text before URL
      if (index > lastIndex) {
        result.push({
          type: 'text',
          value: text.substring(lastIndex, index),
        });
      }

      // Add normalized URL
      const url = urlMatch.startsWith('http') ? urlMatch : `https://${urlMatch}`;

      result.push({ type: 'url', value: url });
      lastIndex = index + urlMatch.length;
    }
  }

  // Add remaining text
  if (lastIndex < text.length) {
    const remaining = text.substring(lastIndex);
    if (remaining) {
      result.push({ type: 'text', value: remaining });
    }
  }

  return result;
}

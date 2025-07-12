// Utility to detect and split URLs in a string
// Returns an array of { type: 'text' | 'url', value: string }

const urlRegex = /((https?:\/\/)?([\w-]+\.)+[\w-]+(\/[\w-./?%&=]*)?)/gi;

export function linkifyText(text: string): Array<{ type: 'text' | 'url'; value: string }> {
  if (!text) return [];
  const result: Array<{ type: 'text' | 'url'; value: string }> = [];
  let lastIndex = 0;

  text.replace(urlRegex, (match, _url, _protocol, _domain, _path, offset) => {
    if (offset > lastIndex) {
      result.push({ type: 'text', value: text.slice(lastIndex, offset) });
    }
    // Ensure protocol for Linking
    const url = match.startsWith('http') ? match : `https://${match}`;
    result.push({ type: 'url', value: url });
    lastIndex = offset + match.length;
    return match;
  });

  if (lastIndex < text.length) {
    result.push({ type: 'text', value: text.slice(lastIndex) });
  }
  return result;
}

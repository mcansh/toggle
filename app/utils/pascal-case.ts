function toPascalCase(string: string) {
  const words = string.match(/[a-z]+/gi);
  if (!words) return '';
  return words
    .map(word => word.charAt(0).toUpperCase() + word.substr(1).toLowerCase())
    .join('');
}

export { toPascalCase };

/**
 * クリップボードにコピーする
 * @param text
 */
export const copyToClipboard = (text: string) => {
  const temp = document.createElement('div');
  temp.style.position = 'fixed';
  temp.style.left = '-100%';
  temp.appendChild(document.createElement('pre')).textContent = text;
  document.body.appendChild(temp);

  const section = document.getSelection();
  if (section) section.selectAllChildren(temp);

  const result = document.execCommand('copy');
  document.body.removeChild(temp);

  return result;
};

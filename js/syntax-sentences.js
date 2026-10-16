/* 全站与离线题库审计共用的断句逻辑；保留小数、缩写、填空编号和原文字符。 */
function SYNSentences(value) {
  const text = String(value ?? '');
  const out = [];
  let start = 0;
  for (let i=0; i<text.length; i++) {
    const c=text[i];
    if (!/[.!?]/.test(c)) continue;
    if (c === '.') {
      if (/\d/.test(text[i-1]||'') && /[\d_]/.test(text[i+1]||'')) continue;
      const token = (text.slice(start,i+1).match(/[^\s]+$/)||[''])[0].replace(/^[\"'“‘(\[]+/, '');
      if (/^(?:Mr|Mrs|Ms|Dr|Prof|Col|Gen|St|Jr|Sr|vs|etc|e\.g|i\.e|a\.m|p\.m)\.$/i.test(token)) continue;
      if (/^(?:[A-Za-z]\.)+$/.test(token) && !(token.length>2 && /^\s+(?:The|This|These|Those|It|They|We|He|She|However|Because|Although|But|Yet|In|As|For)\b/.test(text.slice(i+1)))) continue;
      if (/[A-Za-z]/.test(text[i-1]||'') && /[A-Za-z]/.test(text[i+1]||'')) continue;
    }
    let end=i+1;
    while (end<text.length && /[.!?"'”’\])]/.test(text[end])) end++;
    if (end<text.length && !/\s/.test(text[end])) continue;
    out.push(text.slice(start,end)); start=end; i=end-1;
  }
  if (start<text.length) out.push(text.slice(start));
  return out.filter(x=>x.trim());
}

if (typeof module !== 'undefined' && module.exports) module.exports = SYNSentences;

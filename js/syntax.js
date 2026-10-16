/* 离线依存分析适配层：浏览器只读取本地题库分析文件，不再按词尾猜谓语。 */
const SYN = (() => {
  const records = new Map(), loads = new Map();
  const normalize = s => String(s || '').replace(/\s+/g,' ').trim();
  function bucket(s) { let h=2166136261; for(const c of s) { h^=c.charCodeAt(0); h=Math.imul(h,16777619); } return (h>>>0).toString(16).padStart(8,'0').slice(0,2); }
  function register(data) { Object.entries(data).forEach(([text,record])=>records.set(text,record)); }
  async function load(sentence) {
    const text=normalize(sentence), key=bucket(text);
    if(records.has(text))return;
    if(!loads.has(key)) loads.set(key,fetch(`data/syntax/v29/${key}.json`).then(r=>{if(!r.ok)throw new Error('句式数据加载失败');return r.json();}).then(register).catch(e=>{loads.delete(key);throw e;}));
    await loads.get(key);
  }
  function tokenize(text) {return Array.from(String(text||'').matchAll(/\S+/g),m=>({w:m[0],c:m[0].toLowerCase(),start:m.index,end:m.index+m[0].length,pos:'UNK'}));}
  function parse(sentence) {
    const text=normalize(sentence), record=records.get(text);
    if(!record || record.unavailable)return {text,tokens:tokenize(text),type:'尚未校验',pattern:'',clauses:[],unavailable:true,warnings:record?.warnings||[]};
    return decode(text,record);
  }
  function decode(text,record) {
    const tokens=record.t.map((r,i)=>({i,start:r[0],end:r[1],w:text.slice(r[0],r[1]),c:text.slice(r[0],r[1]).toLowerCase().replace(/[^a-z0-9']/g,''),dep:r[2],head:r[3],pos:r[4],tag:r[5],tail:(text.slice(r[0],r[1]).match(/[.,;:!?)]+$/)||[''])[0]}));
    tokens.forEach(t=>{
      if(t.pos==='PUNCT'&&/[a-z0-9\u3400-\u9fff]/i.test(t.w)){t.pos='X';if(t.dep!=='ROOT')t.dep='dep';}
      else if((t.pos==='PUNCT'||/^\p{P}+$/u.test(t.w))&&t.dep!=='ROOT'){t.pos='PUNCT';if(t.dep!=='case')t.dep='punct';}
    });
    // 依存模型的小句主语在宾补结构中对应教学语法的宾语。
    const control=/^(want|ask|tell|told|make|made|let|help|allow|enable|force|require|expect|encourage|persuade|invite|order|teach|taught|cause|see|saw|watch|hear|heard|feel|felt|keep|kept|find|found|believe|consider|envisage|imagine|suppose)(s|ed|ing)?$/;
    for(const t of tokens) if(t.dep==='ccomp' && control.test(tokens[t.head]?.c||'')) {
      const dependents=tokens.filter(k=>k.head===t.i&&k.i!==t.i);
      const finite=dependents.some(k=>/^(aux|auxpass)$/.test(k.dep)&&/^(VBD|VBP|VBZ|MD)$/.test(k.tag));
      const subs=dependents.filter(k=>/^(nsubj|nsubjpass)$/.test(k.dep));
      if(subs.length && !finite && !dependents.some(k=>k.dep==='mark') && /^(VB|VBG|VBN|JJ|JJR|JJS|NN|NNS)$/.test(t.tag)) {
        subs.forEach(k=>{k.dep='dobj';k.head=t.head;});
        t.dep=/^(VERB|AUX)$/.test(t.pos)?'xcomp':'oprd';
      }
    }
    const kids=tokens.map(()=>[]);
    tokens.forEach(t=>{if(t.head!==t.i && kids[t.head])kids[t.head].push(t.i);});
    const child=(i,d)=>kids[i].filter(j=>d.test(tokens[j].dep));
    const ordered=ids=>[...new Set(ids)].sort((a,b)=>a-b);
    const sub=(i,exclude=new Set(),seen=new Set())=>{if(seen.has(i)||exclude.has(i))return [];seen.add(i);return [i,...kids[i].flatMap(j=>sub(j,exclude,seen))];};
    const ts=ids=>ordered(ids).map(i=>tokens[i]);
    const word=ids=>{
      const list=ordered(ids); let result='',previous=-2,end=0;
      for(const j of list){const t=tokens[j];result+=(result?(j===previous+1?text.slice(end,t.start):' '):'')+t.w;previous=j;end=t.end;}
      return result;
    };
    const node=(role,phrase,ids,children=[],target=[],relation='',note='')=>({role,phrase,text:word(ids),tokens:ts(ids),children,targetTokens:ts(target),relation,note,explicitRelation:true});
    const mainRoots=tokens.filter(t=>t.dep==='ROOT').map(t=>t.i);
    // 只在并列谓语有独立主语时另列分句；名词列举永远不在这里切句。
    for(let k=0;k<mainRoots.length;k++) for(const j of child(mainRoots[k],/^conj$/)) if(child(j,/^(nsubj|nsubjpass|csubj|csubjpass)$/).length && /^(VERB|AUX)$/.test(tokens[j].pos)) mainRoots.push(j);
    const rootSet=new Set(mainRoots);
    const span=i=>sub(i,new Set(mainRoots.filter(r=>r!==i)));
    const verbIds=i=>ordered([i,...kids[i].filter(j=>(/^(aux|auxpass|prt)$/.test(tokens[j].dep)||(tokens[j].dep==='neg'&&/^(not|n't)$/.test(tokens[j].c)))).flatMap(j=>sub(j))]);
    const isVerb=i=>/^(VERB|AUX)$/.test(tokens[i].pos);
    const nonfinite=i=>/^(VBG|VBN|VB)$/.test(tokens[i].tag)&&!child(i,/^(aux|auxpass)$/).some(j=>/^(VBD|VBP|VBZ|MD)$/.test(tokens[j].tag));
    let clauseCount=mainRoots.length, hasSub=false;
    function phrase(i,role,target=[],relation='',depth=0) {
      if(depth>24)return node('待核对片段','',span(i),[],[], '', '嵌套层级过深，需要人工复核。');
      const t=tokens[i], ids=span(i), children=[];
      if(/[\u3400-\u9fff]/.test(t.w)&&!/[a-z]/i.test(t.w))return node('原文注释','',ids,[],[], '', '原文中的中文释义，不作为英文句法成分。');
      const fixedMatch=word(ids).match(/^(according to|because of|due to|instead of|out of|in spite of)\b/i), fixedPrep=!!fixedMatch;
      const type=fixedPrep?'PP（复合介词短语）':t.pos==='ADP'?'PP（介词短语）':isVerb(i)?(t.tag==='VBG'?'动名词 / 分词短语':t.tag==='VBN'?'过去分词短语':'不定式短语'):t.pos==='ADJ'?'AdjP（形容词短语）':t.pos==='ADV'?'AdvP（副词短语）':'NP（名词短语）';
      if(fixedPrep) {
        const prefix=ordered(ids).slice(0,fixedMatch[1].split(' ').length);
        children.push(node('复合介词','',prefix));
        for(const j of prefix)for(const k of kids[j].filter(k=>!prefix.includes(k)&&!/^(punct|case)$/.test(tokens[k].dep)))children.push(phrase(k,'介词宾语',prefix,'介词与宾语',depth+1));
      } else if(isVerb(i)) {
        children.push(...parts(i,depth+1,true));
      } else {
        if(ids.length>1)children.push(node(t.pos==='ADP'?'介词':'中心词',t.pos,[i]));
        for(const j of kids[i]) {
          if(rootSet.has(j)||/^(punct|case)$/.test(tokens[j].dep))continue;
          const d=tokens[j].dep;
          if(d==='relcl')children.push(nonfinite(j)?phrase(j,'后置定语',[i],'修饰',depth+1):clause(j,'定语从句',[i],'修饰先行词',depth+1));
          else if(d==='acl'&&!nonfinite(j))children.push(clause(j,child(j,/^mark$/).some(k=>/^(that|whether|if)$/.test(tokens[k].c))?'同位语从句':'定语从句',[i],'说明内容',depth+1));
          else if(d==='acl')children.push(phrase(j,/^(trouble|difficulty|difficulties|fun)$/.test(t.c)?'非谓语补语':'后置定语',[i],/^(trouble|difficulty|difficulties|fun)$/.test(t.c)?'补充内容':'修饰',depth+1));
          else if(d==='appos')children.push(phrase(j,'同位语',[i],'解释说明',depth+1));
          else if(d==='prep')children.push(phrase(j,/^(ADJ|ADV|ADP)$/.test(t.pos)?'补语':'后置定语',[i],/^(ADJ|ADV|ADP)$/.test(t.pos)?'补充说明':'修饰 / 限定',depth+1));
          else if(d==='amod'||d==='compound'||d==='nmod')children.push(phrase(j,'前置定语',[i],'修饰',depth+1));
          else if(d==='det'||d==='predet')children.push(phrase(j,'限定词',[i],'限定',depth+1));
          else if(d==='poss')children.push(phrase(j,'前置定语',[i],'所属关系',depth+1));
          else if(d==='nummod'||d==='quantmod')children.push(phrase(j,'数量修饰语',[i],'限定数量',depth+1));
          else if(d==='pcomp'&&isVerb(j)&&!nonfinite(j))children.push(clause(j,'宾语从句',[i],'作介词的宾语',depth+1));
          else if(d==='pobj'||d==='pcomp')children.push(phrase(j,'介词宾语',[i],'介词与宾语',depth+1));
          else if(d==='conj')children.push(phrase(j,'并列成分',[i],'并列',depth+1));
          else if(d==='cc')children.push(node('并列连词','连接词',[j]));
          else if(d==='advmod')children.push(phrase(j,'程度 / 方式修饰语',[i],'修饰',depth+1));
          else if(d==='advcl')children.push(nonfinite(j)?phrase(j,'状语',[i],'目的 / 结果 / 条件',depth+1):clause(j,'状语从句',[i],'修饰',depth+1));
          else if(d==='ccomp')children.push(clause(j,'同位语从句',[i],'说明内容',depth+1));
          else if(d==='dep')children.push(node('待核对片段','',span(j),[],[], '', '该片段的关系需要结合上下文核对。'));
          else children.push(phrase(j,'补充成分',[], '',depth+1));
        }
      }
      children.sort((a,b)=>(a.tokens[0]?.i||0)-(b.tokens[0]?.i||0));
      let note=record.notes?.[i]||'';
      if(ids.some(j=>/_{2,}|\d+\.___/.test(tokens[j].w)))note=record.warnings?.length?'空格信息不完整，相关结构需要核对。':'保留原题空格；结合原答案分析结构，不展示填空答案。';
      return node(role,type,ids,children,target,relation,note);
    }
    function clause(i,role,target,relation,depth) {
      hasSub=true;clauseCount++;
      const mark=child(i,/^mark$/).map(j=>tokens[j].c).join(' ');
      const subtypes={although:'让步',though:'让步',while:'时间 / 对比',when:'时间',before:'时间',after:'时间',until:'时间',because:'原因',since:'时间 / 原因',if:'条件',unless:'条件',whereas:'对比',as:'比较 / 方式'};
      const type=role==='状语从句' && subtypes[mark] ? subtypes[mark]+'状语从句' : role;
      return node(role,type,span(i),parts(i,depth+1),target,relation,record.notes?.[i]||(role==='定语从句'?'从句整体修饰先行词；内部主语、谓语另行标注。':''));
    }
    function parts(i,depth=0,nonFinite=false) {
      const out=[], t=tokens[i], subjects=child(i,/^(nsubj|nsubjpass|csubj|csubjpass)$/), objects=child(i,/^(dobj|obj|iobj|dative)$/), verbs=verbIds(i);
      const passiveComplement=child(i,/^auxpass$/).length || nonFinite&&t.tag==='VBN'&&/^(acl|relcl)$/.test(t.dep)&&!objects.length;
      const passiveSubjects=subjects.length?subjects:passiveComplement?[t.head]:[];
      const existential=child(i,/^expl$/).some(j=>tokens[j].c==='there');
      const extraposed=subjects.some(j=>tokens[j].c==='it') && child(i,/^ccomp$/).length && (child(i,/^acomp$/).length || child(i,/^auxpass$/).length);
      out.push(node(isVerb(i)?(nonFinite?'非谓语中心词':'谓语'):'省略结构中心词',isVerb(i)?'VP（动词短语）':'省略结构',verbs,[],existential?child(i,/^(attr|dobj|obj)$/):subjects,'主谓关系',child(i,/^auxpass$/).length?'被动语态，主语是动作承受者。':''));
      const relationTarget=[i];
      for(const j of kids[i]) {
        const q=tokens[j],d=q.dep;
        if(rootSet.has(j)||/^(aux|auxpass|prt|punct)$/.test(d)||(d==='neg'&&/^(not|n't)$/.test(q.c)))continue;
        if(/^(nsubj|nsubjpass)$/.test(d))out.push(phrase(j,nonFinite?'逻辑主语':extraposed&&q.c==='it'?'形式主语':'主语',relationTarget,'主谓关系',depth+1));
        else if(/^(csubj|csubjpass)$/.test(d))out.push(nonfinite(j)?phrase(j,'主语',relationTarget,'非谓语短语作主语',depth+1):clause(j,'主语从句',relationTarget,'作主语',depth+1));
        else if(d==='expl')out.push(node('引导词','存在句 / 形式成分',[j],[],[], '',q.c==='there'?'there 是存在句引导词，真正主语另行标注。':'形式成分，需结合后接从句理解。'));
        else if(/^(dobj|obj)$/.test(d))out.push(phrase(j,existential?'主语':child(i,/^(dative|iobj)$/).length?'直接宾语':'宾语',relationTarget,existential?'存在句真正主语':'动宾关系',depth+1));
        else if(d==='dative'||d==='iobj')out.push(phrase(j,q.pos==='ADP'?'间接宾语（介词结构）':'间接宾语',relationTarget,'接受者',depth+1));
        else if(d==='attr'||d==='acomp')out.push(phrase(j,existential?'主语':'表语',existential?relationTarget:subjects,existential?'存在句真正主语':'说明主语',depth+1));
        else if(d==='oprd')out.push(phrase(j,passiveComplement?'主语补足语':'宾语补足语',passiveComplement?passiveSubjects:objects,passiveComplement?'补充说明主语':'补充说明宾语',depth+1));
        else if(d==='prep'||d==='agent') {
          const isCopular=/^(am|is|are|was|were|be|been|being)$/.test(t.c)&&!child(i,/^auxpass$/).length;
          const predicative=isCopular&&!child(i,/^(attr|acomp)$/).length;
          const objectComplement=q.c==='as'&&objects.length&&/^(regard|regards|regarded|consider|considers|considered|describe|describes|described|mistake|mistakes|mistook|mistaken|treat|treats|treated)$/.test(t.c);
          out.push(phrase(j,d==='agent'?'施事状语':objectComplement?'宾语补足语':predicative?'表语':'状语',objectComplement?objects:predicative?subjects:relationTarget,objectComplement?'补充说明宾语':predicative?'说明主语':'修饰谓语',depth+1));
        }
        else if(d==='advmod'||d==='npadvmod'||d==='neg')out.push(phrase(j,'状语',relationTarget,'修饰谓语',depth+1));
        else if(d==='mark')out.push(node('从句引导词','连接词',span(j)));
        else if(d==='cc')out.push(node('并列连词','连接词',[j]));
        else if(d==='conj'&&isVerb(j)) {
          const independent=child(j,/^(nsubj|nsubjpass|csubj)$/).length>0;
          if(independent)clauseCount++;
          out.push(node(independent?'并列分句':'并列谓语',independent?'并列分句':'VP（动词短语）',span(j),parts(j,depth+1,nonFinite),relationTarget,independent?'分句并列':'并列谓语，共享主语'));
        }
        else if(d==='ccomp'&&isVerb(j)&&nonfinite(j))out.push(phrase(j,'非谓语补语',relationTarget,'补充谓语内容',depth+1));
        else if(d==='ccomp')out.push(clause(j,extraposed?'主语从句':/^(am|is|are|was|were|be)$/.test(t.c)?'表语从句':'宾语从句',relationTarget,'补充谓语内容',depth+1));
        else if(d==='xcomp') {
          const objectControl=objects.length>0&&/^(want|ask|tell|told|make|made|let|help|allow|enable|force|require|expect|encourage|persuade|invite|order|teach|taught|cause|see|saw|watch|hear|heard|feel|felt|keep|kept|find|found)(s|ed|ing)?$/.test(t.c);
          const purpose=objects.length>0&&/^(use|uses|used|bought|buy|buys|build|built)$/.test(t.c);
          out.push(phrase(j,objectControl?'宾语补足语':purpose?'状语':'非谓语补语',objectControl?objects:relationTarget,objectControl?'补充说明宾语':purpose?'目的':'补充谓语内容',depth+1));
        }
        else if(d==='advcl') {
          const mark=child(j,/^mark$/).map(k=>tokens[k].c);
          if(nonfinite(j))out.push(phrase(j,'状语',relationTarget,'伴随 / 目的 / 结果',depth+1));
          else out.push(clause(j,'状语从句',relationTarget,'修饰主句',depth+1));
        }
        else if(d==='relcl')out.push(clause(j,'定语从句',relationTarget,'修饰先行成分',depth+1));
        else if(d==='dep'&&/^(all|both|each)$/.test(q.c))out.push(phrase(j,'状语',relationTarget,'总括范围',depth+1));
        else if(d==='dep')out.push(node('待核对片段','',span(j),[],[], '', '该片段的依存关系未确定，暂不绘制关系箭头。'));
        else if(d==='intj'||d==='discourse')out.push(phrase(j,'插入语',[], '',depth+1));
        else out.push(phrase(j,'补充成分',[], '',depth+1));
      }
      out.sort((a,b)=>(a.tokens[0]?.i||0)-(b.tokens[0]?.i||0));
      return out;
    }
    const finiteRoot=i=>isVerb(i)&&!nonfinite(i)||isVerb(i)&&tokens[i].tag==='VB'&&!child(i,/^aux$/).some(j=>tokens[j].tag==='TO');
    const clauses=mainRoots.map((r,i)=>({kind:i?'coord':'main',label:i?'并列分句':'主句 / 句子主干',tokens:ts(span(r)),parts:finiteRoot(r)?parts(r):[phrase(r,'短语')]}));
    const first=clauses[0]?.parts||[], roles=first.map(p=>p.role);
    const pattern=!mainRoots.some(finiteRoot)?'短语（无独立谓语）':roles.includes('表语')?'SVC（主 + 系 + 表）':roles.includes('宾语补足语')?'SVOC（主 + 谓 + 宾 + 宾补）':roles.includes('直接宾语')?'SVOO（主 + 谓 + 间宾 + 直宾）':roles.some(r=>/宾语/.test(r))?'SVO（主 + 谓 + 宾）':'SV / 含补语结构';
    return {text,tokens,clauses,clauseCount,type:hasSub?(clauses.length>1?'并列复合句':'复合句'):clauses.length>1?'并列句':'简单句 / 短语',pattern,source:record.reviewed?'重点成分已复核':'自动句法分析',warnings:record.warnings||[]};
  }
  return {parse,load,register,decode,normalize,bucket,tokenize};
})();


/* ---------- 渲染 ---------- */
function SYNNodeHTML(node, depth) {
  const pad = depth * 14;
  const roleCls = SYNRoleClass(node.role);
  const kids = (node.children || []).map(k => SYNNodeHTML(k, depth + 1)).join("");
  return `<div class="syn-node" style="padding-left:${pad}px">
      <div class="syn-line">
        ${node.role ? `<span class="syn-tag ${roleCls}">${esc(node.role)}</span>` : ""}
        ${node.phrase ? `<span class="syn-phrase">${esc(node.phrase)}</span>` : ""}
        <span class="syn-text">${esc(node.text)}</span>
      </div>
      ${node.note ? `<div class="syn-note">${esc(node.note)}</div>` : ""}
      ${kids}
    </div>`;
}

function SYNRoleClass(role) {
  const map = {
    "主语": "r-subj", "谓语": "r-pred", "宾语": "r-obj", "间接宾语": "r-obj", "直接宾语": "r-obj",
    "表语": "r-pred2", "宾语补足语": "r-comp", "定语": "r-attr", "前置定语": "r-attr", "后置定语": "r-attr", "后置修饰": "r-attr",
    "状语": "r-adv", "伴随状语": "r-adv", "定语从句": "r-rel", "状语从句": "r-adv", "宾语从句": "r-noun", "主语从句": "r-noun",
    "表语从句": "r-noun", "名词性从句": "r-noun", "同位语": "r-app", "同位语从句": "r-app", "插入语": "r-ins", "中心词": "r-head",
    "形式主语":"r-subj", "非谓语中心词":"r-pred", "非谓语补语":"r-comp", "并列谓语":"r-pred", "并列成分":"r-other", "介词宾语":"r-obj", "数量修饰语":"r-det", "程度 / 方式修饰语":"r-adv", "施事状语":"r-adv",
    "限定词": "r-det", "数词": "r-det", "修饰语": "r-attr", "其他成分": "r-other",
  };
  return map[role] || "r-other";
}

function txt2(tokens) {
  return (tokens || []).map((t,i,a) => (i && t.start!==a[i-1].end ? ' ' : '')+t.w).join('');
}

function SYNRenderHTML(data) {
  if (!data || !data.clauses || !data.clauses.length) {
    return `<div class="rx-struct-body">没能拆出结构，句子可能过短或格式特殊。</div>`;
  }
  const clauses = data.clauses.map((c, i) => {
    const body = (c.parts || []).map(p => SYNNodeHTML(p, 0)).join("");
    return `<div class="syn-clause">
        <div class="syn-clause-label">${i + 1}. ${esc(c.label || "分句")}${c.connector ? `（引导词 ${esc(c.connector)}）` : ""}</div>
        <div class="syn-clause-text">${esc(txt2(c.tokens))}</div>
        ${body || '<div class="syn-note">（未拆出成分）</div>'}
      </div>`;
  }).join("");
  return `<div class="syn-wrap">
      <div class="syn-meta">
        <span class="syn-badge">句型：${esc(data.type)}</span>
        <span class="syn-badge">基本句型：${esc(data.pattern)}</span>
        <span class="syn-badge">${data.clauseCount || data.clauses.length} 个分句（含嵌套）</span>
      </div>
      ${clauses}
    </div>`;
}

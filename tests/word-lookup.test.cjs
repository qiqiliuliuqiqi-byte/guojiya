const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');
function load(){
  const elements={sectionContent:{innerHTML:''},sectionNav:{innerHTML:''},rxWordBody:{innerHTML:''}};
  const c=vm.createContext({window:{addEventListener(){},scrollTo(){}},localStorage:{getItem(){return null}},document:{addEventListener(){},querySelectorAll:()=>[],getElementById:id=>elements[id]}});
  for(const file of ['syntax-sentences.js','data.js','app.js','real-exam.js'])vm.runInContext(fs.readFileSync(path.join(root,'js',file),'utf8'),c);
  vm.runInContext('globalThis.api={RX,state,rxWrapWords,rxWrapPhraseEn,rxWrapSentencesEn,rxClozeHTML,rxFillBlank,rxWordClick,rxRenderWordResult,rxSectionListening,rxPassageHTML,rxMatchingHTML,rxRenderCardPage,switchSection};',c);
  return {c,a:c.api,elements};
}
const wordCount=s=>(s.match(/class="rx-word"/g)||[]).length;
const tokens=s=>(String(s||'').match(/[A-Za-z][A-Za-z'\-]*/g)||[]).length;
test('全部六级真题听力、阅读题干与文字选项均逐词可查',()=>{
  const {a}=load();let stems=0,options=0;
  for(const file of fs.readdirSync(path.join(root,'data/cet6-exams')).filter(f=>/^cet6_.*\.json$/.test(f))){
    const exam=JSON.parse(fs.readFileSync(path.join(root,'data/cet6-exams',file),'utf8'));
    for(const g of exam.questionGroups||[]){
      let html;
      if(g.subCategory==='reading_comprehension')html=a.rxPassageHTML(g);
      else if(g.subCategory==='matching')html=a.rxMatchingHTML(g);
      else if(g.questions?.some(q=>q.options?.length)){
        a.RX.groups={listening:[g]};const content={},nav={};a.rxSectionListening(content,nav);html=content.innerHTML;
      }else continue;
      const actualStems=[...html.matchAll(/<div class="q-text">([\s\S]*?)<\/div>/g)];
      assert.equal(actualStems.length,g.questions.length,file);
      g.questions.forEach((q,i)=>{assert.equal(wordCount(actualStems[i][1]),tokens(q.statementText||q.questionText),file);stems++;});
      const actualOpts=[...html.matchAll(/<span class="option-text">([\s\S]*?)<\/div>/g)];
      const expectedOpts=g.questions.flatMap(q=>q.options||[]);
      assert.equal(actualOpts.length,expectedOpts.length,file);
      expectedOpts.forEach((o,i)=>{assert.equal(wordCount(actualOpts[i][1]),tokens(o.text),file);options++;});
    }
  }
  assert.ok(stems>1000);assert.ok(options>4000);
});
test('四级及雅思听力、阅读题干与文字选项保留点词入口',()=>{
  const {a,elements}=load();
  for(const course of ['CET4','IELTS'])for(const section of ['listening','reading']){
    a.state.currentCourse=course;a.switchSection(section);
    const html=elements.sectionContent.innerHTML;
    const stems=[...html.matchAll(/<div class="q-text">([\s\S]*?)<\/div>/g)];
    assert.ok(stems.length);
    for(const [,stem]of stems)assert.ok(wordCount(stem)>0,course+' '+section);
    const opts=[...html.matchAll(/<span class="option-text">([\s\S]*?)<\/div>/g)];
    for(const [,opt]of opts){
      const text=opt.replace(/<[^>]*>/g,'');
      if(/[A-Za-z]/.test(text))assert.ok(wordCount(opt)>0,course+' '+section);
    }
  }
});
test('短题干、单字母和中文混排中的英文也能查词，HTML 保持转义',()=>{
  const {a}=load();
  for(const fn of [a.rxWrapPhraseEn,a.rxWrapSentencesEn]){
    assert.equal(wordCount(fn('Why?')),1);assert.equal(wordCount(fn('I')),1);
    assert.equal(wordCount(fn('请选择：go')),1);
    const html=fn('<img onerror="bad">');assert.ok(!html.includes('<img '));
  }
});
test('六级词库的英文可查；禁用已用选项时只开放查词，不重复作答',()=>{
  const {a,c}=load();
  const g={wordBank:[{letter:'A',word:'test',meaning:'测试'}],material:{paragraphs:[]}};
  a.RX.answers={B26:'A'};a.RX.blankSel=27;
  const html=a.rxClozeHTML(g);assert.match(html,/rx-bankword used/);assert.equal(wordCount(html),1);
  a.rxFillBlank('A');assert.equal(a.RX.answers.B27,undefined);assert.equal(a.RX.blankSel,27);
  let stopped=false,lookedUp;
  c.spy=(word)=>lookedUp=word;vm.runInContext('rxShowWordPopup=(word)=>spy(word)',c);
  a.rxWordClick('test',{}, {stopPropagation(){stopped=true}});
  assert.equal(stopped,true);assert.equal(lookedUp,'test');assert.equal(a.RX.answers.B27,undefined);
});
test('课程选择题和填空题的英文题干、选项可查',()=>{
  const {a}=load();
  const html=a.rxRenderCardPage({pageType:'choice',config:{stem:'Why?',options:[{id:'A',text:'A test option'}],correct:['A']}},'quiz');
  assert.equal(wordCount(html),4);assert.match(html,/rxQuizPick/);
  assert.equal(wordCount(a.rxRenderCardPage({pageType:'fillBlank',config:{stem:'Go now.',blanks:['go']}},'fill')),2);
});
test('快速换词后，旧单词的异步释义不能覆盖新词',()=>{
  const {a,elements}=load();a.RX.wordPopup={dataset:{word:'current'}};
  elements.rxWordBody.innerHTML='current meaning';
  a.rxRenderWordResult('previous','旧释义','');assert.equal(elements.rxWordBody.innerHTML,'current meaning');
  a.rxRenderWordResult('current','当前释义','');assert.match(elements.rxWordBody.innerHTML,/当前释义/);
});

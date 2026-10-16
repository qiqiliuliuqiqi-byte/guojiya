const {test}=require('node:test');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),dir=path.join(root,'data/cet6-exams');
const exams=fs.readdirSync(dir).filter(f=>/^cet6_.*\.json$/.test(f)).map(f=>JSON.parse(fs.readFileSync(path.join(dir,f),'utf8')));
test('63套六级每卷55道客观题，题号、选项和答案一一对应，无重复占位题',()=>{
  assert.equal(exams.length,63);
  for(const exam of exams){
    assert.equal(exam.totalTime,130,exam.examId);
    const qs=exam.questionGroups.flatMap(g=>g.questions||[]);
    assert.deepEqual(qs.map(q=>q.questionNumber).sort((a,b)=>a-b),Array.from({length:55},(_,i)=>i+1),exam.examId);
    for(const q of qs){
      assert.ok(q.correctAnswer,exam.examId+' '+q.questionNumber);
      assert.ok(!/^\[Question content/.test(q.questionText||''),exam.examId);
      if(q.options){assert.deepEqual(q.options.map(o=>o.label),['A','B','C','D']);assert.ok(q.options.some(o=>o.label===q.correctAnswer));}
    }
  }
});
test('所有选词填空恰有26–35十个空、15个选项，答案词属于同一词库',()=>{
  for(const exam of exams)for(const g of exam.questionGroups.filter(g=>g.subCategory==='cloze')){
    const text=g.material.paragraphs.map(p=>p.text).join(' ');
    const blanks=[...text.matchAll(/__(\d+)__/g)].map(m=>+m[1]).sort((a,b)=>a-b);
    assert.deepEqual(blanks,Array.from({length:10},(_,i)=>26+i),exam.examId);
    assert.equal(g.wordBank.length,15,exam.examId);
    for(const q of g.questions){
      const w=g.wordBank.find(w=>w.letter===q.correctAnswer);assert.ok(w,exam.examId);
      if(q.correctWord)assert.equal(q.correctWord.toLowerCase(),w.word.toLowerCase(),exam.examId+' '+q.questionNumber);
    }
  }
});
test('2016-12第2套真正第35空为practice；2018-12第1/3套补回第22题D',()=>{
  const g=exams.find(e=>e.examId==='cet6_2016_12_2').questionGroups.find(g=>g.subCategory==='cloze');
  assert.equal(g.questions.find(q=>q.questionNumber===35).correctAnswer,'G');
  assert.match(g.material.paragraphs.map(p=>p.text).join(' '),/success and progress/);
  for(const id of ['cet6_2018_12_1','cet6_2018_12_3']){
    const q=exams.find(e=>e.examId===id).questionGroups.flatMap(g=>g.questions||[]).find(q=>q.questionNumber===22);
    assert.equal(q.correctAnswer,'D');assert.equal(q.options.length,4);assert.equal(q.sources.length,2);
  }
});
function load(){
  const els={app:{innerHTML:''},rxWriting:{value:''},rxTranslation:{value:''},rxReferenceListWrap:{innerHTML:''}};
  const c=vm.createContext({window:{addEventListener(){}},document:{readyState:'loading',addEventListener(){},querySelectorAll:()=>[],getElementById:id=>els[id]},localStorage:{getItem:()=>null},clearInterval(){},setTimeout,clearTimeout,AbortController});
  for(const file of ['syntax-sentences.js','data.js','app.js','real-exam.js'])vm.runInContext(fs.readFileSync(path.join(root,'js',file),'utf8'),c);
  vm.runInContext('globalThis.a={RX,state,pageRenderers,rxLoadExam,rxSubmit,rxRenderReferenceExamList};rxAllListHTML=()=>"";',c);
  return {c,a:c.a,els};
}
test('旧四级/雅思链接及未知试卷不得再回退到公用演示题',()=>{
  const {a,els}=load();
  for(const id of ['cet6-202606-1','ielts-c19-t1','unknown-paper']){
    a.state.currentExam=id;a.pageRenderers.practice(els.app);
    assert.match(els.app.innerHTML,/尚无对应的真实试卷/);assert.ok(!els.app.innerHTML.includes('answer-textarea'));
  }
});
test('四级目录的62个ID均为cet4，雅思只显示官方样题入口',async()=>{
  const {a,c,els}=load(),index=JSON.parse(fs.readFileSync(path.join(root,'data/cet4-exams/index.json'),'utf8'));
  assert.equal(index.length,62);assert.ok(index.every(e=>/^cet4_/.test(e.examId)&&/^CET4 /.test(e.title)));
  c.fetch=async()=>({ok:true,json:async()=>index});a.rxRenderReferenceExamList(els.app,'CET4');await new Promise(setImmediate);
  assert.ok(!els.rxReferenceListWrap.innerHTML.includes('/practice/'));assert.match(els.rxReferenceListWrap.innerHTML,/本地题库待接入/);
  a.rxRenderReferenceExamList(els.app,'IELTS');assert.match(els.app.innerHTML,/cambridgeenglish.org/);assert.ok(!els.app.innerHTML.includes('ielts-c19-t1'));
});
test('上游六级时长125分钟加载后纠正为官方130分钟',async()=>{
  const {a,c}=load();c.fetch=async()=>({ok:true,json:async()=>({examId:'cet6_2024_06_1',totalTime:125})});
  assert.equal((await a.rxLoadExam('cet6_2024_06_1')).totalTime,130);
});
test('交卷按六级听力分值计分：第16题14.2分，第1题7.1分，不再均分',()=>{
  const {a,els}=load(),exam=exams.find(e=>e.examId==='cet6_2024_06_1');
  a.RX.exam=exam;a.RX.groups=Object.fromEntries(['listening','reading','writing','translation'].map(type=>[type,exam.questionGroups.filter(g=>g.type===type)]));
  const qs=a.RX.groups.listening.flatMap(g=>g.questions);
  a.RX.answers={L16:qs.find(q=>q.questionNumber===16).correctAnswer};a.rxSubmit(true);
  assert.match(els.app.innerHTML,/听力<\/div><div class="value">14\.2/);
  a.RX.answers={L1:qs.find(q=>q.questionNumber===1).correctAnswer};a.rxSubmit(true);
  assert.match(els.app.innerHTML,/听力<\/div><div class="value">7\.1/);
});

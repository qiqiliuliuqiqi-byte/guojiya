const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=process.env.GJY_APP_ROOT || path.resolve(__dirname,'..');
function loadApp() {
  const elements={sectionContent:{innerHTML:''},sectionNav:{innerHTML:''}};
  const ctx=vm.createContext({
    window:{addEventListener(){}},
    document:{querySelectorAll:()=>[],getElementById:id=>elements[id]},
    rxWrapPhraseEn:s=>s,rxWrapSentencesEn:s=>s,SYNSentences:s=>s?[s]:[],
    examData:[],courseData:[],questionTypeData:[],vocabularyData:[],
    examQuestions:{reading:{sections:[0,1].map(()=>({type:'选词填空',direction:'',passage:'',wordBank:['alpha','beta','gamma']}))}}
  });
  vm.runInContext(fs.readFileSync(path.join(root,'js/app.js'),'utf8')+'\nshowToast=()=>{};globalThis.api={state,selectBlank,selectWordBank,switchSection};',ctx);
  const a=ctx.api;
  const used=(si,idx)=>{
    const bank=elements.sectionContent.innerHTML.split(`id="wordBank_${si}"`)[1];
    return /class="([^"]*)"/.exec(bank.split(`data-bank-idx="${idx}"`)[0].split('<div').pop())[1].split(/\s+/).includes('used');
  };
  const choose=(si,num,idx)=>{
    a.selectBlank(si,num);
    a.selectWordBank(['alpha','beta','gamma'][idx],si,idx,{classList:{contains:()=>used(si,idx),add(){}}});
  };
  a.switchSection('reading');
  return {...a,choose,used};
}
test('同一空 A 改 B 后，A 恢复可选并能用于另一空',()=>{
  const a=loadApp();
  a.choose(0,1,0);assert.equal(a.used(0,0),true);
  a.choose(0,1,1);
  assert.equal(a.used(0,0),false);
  assert.equal(a.used(0,1),true);
  a.choose(0,2,0);
  assert.equal(a.state.answers['0_blank_1'],'beta');
  assert.equal(a.state.answers['0_blank_2'],'alpha');
});
test('反复改选只占用当前答案，切换板块后也不丢失占用状态',()=>{
  const a=loadApp();
  for(let i=0;i<9;i++)a.choose(0,1,i%3);
  a.switchSection('reading');
  assert.equal(a.used(0,0),false);assert.equal(a.used(0,1),false);assert.equal(a.used(0,2),true);
});
test('清空答案开始新练习后，之前使用过的选项均恢复',()=>{
  const a=loadApp();a.choose(0,1,0);a.state.answers={};a.switchSection('reading');
  assert.equal(a.used(0,0),false);
});
test('一个词库已用选项不能重复填入另一空，也不占用另一词库',()=>{
  const a=loadApp();a.choose(0,1,0);a.choose(0,2,0);
  assert.equal(a.state.answers['0_blank_2'],undefined);
  assert.equal(a.used(1,0),false);
  a.choose(1,1,0);assert.equal(a.state.answers['1_blank_1'],'alpha');
});
test('不能把另一篇文章的词库填到当前空格',()=>{
  const a=loadApp();a.selectBlank(0,1);
  a.selectWordBank('beta',1,1,{classList:{contains:()=>false,add(){}}});
  assert.equal(a.state.answers['0_blank_1'],undefined);
});

/* MASHdev only: Color Cellar jar geometry regression. No game feature or browser-acceptance claim. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'..','color-cellar.js'),'utf8');
const css=fs.readFileSync(path.join(__dirname,'..','color-cellar.css'),'utf8');
assert.match(css,/grid-auto-rows:minmax\(0,1fr\)/);
assert.match(css,/\.mini-jar\{[^}]*aspect-ratio:3\/4/);
assert.match(css,/\.bucket\{[^}]*aspect-ratio:6\/5/);
assert.doesNotMatch(css,/\.mini-jar\{[^}]*height:75%/);
assert.doesNotMatch(css,/\.bucket\{[^}]*height:68%/);
const expected={
  1:[5,0],2:[15,0],3:[41,3],4:[84,6],
  5:[168,9],6:[278,9],7:[500,9]
};
function runViewport(viewW,viewH){
  function styleObject(){
    const props=new Map();
    return {
      setProperty:(key,value)=>props.set(key,String(value)),
      getPropertyValue:key=>props.get(key)||''
    };
  }
  let display;
  class Element {
    constructor(tag){
      this.tag=tag;
      this.className='';
      this.children=[];
      this.style=styleObject();
      this.dataset={};
      this.textContent='';
    }
    append(...children){
      for(const child of children){
        child.parentElement=this;
        this.children.push(child);
      }
    }
    replaceChildren(...children){this.children=[];this.append(...children)}
    querySelectorAll(selector){
      const matches=[];
      function visit(parent){
        for(const item of parent.children){
          if(selector.startsWith('.')&&item.className.split(' ').includes(selector.slice(1)))matches.push(item);
          visit(item);
        }
      }
      visit(this);
      return matches;
    }
    querySelector(selector){return this.querySelectorAll(selector)[0]||null}
    getBoundingClientRect(){
      if(this.className!=='case-shelf')return {width:viewW,height:viewH};
      const caseElement=this.parentElement,wrapper=caseElement.parentElement;
      const stage=Number(display.dataset.stage);
      const count=wrapper.children.length;
      const width=Math.max(0,(viewW-(stage>=6?4:10)*(count-1))/count-12);
      const rows=caseElement.children.length;
      const height=Math.max(0,(viewH-12-3*(rows-1))/rows);
      return {width,height};
    }
  }
  display=new Element('section');
  const radios=Array.from({length:7},(_,i)=>({
    value:String(i+1),handler:null,
    addEventListener(_event,callback){this.handler=callback}
  }));
  const document={
    getElementById:id=>id==='display'?display:null,
    createElement:tag=>new Element(tag),
    querySelectorAll:selector=>selector==='input[name="stage"]'?radios:[]
  };
  const getComputedStyle=()=>({
    paddingLeft:'2px',paddingRight:'2px',paddingTop:'2px',paddingBottom:'2px',
    borderLeftWidth:'0px',borderRightWidth:'0px',
    borderTopWidth:'0px',borderBottomWidth:'3px',columnGap:'1px'
  });
  vm.runInNewContext(source,{
    document,getComputedStyle,
    ResizeObserver:class{observe(){}},
    addEventListener(){},
    requestAnimationFrame(callback){callback();return 1},
    cancelAnimationFrame(){}
  },{filename:'color-cellar.js'});
  for(const radio of radios){
    radio.handler();
    const stage=Number(radio.value),[jarCount,bucketCount]=expected[stage];
    const jars=display.querySelectorAll(stage===1?'.jar':'.mini-jar');
    const buckets=display.querySelectorAll('.bucket');
    assert.equal(jars.length,jarCount,'Jar count, stage '+stage);
    assert.equal(buckets.length,bucketCount,'Bucket count, stage '+stage);
    if(stage===1)continue;
    const wrapper=display.querySelector('.cases');
    const measure=key=>Number.parseFloat(wrapper.style.getPropertyValue(key));
    const w=measure('--mini-jar-w'),h=measure('--mini-jar-h');
    assert.ok(Number.isFinite(w)&&w>=0&&Number.isFinite(h)&&h>=0);
    assert.ok(Math.abs(h-w*4/3)<.003,'Jar ratio, stage '+stage);
    assert.ok(w<=30&&h<=40,'Jar cap, stage '+stage);
    if(bucketCount){
      const bw=measure('--bucket-w'),bh=measure('--bucket-h');
      assert.ok(Number.isFinite(bw)&&bw>=0&&Number.isFinite(bh)&&bh>=0);
      assert.ok(Math.abs(bh-bw*5/6)<.003,'Bucket ratio, stage '+stage);
    }
  }
}
runViewport(1200,680);
runViewport(720,460);
runViewport(370,300);
console.log('Color Cellar: 7 stages, 3 simulated viewports, uniform proportional jar/bucket sizing PASS');

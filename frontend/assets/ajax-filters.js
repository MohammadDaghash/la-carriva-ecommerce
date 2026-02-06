"use strict";
(function(){
var debug='[AF-B]';
var filterSelector='input[name^="filter."],select[name^="filter."]';
var isUpdating=false;
function findMainContent(doc){
var main=doc.querySelector('main#MainContent')||doc.querySelector('main');
if(main){
console.log(debug,'found main');
return main;
}
return null;
}
function updateProducts(url){
if(isUpdating){
console.log(debug,'update in progress');
return;
}
isUpdating=true;
console.log(debug,'update:',url);
var cleanUrl=new URL(url);
cleanUrl.searchParams.delete('page');
url=cleanUrl.toString();
console.log(debug,'fetch:',url);
var curMain=findMainContent(document);
if(!curMain){
location.href=url;
return;
}
fetch(url,{credentials:'same-origin',headers:{'X-Requested-With':'XMLHttpRequest'}}).then(function(res){
if(!res.ok)throw new Error('failed');
return res.text();
}).then(function(html){
var parser=new DOMParser();
var doc=parser.parseFromString(html,'text/html');
var newMain=findMainContent(doc);
if(!newMain){
throw new Error('main not found');
}
console.log(debug,'replacing entire main section');
curMain.innerHTML=newMain.innerHTML;
window.history.pushState({},'',url);
var evt=document.createEvent('CustomEvent');
evt.initCustomEvent('filters:updated',false,false,null);
document.dispatchEvent(evt);
console.log(debug,'success');
isUpdating=false;
}).catch(function(e){
console.log(debug,'error:',e.message);
isUpdating=false;
location.href=url;
});
}
function syncDuplicates(changed){
var name=changed.name;
var value=changed.value;
var isChecked=changed.checked;
var duplicates=document.querySelectorAll('input[name="'+name+'"][value="'+value+'"]');
for(var i=0;i<duplicates.length;i++){
if(duplicates[i]!==changed){
duplicates[i].checked=isChecked;
}
}
}
function buildUrl(){
var url=new URL(location.href);
var inputs=document.querySelectorAll(filterSelector);
var seen={};
var params={};
for(var i=0;i<inputs.length;i++){
var el=inputs[i];
var key=el.name+'::'+el.value;
if(seen[key])continue;
seen[key]=true;
if(el.type==='checkbox'||el.type==='radio'){
if(el.checked){
if(!params[el.name])params[el.name]=[];
params[el.name].push(el.value);
}
}else if(el.value&&el.value.length>0){
if(!params[el.name])params[el.name]=[];
params[el.name].push(el.value);
}
}
url.search='';
for(var name in params){
for(var j=0;j<params[name].length;j++){
url.searchParams.append(name,params[name][j]);
}
}
var sortBy=document.querySelector('[name="sort_by"]');
if(sortBy&&sortBy.value)url.searchParams.set('sort_by',sortBy.value);
url.searchParams.delete('page');
return url.toString();
}
function isInMobileDrawer(element){
var container=element.closest('.facets--drawer')||element.closest('[class*="dialog-drawer"]');
if(container){
console.log(debug,'element in mobile filter drawer');
return container;
}
return null;
}
var timer;
function onChange(e){
if(!e.target.matches(filterSelector)&&e.target.name!=='sort_by')return;
var drawer=isInMobileDrawer(e.target);
if(drawer){
console.log(debug,'mobile: checkbox changed, waiting for See items button');
if(e.target.type==='checkbox'||e.target.type==='radio'){
syncDuplicates(e.target);
}
return;
}
console.log(debug,'desktop: applying immediately');
if(e.target.type==='checkbox'||e.target.type==='radio'){
syncDuplicates(e.target);
}
clearTimeout(timer);
timer=setTimeout(function(){updateProducts(buildUrl())},150);
}
function onApplyClick(e){
var btn=e.target.closest('button');
if(!btn)return;
var drawer=isInMobileDrawer(btn);
if(!drawer)return;
var text=btn.textContent.toLowerCase();
if(!text.includes('see') || !text.includes('items'))return;
console.log(debug,'See items button clicked');
e.preventDefault();
e.stopPropagation();
updateProducts(buildUrl());
var closeBtn=drawer.querySelector('[aria-label*="Close"]')||drawer.querySelector('[data-close]')||drawer.querySelector('button[class*="close"]');
if(closeBtn){
setTimeout(function(){closeBtn.click()},100);
}
}
document.addEventListener('change',onChange);
document.addEventListener('click',onApplyClick,true);
window.addEventListener('popstate',function(){updateProducts(location.href)});
console.log(debug,'init');
})();
/* VEGANFARM language selector and shared UI translations.
   Supported languages: English, Hindi, Marathi and Gujarati only.
   Untranslated page content is disclosed; user-entered and transactional data is never translated. */
(function(){
'use strict';
var languages=[
 {code:'en',label:'English',dir:'ltr'},
 {code:'hi',label:'हिन्दी',dir:'ltr'},
 {code:'mr',label:'मराठी',dir:'ltr'},
 {code:'gu',label:'ગુજરાતી',dir:'ltr'}
];
var keys={
 'Home':['होम','मुख्यपृष्ठ','હોમ'],'About':['हमारे बारे में','आमच्याबद्दल','અમારા વિશે'],
 'Rescue cases':['रेस्क्यू मामले','रेस्क्यू प्रकरणे','રેસ્ક્યૂ કેસ'],'Impact':['प्रभाव','परिणाम','અસર'],
 'Projects':['परियोजनाएँ','उपक्रम','પ્રોજેક્ટ્સ'],'Education':['शिक्षा','शिक्षण','શિક્ષણ'],
 'Our Past Work':['हमारे पिछले कार्य','आमचे मागील कार्य','અમારું અગાઉનું કાર્ય'],
 'Volunteer':['स्वयंसेवक बनें','स्वयंसेवक व्हा','સ્વયંસેવક બનો'],
 'Transparency':['पारदर्शिता','पारदर्शकता','પારદર્શિતા'],'Contact':['संपर्क','संपर्क','સંપર્ક'],
 'VEGANFARM TEAM':['VEGANFARM टीम','VEGANFARM टीम','VEGANFARM ટીમ'],
 'Support a Rescue':['रेस्क्यू में सहायता करें','रेस्क्यूला मदत करा','રેસ્ક્યૂને સહાય કરો'],
 'Donate':['दान करें','देणगी द्या','દાન આપો'],'Explore Our Work':['हमारा कार्य देखें','आमचे कार्य पहा','અમારું કાર્ય જુઓ'],
 'Support this animal':['इस जानवर की मदद करें','या प्राण्याला मदत करा','આ પ્રાણીને સહાય કરો'],
 'View case':['मामला देखें','प्रकरण पहा','કેસ જુઓ'],
 'Loading…':['लोड हो रहा है…','लोड होत आहे…','લોડ થઈ રહ્યું છે…'],
 'No active rescue appeals at the moment.':['फिलहाल कोई सक्रिय रेस्क्यू अपील नहीं है।','सध्या कोणतेही सक्रिय रेस्क्यू आवाहन नाही.','હાલમાં કોઈ સક્રિય રેસ્ક્યૂ અપીલ નથી.']
};
var dict={};
languages.slice(1).forEach(function(l,i){dict[l.code]={};Object.keys(keys).forEach(function(k){dict[l.code][k]=keys[k][i]||k;});});
var current='en',observer=null;
var fallbackNotice='Translation status: This language is only partially translated. Some page content, forms and dashboard content remain in English. Full translation and human linguistic review are pending.';
function ensureFallbackNotice(){var app=document.getElementById('app');if(!app)return;var note=app.querySelector('[data-vf-translation-notice]');if(current==='en'){if(note)note.remove();return;}if(!note){note=document.createElement('p');note.className='vf-translation-fallback';note.setAttribute('data-vf-translation-notice','1');note.setAttribute('role','status');note.setAttribute('aria-live','polite');app.insertBefore(note,app.firstChild);}if(note.textContent!==fallbackNotice)note.textContent=fallbackNotice;}
function translateNode(node){if(!node||node.nodeType!==3)return;var parent=node.parentElement;if(!parent||/^(SCRIPT|STYLE|NOSCRIPT|TEXTAREA|INPUT|OPTION|CODE|PRE)$/i.test(parent.tagName))return;if(node.__vfEnglish===undefined)node.__vfEnglish=node.nodeValue;var source=node.__vfEnglish.trim();if(!source)return;var translated=(dict[current]&&dict[current][source])||source;if(current!=='en'&&translated===source)parent.setAttribute('data-vf-untranslated','1');else parent.removeAttribute('data-vf-untranslated');if(node.nodeValue!==translated)node.nodeValue=translated;}
function translateTree(root){if(!root)return;if(root.nodeType===3){translateNode(root);return;}if(root.nodeType!==1&&root.nodeType!==9)return;var walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT),n;while((n=walker.nextNode()))translateNode(n);if(root.querySelectorAll)root.querySelectorAll('[placeholder],[aria-label],[title]').forEach(function(el){['placeholder','aria-label','title'].forEach(function(attr){var original=el.getAttribute('data-vf-'+attr);if(original===null){original=el.getAttribute(attr);if(original!==null)el.setAttribute('data-vf-'+attr,original);}if(original!==null)el.setAttribute(attr,(dict[current]&&dict[current][original])||original);});});}
function setLanguage(code){var language=languages.find(function(x){return x.code===code;})||languages[0];current=language.code;document.documentElement.lang=language.code;document.documentElement.dir='ltr';document.documentElement.dataset.vfLanguage=language.code;try{localStorage.setItem('vf-language',language.code)}catch(e){}var select=document.getElementById('vf-language');if(select&&select.value!==language.code)select.value=language.code;translateTree(document.body);ensureFallbackNotice();window.dispatchEvent(new CustomEvent('vf:languagechange',{detail:{language:language.code,direction:'ltr'}}));}
function init(){var select=document.getElementById('vf-language');if(!select)return;select.addEventListener('change',function(){setLanguage(select.value)});var saved='en';try{saved=localStorage.getItem('vf-language')||'en'}catch(e){}if(!languages.some(function(x){return x.code===saved;}))saved='en';setLanguage(saved);if(observer)observer.disconnect();observer=new MutationObserver(function(records){records.forEach(function(record){if(record.type==='characterData')translateNode(record.target);record.addedNodes&&record.addedNodes.forEach(function(node){translateTree(node)});});ensureFallbackNotice();});observer.observe(document.getElementById('app')||document.body,{childList:true,subtree:true,characterData:true});var menu=document.getElementById('menu');if(menu)observer.observe(menu,{childList:true,subtree:true,characterData:true});}
var sharedStringCount=Object.keys(keys).length;
window.VFLanguage={
 languages:languages,set:setLanguage,get:function(){return current},
 coverage:'PARTIAL: English, Hindi, Marathi and Gujarati are available. Shared navigation and selected common interface strings are translated; page content, forms, dynamic records, Team portal and Founder dashboard are not fully translated. Missing strings are disclosed and native-speaker review is required.',
 coverageReport:{
  scope:'Shared navigation and selected common interface strings only; this is not whole-site translation coverage.',
  sourceStrings:sharedStringCount,
  byLanguage:{
   en:{translated:sharedStringCount,untranslated:0},
   hi:{translated:sharedStringCount,untranslated:0},
   mr:{translated:sharedStringCount,untranslated:0},
   gu:{translated:sharedStringCount,untranslated:0}
  },
  fullInterface:{status:'NOT COMPLETE',translatedCount:null,untranslatedCount:null}
 }
};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
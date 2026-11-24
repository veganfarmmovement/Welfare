/* VEGANFARM locale foundation — exact-string UI translations only.
   User-submitted names, medical details, financial data, identifiers and URLs are never translated. */
(function(){
'use strict';
var languages=[
 {code:'en',label:'English',dir:'ltr'},
 {code:'hi',label:'हिन्दी',dir:'ltr'},
 {code:'mr',label:'मराठी',dir:'ltr'},
 {code:'gu',label:'ગુજરાતી',dir:'ltr'},
 {code:'sd',label:'سنڌي',dir:'rtl'},
 {code:'ur',label:'اردو',dir:'rtl'},
 {code:'fr',label:'Français',dir:'ltr'},
 {code:'es',label:'Español',dir:'ltr'},
 {code:'ko',label:'한국어',dir:'ltr'},
 {code:'ar',label:'العربية',dir:'rtl'}
];
var keys={
 'Home':['होम','मुख्यपृष्ठ','હોમ','گھر','الرئيسية','Accueil','Inicio','홈','الرئيسية'],
 'About':['हमारे बारे में','आमच्याबद्दल','અમારા વિશે','اسان بابت','معلومات عنا','À propos','Acerca de','소개','من نحن'],
 'Rescue cases':['रेस्क्यू मामले','रेस्क्यू प्रकरणे','રેસ્ક્યૂ કેસ','بچاءَ جا ڪيس','حالات الإنقاذ','Cas de sauvetage','Casos de rescate','구조 사례','حالات الإنقاذ'],
 'Impact':['प्रभाव','परिणाम','અસર','اثر / परिणाम','الأثر','Impact','Impacto','성과','الأثر'],
 'Projects':['परियोजनाएँ','उपक्रम','પ્રોજેક્ટ્સ','منصوبا','المشاريع','Projets','Proyectos','프로젝트','المشاريع'],
 'Education':['शिक्षा','शिक्षण','શિક્ષણ','تعليم / शिक्षण','التعليم','Éducation','Educación','교육','التعليم'],
 'Our Past Work':['हमारे पिछले कार्य','आमचे मागील कार्य','અમારું અગાઉનું કાર્ય','اسان جا اڳوڻا ڪم','أعمالنا السابقة','Nos actions passées','Nuestro trabajo anterior','지난 활동','أعمالنا السابقة'],
 'Volunteer':['स्वयंसेवक बनें','स्वयंसेवक व्हा','સ્વયંસેવક બનો','رضاڪار بڻجو','تطوع','Bénévolat','Voluntariado','자원봉사','التطوع'],
 'Transparency':['पारदर्शिता','पारदर्शकता','પારદર્શિતા','شفافيت / पारदर्शकता','الشفافية','Transparence','Transparencia','투명성','الشفافية'],
 'Contact':['संपर्क','संपर्क','સંપર્ક','رابطو / संपर्क','اتصل بنا','Contact','Contacto','문의','اتصل بنا'],
 'VEGANFARM TEAM':['VEGANFARM टीम','VEGANFARM टीम','VEGANFARM ટીમ','VEGANFARM ٽيم','فريق VEGANFARM','Équipe VEGANFARM','Equipo VEGANFARM','VEGANFARM 팀','فريق VEGANFARM'],
 'Support a Rescue':['रेस्क्यू में सहायता करें','रेस्क्यूला मदत करा','રેસ્ક્યૂને સહાય કરો','بچاءَ ۾ مدد ڪريو','ادعم عملية إنقاذ','Soutenir un sauvetage','Apoyar un rescate','구조 지원하기','ادعم عملية إنقاذ'],
 'Donate':['दान करें','देणगी द्या','દાન આપો','عطيو ڏيو','تبرع','Faire un don','Donar','기부하기','تبرع'],
 'Explore Our Work':['हमारा कार्य देखें','आमचे कार्य पहा','અમારું કાર્ય જુઓ','اسان جو ڪم ڏسو','استكشف أعمالنا','Découvrir nos actions','Conoce nuestro trabajo','활동 살펴보기','استكشف أعمالنا'],
 'Support this animal':['इस जानवर की मदद करें','या प्राण्याला मदत करा','આ પ્રાણીને સહાય કરો','هن جانور جي مدد ڪريو','ادعم هذا الحيوان','Aider cet animal','Apoyar a este animal','이 동물 돕기','ادعم هذا الحيوان'],
 'View case':['मामला देखें','प्रकरण पहा','કેસ જુઓ','ڪيس ڏسو','عرض الحالة','Voir le dossier','Ver el caso','사례 보기','عرض الحالة'],
 'Loading…':['लोड हो रहा है…','लोड होत आहे…','લોડ થઈ રહ્યું છે…','لوڊ ٿي رهيو آهي…','جارٍ التحميل…','Chargement…','Cargando…','불러오는 중…','جارٍ التحميل…'],
 'No active rescue appeals at the moment.':['फिलहाल कोई सक्रिय रेस्क्यू अपील नहीं है।','सध्या कोणतेही सक्रिय रेस्क्यू आवाहन नाही.','હાલમાં કોઈ સક્રિય રેસ્ક્યૂ અપીલ નથી.','هن وقت ڪا به سرگرم بچاءَ اپيل موجود ناهي.','لا توجد نداءات إنقاذ نشطة حاليًا.','Aucun appel au sauvetage actif pour le moment.','No hay campañas de rescate activas en este momento.','현재 진행 중인 구조 모금이 없습니다.','لا توجد نداءات إنقاذ نشطة حاليًا.']
};
var dict={};
languages.slice(1).forEach(function(l,i){dict[l.code]={};Object.keys(keys).forEach(function(k){dict[l.code][k]=keys[k][i]||k;});});
var current='en',observer=null;
function translateNode(node){
 if(!node||node.nodeType!==3)return;
 var parent=node.parentElement;
 if(!parent||/^(SCRIPT|STYLE|NOSCRIPT|TEXTAREA|INPUT|OPTION|CODE|PRE)$/i.test(parent.tagName))return;
 if(node.__vfEnglish===undefined)node.__vfEnglish=node.nodeValue;
 var source=node.__vfEnglish.trim();
 if(!source)return;
 var translated=(dict[current]&&dict[current][source])||source;
 if(node.nodeValue!==translated)node.nodeValue=translated;
}
function translateTree(root){
 if(!root)return;
 if(root.nodeType===3){translateNode(root);return;}
 if(root.nodeType!==1&&root.nodeType!==9)return;
 var walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
 var n;while((n=walker.nextNode()))translateNode(n);
 if(root.querySelectorAll)root.querySelectorAll('[placeholder],[aria-label],[title]').forEach(function(el){
  ['placeholder','aria-label','title'].forEach(function(attr){
   var original=el.getAttribute('data-vf-'+attr);
   if(original===null){original=el.getAttribute(attr);if(original!==null)el.setAttribute('data-vf-'+attr,original);}
   if(original!==null)el.setAttribute(attr,(dict[current]&&dict[current][original])||original);
  });
 });
}
function setLanguage(code){
 var language=languages.find(function(x){return x.code===code;})||languages[0];
 current=language.code;
 document.documentElement.lang=language.code==='sd'?'sd-Arab':language.code;
 document.documentElement.dir=language.dir;
 document.documentElement.dataset.vfLanguage=language.code;
 try{localStorage.setItem('vf-language',language.code)}catch(e){}
 var select=document.getElementById('vf-language');
 if(select&&select.value!==language.code)select.value=language.code;
 translateTree(document.body);
 window.dispatchEvent(new CustomEvent('vf:languagechange',{detail:{language:language.code,direction:language.dir}}));
}
function init(){
 var select=document.getElementById('vf-language');
 if(!select)return;
 select.addEventListener('change',function(){setLanguage(select.value)});
 var saved='en';try{saved=localStorage.getItem('vf-language')||'en'}catch(e){}
 setLanguage(saved);
 if(observer)observer.disconnect();
 observer=new MutationObserver(function(records){
  records.forEach(function(record){
   if(record.type==='characterData')translateNode(record.target);
   record.addedNodes&&record.addedNodes.forEach(function(node){translateTree(node)});
  });
 });
 observer.observe(document.getElementById('app')||document.body,{childList:true,subtree:true,characterData:true});
 var menu=document.getElementById('menu');
 if(menu)observer.observe(menu,{childList:true,subtree:true,characterData:true});
}
window.VFLanguage={languages:languages,set:setLanguage,get:function(){return current},coverage:'Shared navigation and selected common actions only; page-copy translations are being added and fall back to English.'};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
(function(){
  'use strict';
  var client=window.vfSupabase;
  if(!client)return;
  var PREFIX='rescue-case-photos/';
  var SIGNED_URL_TTL=300;
  var RENEW_AFTER_MS=240000;
  var busy=false;

  function sourceFor(value){
    var path=String(value||'');
    if(!path||/^https?:\/\//i.test(path))return null;
    if(path.indexOf(PREFIX)===0)return {bucket:'rescue-case-photos',path:path.slice(PREFIX.length)};
    return {bucket:'case-photos',path:path};
  }

  function signOne(item){
    if(!item)return Promise.resolve();
    var source=sourceFor(item.photoPath||item.ppath||'');
    if(!source)return Promise.resolve();
    if(item.photo&&item.photoSignedAt&&Date.now()-item.photoSignedAt<RENEW_AFTER_MS)return Promise.resolve();
    return client.storage.from(source.bucket).createSignedUrl(source.path,SIGNED_URL_TTL).then(function(result){
      if(result.error||!result.data||!result.data.signedUrl){
        item.photo='';item.photoUrl='';
        console.warn('A rescue photograph could not be signed:',result.error||'No signed URL returned');
        return;
      }
      item.photo=result.data.signedUrl;
      item.photoUrl=result.data.signedUrl;
      item.photoSignedAt=Date.now();
    }).catch(function(error){
      item.photo='';item.photoUrl='';
      console.warn('A rescue photograph could not be loaded:',error);
    });
  }

  function signLoadedCases(){
    if(busy)return Promise.resolve();
    var records=window.APP;
    if(!Array.isArray(records)||!records.length)return Promise.resolve();
    busy=true;
    return Promise.all(records.map(signOne)).then(function(){
      busy=false;
      if(typeof window.go==='function')window.go(true);
    }).catch(function(error){
      busy=false;
      console.warn('Private rescue photograph refresh failed:',error);
    });
  }

  function wrapLoader(name){
    var original=window[name];
    if(typeof original!=='function'||original.__vfPrivatePhotoWrapper)return;
    var wrapped=function(){
      var result;
      try{result=original.apply(this,arguments);}catch(error){return Promise.reject(error);}
      return Promise.resolve(result).then(function(value){
        return signLoadedCases().then(function(){return value;});
      });
    };
    wrapped.__vfPrivatePhotoWrapper=true;
    window[name]=wrapped;
  }

  wrapLoader('vfLoadPublicMore');
  wrapLoader('vfLoadFounderMore');
  wrapLoader('vfAfterLogin');
  window.vfSignPrivateCasePhotos=signLoadedCases;
  window.addEventListener('vf-public-appeals-loaded',signLoadedCases);
  window.setTimeout(signLoadedCases,900);
  window.setInterval(function(){
    if(document.visibilityState!=='hidden')signLoadedCases();
  },RENEW_AFTER_MS);
})();
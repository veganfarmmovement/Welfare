(function(){
  'use strict';
  var client=window.vfSupabase;
  if(!client)return;
  var PREFIX='rescue-case-photos/';
  var SIGNED_URL_TTL=300;
  var RENEW_AFTER_MS=240000;
  var busy=false;

  // APP is a top-level lexical binding in index.html, not window.APP.
  function appCases(){
    try{
      if(typeof APP!=='undefined'&&Array.isArray(APP))return APP;
    }catch(_error){}
    return Array.isArray(window.APP)?window.APP:[];
  }

  function notify(message){try{if(typeof toast==='function')toast(message);else console.info(message);}catch(_error){console.info(message);}}

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
        item.photo='';
        item.photoUrl='';
        if(item.live){item.live.photo='';item.live.photoUrl='';}
        console.warn('A rescue photograph could not be signed:',result.error||'No signed URL returned');
        return;
      }
      item.photo=result.data.signedUrl;
      item.photoUrl=result.data.signedUrl;
      item.photoSignedAt=Date.now();
      // Public case cards are rendered from the live snapshot, not APP.photo.
      if(item.live){item.live.photo=item.photo;item.live.photoUrl=item.photoUrl;}
    }).catch(function(error){
      item.photo='';
      item.photoUrl='';
      if(item.live){item.live.photo='';item.live.photoUrl='';}
      console.warn('A rescue photograph could not be loaded:',error);
    });
  }

  function signLoadedCases(){
    if(busy)return Promise.resolve();
    var records=appCases();
    if(!records.length)return Promise.resolve();
    busy=true;
    return Promise.all(records.map(signOne)).then(function(){
      busy=false;
      if(typeof window.syncCases==='function')window.syncCases();
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
  // Clear the case reference first, then delete the unreferenced object from private storage.
  // Shared objects are retained; failed Storage deletes are reported for Founder cleanup.
  window.rmPhoto=function(caseCode){
    var item=appCases().find(function(record){return String(record.id)===String(caseCode);});
    if(!item||!item.dbId){notify('This case is not linked to a saved record.');return;}
    if(window.vfRole!=='founder'){notify('Founder sign-in required.');return;}
    var storedPath=String(item.photoPath||item.ppath||'');
    var source=sourceFor(storedPath);
    client.from('rescue_cases').update({photo_path:null,photo_url:null}).eq('id',item.dbId).select('id').single().then(function(result){
      if(result.error)throw result.error;
      item.photo='';item.photoUrl='';item.photoPath='';item.ppath='';item.photoSignedAt=null;
      if(item.live){item.live.photo='';item.live.photoUrl='';}
      if(!source)return {removed:false,reason:'external'};
      // Do not remove an object that another case row still references.
      return client.from('rescue_cases').select('id').eq('photo_path',storedPath).neq('id',item.dbId).limit(1).then(function(refs){
        if(refs.error)return {removed:false,reason:'reference-check-failed',error:refs.error};
        if((refs.data||[]).length)return {removed:false,reason:'still-referenced'};
        return client.storage.from(source.bucket).remove([source.path]).then(function(deleted){
          if(deleted.error)return {removed:false,reason:'storage-delete-failed',error:deleted.error};
          return {removed:true};
        });
      });
    }).then(function(outcome){
      return Promise.resolve(window.vfReload?window.vfReload():signLoadedCases()).then(function(){
        if(outcome&&outcome.removed)notify('Case photograph and private storage object deleted.');
        else if(outcome&&outcome.reason==='still-referenced')notify('Case photograph removed. The shared storage object was retained because another case still references it.');
        else if(outcome&&outcome.reason==='external')notify('External photograph removed from the case record.');
        else notify('Case photograph removed from the case record. A private storage object may need Founder cleanup.');
        if(typeof window.go==='function')window.go(true);
      });
    }).catch(function(error){
      console.error('Founder photo removal failed:',error);
      notify('Photo removal failed: '+(error&&error.message?error.message:'Please try again.'));
    });
  };

  window.vfSignPrivateCasePhotos=signLoadedCases;
  window.addEventListener('vf-public-appeals-loaded',signLoadedCases);
  document.addEventListener('visibilitychange',function(){if(document.visibilityState==='visible')signLoadedCases();});
  window.setTimeout(signLoadedCases,900);
  window.setInterval(function(){
    if(document.visibilityState!=='hidden')signLoadedCases();
  },RENEW_AFTER_MS);
})();
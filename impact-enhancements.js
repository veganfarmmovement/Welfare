/* VEGANFARM Impact page — published records only; no sample case data or unverified financial totals. */
(function () {
  'use strict';
  if (typeof P === 'undefined') return;

  var styleText = `
    .vf-impact-hero{display:grid;grid-template-columns:minmax(0,1.3fr) minmax(120px,.7fr);align-items:center;gap:22px;padding:clamp(22px,4vw,40px);margin:10px 0 26px;border-radius:22px;background:#f2f8e8;color:#285c31;border:1px solid #d8e4c8}
    .vf-impact-hero-copy{background:#fffdf2;border:1px solid #d8e4c8;border-radius:18px;padding:clamp(20px,3vw,34px)}
    .vf-impact-hero h2{font:clamp(28px,4vw,42px)/1.08 Georgia,serif;color:#285c31;margin:0 0 12px}
    .vf-impact-hero p{color:#526653;line-height:1.7;margin:0;max-width:560px}
    .vf-impact-art{width:100%;max-width:200px;justify-self:center}
    .vf-impact-stats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:13px;margin:0 0 30px}
    .vf-impact-stat{padding:19px;border:1px solid #d8e4c8;border-radius:17px;background:#fffdf2;box-shadow:0 8px 24px rgba(40,92,49,.07)}
    .vf-impact-stat b{display:block;font:clamp(25px,3vw,34px) Georgia,serif;color:#286b36;margin-bottom:7px}
    .vf-impact-stat span{font-size:14px;line-height:1.5;color:#526653}
    .vf-completed-heading{display:flex;justify-content:space-between;align-items:end;gap:14px;margin:25px 0 15px}
    .vf-completed-heading h2{font:clamp(25px,3vw,34px) Georgia,serif;color:#285c31;margin:0}
    .vf-completed-heading p{font-size:14px;color:#526653;margin:0}
    .vf-completed-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:17px}
    .vf-completed-card{overflow:hidden;border:1px solid #d8e4c8;border-radius:19px;background:#fff;box-shadow:0 10px 28px rgba(40,92,49,.07)}
    .vf-completed-photo{height:215px;position:relative;overflow:hidden;background:#eaf3d9;display:grid;place-items:center}
    .vf-completed-photo img{width:100%;height:100%;object-fit:cover;display:block}
    .vf-completed-photo.photo-fallback:after{content:"VEGANFARM MOVEMENT · CASE STORY";position:absolute;inset:0;display:grid;place-items:center;text-align:center;padding:20px;color:#285c31;font-weight:800;letter-spacing:1px;background:#eaf3d9}
    .vf-completed-label{display:inline-flex;padding:6px 10px;border-radius:99px;background:#eaf3d9;color:#285c31;font-size:11px;font-weight:800;letter-spacing:.5px;text-transform:uppercase}
    .vf-completed-body{padding:18px}
    .vf-completed-body h3{font-size:18px;line-height:1.4;margin:11px 0 8px;color:#285c31}
    .vf-completed-location{font-size:14px;color:#526653;margin:0;line-height:1.6}
    .vf-illustrative{position:absolute;left:10px;bottom:10px;background:#fffdf2;color:#285c31;padding:6px 9px;border:1px solid #d8e4c8;border-radius:8px;font-size:11px}
    .vf-impact-note{margin:20px 0 0;padding:14px 17px;border-radius:14px;background:#fffdf2;border:1px solid #d8e4c8;color:#526653;font-size:14px;line-height:1.7}
    @media(max-width:850px){.vf-impact-stats{grid-template-columns:repeat(2,minmax(0,1fr))}.vf-completed-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
    @media(max-width:560px){.vf-impact-hero{grid-template-columns:1fr}.vf-impact-art{max-width:130px}.vf-completed-grid{grid-template-columns:1fr}.vf-completed-photo{height:230px}.vf-completed-heading{display:block}.vf-completed-heading p{margin-top:6px}}
    @media(prefers-reduced-motion:reduce){.vf-completed-card{transition:none}}
  `;
  if (!document.getElementById('vf-impact-polish')) {
    var style = document.createElement('style');
    style.id = 'vf-impact-polish';
    style.textContent = styleText;
    document.head.appendChild(style);
  }

  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (c) {
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
    });
  }
  function isCompleted(item) {
    return item.completed === true || /^(Completed|Recovered|Closed)$/i.test(String(item.st || item.status || ''));
  }
  function livePublishedCases() {
    var all = typeof APP !== 'undefined' && Array.isArray(APP) ? APP : [];
    return all.filter(function (item) {
      return item && item.pub === 'Published' && isCompleted(item);
    }).map(function (item) {
      return {
        id: item.id,
        name: item.n || item.animal_name || 'Animal rescue case',
        location: item.loc || item.location || 'Location not provided',
        photo: item.photo || '',
        illustrative: item.illustrative === true
      };
    });
  }
  function art() {
    return '<svg class="vf-impact-art" viewBox="0 0 220 190" role="img" aria-label="Illustration of a hand protecting an animal paw"><circle cx="110" cy="94" r="78" fill="#eaf3d9"/><path d="M47 126c-5-19 6-35 23-40l18-4 9-27c3-8 14-7 16 2l2 16 7-27c3-9 15-8 16 3l-1 30 9-17c4-8 16-4 14 6l-9 40c-3 15-15 26-32 28l-39 3c-16 1-28-4-33-13z" fill="#fffdf2" stroke="#b9d29c" stroke-width="4" stroke-linejoin="round"/><ellipse cx="108" cy="105" rx="18" ry="14" fill="#a8cf38"/><ellipse cx="84" cy="86" rx="7" ry="10" fill="#a8cf38"/><ellipse cx="101" cy="77" rx="7" ry="10" fill="#a8cf38"/><ellipse cx="119" cy="77" rx="7" ry="10" fill="#a8cf38"/><ellipse cx="136" cy="86" rx="7" ry="10" fill="#a8cf38"/></svg>';
  }
  function render() {
    var all = typeof APP !== 'undefined' && Array.isArray(APP) ? APP : [];
    var published = all.filter(function (item) { return item && item.pub === 'Published'; });
    var completed = livePublishedCases();
    var active = published.filter(function (item) {
      return !isCompleted(item);
    }).length;
    var cards = completed.map(function (item) {
      var photo = item.photo
        ? '<img src="' + esc(item.photo) + '" alt="' + esc(item.illustrative ? 'Illustrative animal-care photograph' : 'Photograph for ' + item.name) + '" loading="lazy" decoding="async" onerror="this.remove();this.parentNode.classList.add(\'photo-fallback\')">'
        : '';
      return '<article class="vf-completed-card"><div class="vf-completed-photo' + (photo ? '' : ' photo-fallback') + '">' + photo + (item.illustrative ? '<span class="vf-illustrative">Illustrative image</span>' : '') + '</div><div class="vf-completed-body"><span class="vf-completed-label">Published · completed</span><h3>' + esc(item.name) + '</h3><p class="vf-completed-location">Location: ' + esc(item.location) + '</p></div></article>';
    }).join('');
    return '<section class="vf-impact-hero"><div class="vf-impact-hero-copy"><h2>Every life matters.<br>Every act of care counts.</h2><p>VEGANFARM Movement supports animal treatment and community welfare through reviewed initiatives. The figures below are calculated from published rescue-case records.</p></div>' + art() + '</section>' +
      '<div class="vf-impact-stats"><div class="vf-impact-stat"><b>' + completed.length + '</b><span>Published completed rescue cases</span></div><div class="vf-impact-stat"><b>' + published.length + '</b><span>Total published rescue cases</span></div><div class="vf-impact-stat"><b>' + active + '</b><span>Active published rescue appeals</span></div></div>' +
      '<div class="vf-completed-heading"><h2>Completed animal cases</h2><p>Published case records · VEGANFARM Movement</p></div>' +
      '<div class="vf-completed-grid">' + (cards || '<p class="vf-impact-note">No completed rescue cases are currently published. Case stories will appear here after Founder review and publication.</p>') + '</div>' +
      '<p class="vf-impact-note">This page shows case counts from published records only. It does not estimate donations, expenses or financial impact. Financial figures should be checked against verified donation and approved expense records.</p>';
  }

  P.impact = function () {
    return head('Our impact', 'Published rescue cases and completed work by VEGANFARM Movement.') + S(render());
  };
  if (typeof go === 'function' && (location.hash || '').split('?')[0] === '#impact') go(true);
  window.addEventListener('hashchange', function () {
    if ((location.hash || '').split('?')[0] === '#impact') {
      setTimeout(function () { if (typeof go === 'function') go(true); }, 0);
    }
  });
})();

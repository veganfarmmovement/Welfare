/* VEGANFARM Impact page: render completed cases immediately, then merge live published records. */
(function () {
  'use strict';
  var seed = []; // Impact is derived only from published live records; no seeded case totals.EGANFARM Impact page: render completed cases immediately, then merge live published records. */
(function () {
  'use strict';
  var seed = []; // No seeded case data or financial totals.  var css = `
  .vf-impact-hero{display:grid;grid-template-columns:1.3fr .7fr;align-items:center;gap:22px;padding:clamp(24px,4vw,42px);margin:10px 0 26px;border-radius:24px;background:#f2f8e8;color:#285c31;border:1px solid #d8e4c8;overflow:hidden}
  .vf-impact-hero h2{font:clamp(28px,4vw,42px)/1.08 Georgia,serif;color:#285c31;margin:0 0 12px}.vf-impact-hero p{color:#526653;line-height:1.65;margin:0;max-width:560px}.vf-impact-art{width:100%;max-width:220px;justify-self:center}
  .vf-impact-stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:13px;margin-bottom:30px}.vf-impact-stat{padding:19px;border:1px solid #e3eadc;border-radius:17px;background:linear-gradient(150deg,#fff,#f7faef);box-shadow:0 8px 24px #2148280d}.vf-impact-stat b{display:block;font:clamp(24px,3vw,33px) Georgia,serif;color:#286b36;margin-bottom:7px}.vf-impact-stat span{font-size:13px;line-height:1.45;color:#596657}
  .vf-completed-heading{display:flex;justify-content:space-between;align-items:end;gap:14px;margin:25px 0 15px}.vf-completed-heading h2{font:clamp(25px,3vw,34px) Georgia,serif;color:#1c3023;margin:0}.vf-completed-heading p{font-size:13px;color:#667367;margin:0}
  .vf-completed-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:17px}.vf-completed-card{overflow:hidden;border:1px solid #e5eadf;border-radius:19px;background:#fff;box-shadow:0 12px 32px #19382112;transition:transform .2s ease,box-shadow .2s ease}.vf-completed-card:hover{transform:translateY(-4px);box-shadow:0 18px 36px #19382120}
  .vf-completed-photo{height:215px;position:relative;overflow:hidden;background:linear-gradient(135deg,#e7efdc,#cbdcb5)}.vf-completed-photo img{width:100%;height:100%;object-fit:cover;display:block}.vf-completed-photo.photo-fallback:after{content:"VEGANFARM MOVEMENT  •  ANIMAL CARE";position:absolute;inset:0;display:grid;place-items:center;text-align:center;padding:20px;color:#286b36;font-weight:800;letter-spacing:2px;background:radial-gradient(circle,#f7faef,#dce9cc)}
  .vf-completed-stamp{position:absolute;right:11px;bottom:11px;width:88px;height:88px;transform:rotate(-9deg);filter:drop-shadow(0 4px 8px #0003)}.vf-completed-stamp svg{width:100%;height:100%}.vf-completed-body{padding:18px}.vf-completed-label{display:inline-flex;padding:6px 10px;border-radius:99px;background:#eaf4df;color:#286b36;font-size:11px;font-weight:800;letter-spacing:.5px;text-transform:uppercase}.vf-completed-body h3{font-size:18px;margin:11px 0 8px;color:#203326}.vf-completed-amount{font-size:13px;line-height:1.5;color:#667367;margin:0 0 8px}.vf-completed-amount strong{display:block;font:25px Georgia,serif;color:#286b36;margin-top:3px}.vf-completed-location{font-size:13px;color:#596657;margin:0}.vf-illustrative{position:absolute;left:10px;bottom:10px;background:#fffdf2ed;color:#53604f;padding:5px 8px;border-radius:8px;font-size:10px}
  .vf-impact-note{margin:20px 0 0;padding:14px 17px;border-radius:14px;background:#f5f8ef;color:#596657;font-size:13px;line-height:1.6}
  @media(max-width:850px){.vf-impact-stats{grid-template-columns:repeat(2,minmax(0,1fr))}.vf-completed-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
  @media(max-width:560px){.vf-impact-hero{grid-template-columns:1fr}.vf-impact-art{max-width:145px}.vf-completed-grid{grid-template-columns:1fr}.vf-completed-photo{height:230px}.vf-completed-heading{display:block}.vf-completed-heading p{margin-top:6px}}
  @media(prefers-reduced-motion:reduce){.vf-completed-card{transition:none}.vf-completed-card:hover{transform:none}}
  `;
  var style = document.createElement('style'); style.id = 'vf-impact-polish'; style.textContent = css; document.head.appendChild(style);

  function money(v) { return '₹' + Number(v || 0).toLocaleString('en-IN'); }
  function esc(v) { return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) { return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]); }); }
  function cases() {
    var byId = {};
    seed.forEach(function (x) { byId[x.id] = x; });
    var live = typeof APP !== 'undefined' ? APP : [];
    live.forEach(function (x) {
      if (x.pub === 'Published' && (x.completed || /^(Completed|Recovered|Closed)$/i.test(x.st || ''))) {
        var old = byId[x.id] || {};
        byId[x.id] = {
          id: x.id, name: x.n || x.animal_name || old.name || 'Animal treatment support',
          amount: Number(x.completedAmount || (x.caseExtra && x.caseExtra.completed_amount) || old.amount || 0),
          location: x.loc || old.location || 'Location not provided',
          photo: x.photo || old.photo || '', illustrative: x.illustrative === true || old.illustrative === true
        };
      }
    });
    return Object.keys(byId).map(function (k) { return byId[k]; });
  }
  function stamp() {
    return '<div class="vf-completed-stamp" aria-label="VEGANFARM Movement case completed"><svg viewBox="0 0 180 180" role="img"><defs><path id="vf-impact-stamp-arc" d="M90 90m-65 0a65 65 0 1 1 130 0a65 65 0 1 1-130 0"/></defs><circle cx="90" cy="90" r="76" fill="#fffdf2" stroke="#286b36" stroke-width="4"/><circle cx="90" cy="90" r="66" fill="none" stroke="#286b36" stroke-width="1.5" stroke-dasharray="3 3"/><text fill="#286b36" font-size="12" font-weight="800" letter-spacing="1"><textPath href="#vf-impact-stamp-arc">VEGANFARM MOVEMENT • VEGANFARM MOVEMENT • </textPath></text><path d="M57 93l20 20 46-48" fill="none" stroke="#286b36" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/><text x="90" y="139" text-anchor="middle" fill="#286b36" font-size="10" font-weight="800">CASE COMPLETED</text></svg></div>';
  }
  function render() {
    var list = cases();
    var published = typeof APP !== 'undefined' ? APP.filter(function (x) { return x.pub === 'Published'; }).length : 0;
    var cards = list.map(function (x) {
      var photo = x.photo ? '<img src="' + esc(x.photo) + '" alt="' + (x.illustrative ? 'Illustrative veterinary photograph' : 'Animal photograph') + ' for ' + esc(x.name) + '" loading="lazy" decoding="async" onerror="this.remove();this.parentNode.classList.add(\\'photo-fallback\\')">' : '';
      return '<article class="vf-completed-card"><div class="vf-completed-photo' + (photo ? '' : ' photo-fallback') + '">' + photo + (x.illustrative ? '<span class="vf-illustrative">Illustrative image</span>' : '') + stamp() + '</div><div class="vf-completed-body"><span class="vf-completed-label">Published · completed</span><h3>' + esc(x.name) + '</h3><p class="vf-completed-location">Location: ' + esc(x.location) + '</p></div></article>';
    }).join('');
    var activeAppeals = typeof APP !== 'undefined' ? APP.filter(function (x) { return x.pub === 'Published' && !x.completed && !/^(Completed|Recovered|Closed)$/i.test(x.st || ''); }).length : 0;
    var art = '<svg class="vf-impact-art" viewBox="0 0 240 220" role="img" aria-label="Illustration of a hand protecting an animal paw"><circle cx="120" cy="108" r="88" fill="#fff" opacity=".12"/><path d="M55 145c-6-22 7-42 27-47l20-5 10-31c3-9 16-8 18 2l2 19 8-31c3-11 18-9 19 3l-1 35 10-20c5-9 19-4 16 7l-10 47c-3 18-17 31-37 33l-44 4c-18 1-33-5-38-16z" fill="#f5f8e9" stroke="#dceac8" stroke-width="4" stroke-linejoin="round"/><ellipse cx="119" cy="121" rx="21" ry="17" fill="#8eaf2d"/><ellipse cx="91" cy="99" rx="8" ry="11" fill="#8eaf2d"/><ellipse cx="111" cy="88" rx="8" ry="11" fill="#8eaf2d"/><ellipse cx="132" cy="88" rx="8" ry="11" fill="#8eaf2d"/><ellipse cx="151" cy="99" rx="8" ry="11" fill="#8eaf2d"/><path d="M66 174c24 17 78 20 111-3" fill="none" stroke="#d9e8c4" stroke-width="6" stroke-linecap="round"/></svg>';
    return '<section class="vf-impact-hero"><div><h2>Every life matters.<br>Every act of care counts.</h2><p>VEGANFARM Movement supports animal treatment and community welfare through Founder-approved work. Completed cases are shown below.</p></div>' + art + '</section><div class="vf-impact-stats"><div class="vf-impact-stat"><b>' + list.length + '</b><span>Published completed rescue cases</span></div><div class="vf-impact-stat"><b>' + published + '</b><span>Total published rescue cases</span></div><div class="vf-impact-stat"><b>' + activeAppeals + '</b><span>Active published rescue appeals</span></div></div><div class="vf-completed-heading"><h2>Completed animal cases</h2><p>Published case records · VEGANFARM Movement</p></div><div class="vf-completed-grid">' + (cards || '<p class="vf-impact-note">No completed rescue cases are currently published. Verified case stories will appear here after Founder review.</p>') + '</div><p class="vf-impact-note">Counts on this page are calculated from published rescue-case records. Donation and expense totals are shown only in the relevant case or transparency records when they can be verified.</p>';;;
  }
  if (typeof P !== 'undefined') P.impact = function () { return head('Our impact', 'Rescue cases and completed work by VEGANFARM Movement.') + S(render()); };
  if (typeof go === 'function' && (location.hash || '').split('?')[0] === '#impact') go(true);
  window.addEventListener('hashchange', function () {
    if ((location.hash || '').split('?')[0] === '#impact') setTimeout(function () { if (typeof go === 'function') go(true); }, 0);
  });
})();    var list = cases();
    var published = typeof APP !== 'undefined' ? APP.filter(function (x) { return x.pub === 'Published'; }).length : 0;
    var cards = list.map(function (x) {
      var photo = x.photo ? '<img src="' + esc(x.photo) + '" alt="' + (x.illustrative ? 'Illustrative veterinary photograph' : 'Animal photograph') + ' for ' + esc(x.name) + '" loading="eager" decoding="async" onerror="this.remove();this.parentNode.classList.add(\'photo-fallback\')">' : '';
      return '<article class="vf-completed-card"><div class="vf-completed-photo' + (photo ? '' : ' photo-fallback') + '">' + photo + (x.illustrative ? '<span class="vf-illustrative">Illustrative image</span>' : '') + stamp() + '</div><div class="vf-completed-body"><span class="vf-completed-label">Case completed</span><h3>' + esc(x.name) + '</h3><p class="vf-completed-location">Location: ' + esc(x.location) + '</p></div></article>';
    }).join('');
    var activeAppeals = typeof APP !== 'undefined' ? APP.filter(function (x) { return x.pub === 'Published' && !x.completed && !/^(Completed|Recovered|Closed)$/i.test(x.st || ''); }).length : 0;
    var art = '<svg class="vf-impact-art" viewBox="0 0 240 220" role="img" aria-label="Illustration of a hand protecting an animal paw"><circle cx="120" cy="108" r="88" fill="#fff" opacity=".12"/><path d="M55 145c-6-22 7-42 27-47l20-5 10-31c3-9 16-8 18 2l2 19 8-31c3-11 18-9 19 3l-1 35 10-20c5-9 19-4 16 7l-10 47c-3 18-17 31-37 33l-44 4c-18 1-33-5-38-16z" fill="#f5f8e9" stroke="#dceac8" stroke-width="4" stroke-linejoin="round"/><ellipse cx="119" cy="121" rx="21" ry="17" fill="#8eaf2d"/><ellipse cx="91" cy="99" rx="8" ry="11" fill="#8eaf2d"/><ellipse cx="111" cy="88" rx="8" ry="11" fill="#8eaf2d"/><ellipse cx="132" cy="88" rx="8" ry="11" fill="#8eaf2d"/><ellipse cx="151" cy="99" rx="8" ry="11" fill="#8eaf2d"/><path d="M66 174c24 17 78 20 111-3" fill="none" stroke="#d9e8c4" stroke-width="6" stroke-linecap="round"/></svg>';
    return '<section class="vf-impact-hero"><div><h2>Every life matters.<br>Every act of care counts.</h2><p>VEGANFARM Movement supports animal treatment and community welfare through Founder-approved work. Completed cases are shown below.</p></div>' + art + '</section><div class="vf-impact-stats"><div class="vf-impact-stat"><b>' + list.length + '</b><span>Published completed rescue cases</span></div><div class="vf-impact-stat"><b>' + published + '</b><span>Total published rescue cases</span></div><div class="vf-impact-stat"><b>' + activeAppeals + '</b><span>Active published rescue appeals</span></div></div><div class="vf-completed-heading"><h2>Completed animal cases</h2><p>Published case records · VEGANFARM Movement</p></div><div class="vf-completed-grid">' + (cards || '<p class="vf-impact-note">No completed rescue cases are currently published. Verified case stories will appear here after Founder review.</p>') + '</div><p class="vf-impact-note">Counts on this page are calculated from published rescue-case records. Donation and expense totals are shown only in the relevant case or transparency records when they can be verified.</p>';;
  }
  if (typeof P !== 'undefined') P.impact = function () { return head('Our impact', 'Rescue cases and completed work by VEGANFARM Movement.') + S(render()); };
  if (typeof go === 'function' && (location.hash || '').split('?')[0] === '#impact') go(true);
  window.addEventListener('hashchange', function () {
    if ((location.hash || '').split('?')[0] === '#impact') setTimeout(function () { if (typeof go === 'function') go(true); }, 0);
  });
})();

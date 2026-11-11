(function(){
  var nav=document.querySelector('.site-navigation');
  var toggle=document.querySelector('.nav-menu-toggle');
  var panel=document.querySelector('.nav-panel');
  var percent=document.querySelector('.nav-scroll-percent');
  if(!nav||!toggle||!panel)return;
  function close(){toggle.setAttribute('aria-expanded','false');panel.classList.remove('is-open');panel.inert=true}
  toggle.addEventListener('click',function(){var open=toggle.getAttribute('aria-expanded')!=='true';toggle.setAttribute('aria-expanded',String(open));panel.classList.toggle('is-open',open);panel.inert=!open});
  panel.querySelectorAll('a').forEach(function(a){a.addEventListener('click',close)});
  document.addEventListener('keydown',function(e){if(e.key==='Escape'){close();toggle.focus()}});
  document.addEventListener('pointerdown',function(e){if(!nav.contains(e.target)&&!panel.contains(e.target))close()});
  var theme=document.getElementById('themeBtn');
  if(theme){theme.addEventListener('click',function(){var night=document.body.classList.toggle('theme-night');theme.setAttribute('aria-pressed',String(night));theme.setAttribute('aria-label',night?'Switch to daylight lighting':'Switch to night lighting');document.documentElement.style.setProperty('--paper',night?'#092448':'#fff');document.documentElement.style.setProperty('--navy',night?'#0b2c5b':'#092448')})}
  var last=window.scrollY;
  function update(){var max=document.documentElement.scrollHeight-innerHeight;percent.textContent=Math.round(max?Math.min(1,scrollY/max)*100:0)+'%';var y=window.scrollY;if(y<80||toggle.getAttribute('aria-expanded')==='true'){nav.classList.remove('is-scroll-hidden')}else if(Math.abs(y-last)>8){nav.classList.toggle('is-scroll-hidden',y>last)}last=y}
  addEventListener('scroll',update,{passive:true});addEventListener('resize',update);update();
})();

/* Keep footer navigation consistent across every ENECO page. */
(function(){
  var links=document.querySelectorAll('.eneco-footer .footer-nav a');
  var routes={
    'Energy & Petroleum':'Products.html#energy',
    'Fertilizers':'Products.html#fertilizers',
    'Petrochemicals':'Products.html#petrochemicals',
    'Automotive & Industrial Fluids':'Products.html#fluids',
    'About ENECO':'About Us.html',
    'Trading & Logistics':'Trading & Logistics.html',
    'Global Presence':'Markets.html',
    'Quality & Compliance':'Quality & Compliance.html',
    'News & Insights':'News & Insights.html',
    'Technical documents':'Quality & Compliance.html',
    'Contact / RFQ':'Request a quote.html'
  };
  links.forEach(function(link){
    var label=link.textContent.trim();
    if(routes[label])link.href=routes[label];
  });
})();

/* Route every visible Request a quote control to the dedicated contact page. */
(function(){
  var quoteUrl='Request%20a%20quote.html';
  document.querySelectorAll('a').forEach(function(link){
    if(/request\s+a\s+quote/i.test(link.textContent||''))link.setAttribute('href',quoteUrl);
  });
})();

(function(){
  var form=document.querySelector('.rfq-form');
  var confirmation=document.getElementById('rfq-confirmation');
  if(!form||!confirmation)return;
  form.addEventListener('submit',function(event){
    event.preventDefault();
    if(!form.reportValidity())return;
    confirmation.hidden=false;
    confirmation.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'nearest'});
  });
})();





(function(){
  var section=document.querySelector('.logistics-reference-process');
  if(!section)return;
  var panels=[].slice.call(section.querySelectorAll('.reference-process-copy article'));
  var buttons=[].slice.call(section.querySelectorAll('.reference-process-nav button'));
  var figure=section.querySelector('.reference-process-visual figure');
  var firstImage=figure.querySelector('img');
  var sources=[firstImage.getAttribute('src'),'logistics-source.png','logistics-coordinate.png','logistics-arrange.png'];
  var images=sources.map(function(source,index){
    if(index===0)return firstImage;
    var image=document.createElement('img');
    image.src=source;
    image.alt='';
    figure.appendChild(image);
    return image;
  });
  var current=-1;
  function activate(index){
    if(index<0||index>=panels.length||index===current)return;
    current=index;
    panels.forEach(function(panel,i){panel.classList.toggle('is-active',i===index)});
    buttons.forEach(function(button,i){button.classList.toggle('is-active',i===index);button.setAttribute('aria-current',i===index?'step':'false')});
    images.forEach(function(image,i){image.classList.toggle('is-active',i===index)});
  }
  var wipeMotion=matchMedia('(min-width: 901px) and (prefers-reduced-motion: no-preference)');
  var reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
  var imageOffset=0;
  var previousFrame=0;
  function updateFromScroll(timestamp){
    var useWipe=wipeMotion.matches;
    section.classList.toggle('has-step-wipe',useWipe);
    var visual=figure.parentElement.getBoundingClientRect();
    var trigger=innerHeight*.52;
    var lines=panels.map(function(panel){return panel.getBoundingClientRect().top});
    var active=0;
    lines.forEach(function(line,index){
      if(line<=trigger)active=index;
    });
    var travel=0;
    if(useWipe&&active>0){
      var lowerEdge=Math.min(innerHeight-24,section.getBoundingClientRect().bottom-24);
      var frameTop=Math.min(Math.max(104,lines[active]),Math.max(104,lowerEdge-visual.height));
      travel=frameTop-visual.top;
    }
    var elapsed=previousFrame&&timestamp?Math.min(32,timestamp-previousFrame):16;
    previousFrame=timestamp||0;
    imageOffset=useWipe?imageOffset+(travel-imageOffset)*(1-Math.exp(-elapsed/95)):0;
    if(Math.abs(travel-imageOffset)<.25)imageOffset=travel;
    figure.style.setProperty('--process-image-travel',imageOffset+'px');
    if(Math.abs(travel-imageOffset)>=.25)requestUpdate();
    images.forEach(function(image,index){
      image.classList.toggle('has-entered',index<=active);
    });
    activate(active);
  }
  buttons.forEach(function(button,index){
    button.addEventListener('click',function(){
      var behavior=reducedMotion.matches?'auto':'smooth';
      if(!wipeMotion.matches){
        panels[index].scrollIntoView({behavior:behavior,block:'center'});
        return;
      }
      var pin=parseFloat(getComputedStyle(figure.parentElement).top);
      var top=panels[index].getBoundingClientRect().top+window.scrollY;
      window.scrollTo({top:top-pin,behavior:behavior});
    });
  });
  wipeMotion.addEventListener('change',updateFromScroll);
  var frame=0;
  function requestUpdate(){
    if(frame)return;
    frame=requestAnimationFrame(function(timestamp){frame=0;updateFromScroll(timestamp)});
  }
  addEventListener('scroll',requestUpdate,{passive:true});
  addEventListener('resize',requestUpdate);
  updateFromScroll();
})();

(function(){
  var globalSection=document.querySelector('#global-presence');
  var cta=document.querySelector('.supply-cta');
  if(globalSection&&cta&&globalSection.parentNode===cta.parentNode){
    var followsCta=!!(globalSection.compareDocumentPosition(cta)&Node.DOCUMENT_POSITION_FOLLOWING);
    if(!followsCta)cta.parentNode.insertBefore(globalSection,cta);
  }
})();

(function(){
  var section=document.querySelector('.trading-approach');
  if(!section||section.dataset.scrollReady)return;
  section.dataset.scrollReady='true';
  var copy=section.querySelector('.trading-approach-copy');
  var visual=section.querySelector('.trading-approach-visual');
  var card=section.querySelector('.approach-card');
  var cta=copy&&copy.querySelector('.eneco-split-button');
  if(!copy||!visual||!card||!cta)return;
  var stage=document.createElement('div');
  stage.className='trading-approach-stage';
  section.appendChild(stage);
  var bgCurrent=document.createElement('span');
  var bgNext=document.createElement('span');
  bgCurrent.className='trading-approach-bg trading-approach-bg-current';
  bgNext.className='trading-approach-bg trading-approach-bg-next';
  stage.append(bgCurrent,bgNext);
  stage.append(copy,visual);
  var steps=document.createElement('div');
  steps.className='trading-scroll-steps';
  steps.setAttribute('role','tablist');
  steps.setAttribute('aria-label','Trading and supply approach');
  steps.innerHTML='<button type="button" class="is-active" role="tab" aria-selected="true" data-step="0"><span>01</span><strong>Understand the requirement</strong><small>Bring product, technical and delivery needs into one clear enquiry.</small></button><button type="button" role="tab" aria-selected="false" data-step="1"><span>02</span><strong>Coordinate the next steps</strong><small>Align sourcing, commercial information and partner delivery arrangements.</small></button>';
  copy.insertBefore(steps,cta);
  copy.insertBefore(cta,steps);
  var buttons=steps.querySelectorAll('button');
  var data=[['Understand the requirement','Bring product, technical and delivery needs into one clear enquiry.','trading-ship-aerial.png','Container ship approaching an international port'],['Coordinate the next steps','Align sourcing, commercial information and partner delivery arrangements.','trading-port-sunrise.png','Container port and delivery coordination at sunrise']];
  var currentIndex=-1;
  var bgIndex=0;
  var visible=false;
  function render(index){
    if(index===currentIndex)return;
    currentIndex=index;
    buttons.forEach(function(button,i){var active=i===index;button.classList.toggle('is-active',active);button.setAttribute('aria-selected',String(active));});
    var title=card.querySelector('h3'),body=card.querySelector('p:not(.eyebrow)'),count=card.querySelector('.approach-card-footer span');
    if(title)title.textContent=data[index][0];if(body)body.textContent=data[index][1];if(body)body.setAttribute('data-step-number','0'+(index+1));if(count)count.textContent='0'+(index+1);
    card.classList.toggle('is-second',index===1);
    card.classList.remove('is-ready');
    if(visible)requestAnimationFrame(function(){card.classList.add('is-ready')});
    var incoming=index===0?bgCurrent:bgNext;
    var outgoing=index===0?bgNext:bgCurrent;
    incoming.style.backgroundImage='linear-gradient(90deg,rgba(9,36,72,.62),rgba(9,36,72,.12)),url("'+data[index][2]+'")';
    incoming.classList.add('is-visible');
    outgoing.classList.remove('is-visible');
    bgIndex=index;
    var image=visual.querySelector('img');
    if(image&&image.getAttribute('src')!==data[index][2]){image.classList.add('is-changing');setTimeout(function(){image.src=data[index][2];image.alt=data[index][3];requestAnimationFrame(function(){image.classList.remove('is-changing')})},220)}
    card.style.setProperty('--card-progress',((index+1)/data.length*100)+'%');
  }
  buttons.forEach(function(button){button.addEventListener('click',function(){render(Number(button.dataset.step));});});
  function update(){var rect=section.getBoundingClientRect(),progress=Math.max(0,Math.min(1,(innerHeight-rect.top)/(innerHeight+rect.height)));render(progress>=.5?1:0);section.style.setProperty('--trading-progress',(progress*100)+'%');}
  addEventListener('scroll',update,{passive:true});addEventListener('resize',update);update();
  var paused=false,autoIndex=0;
  new IntersectionObserver(function(entries){visible=entries[0].isIntersecting;if(visible){card.classList.remove('is-ready');requestAnimationFrame(function(){card.classList.add('is-ready')})}},{threshold:0.15}).observe(section);
  function advance(){if(visible&&!paused){autoIndex=(autoIndex+1)%data.length;render(autoIndex)}}
  // Hold each state long enough for the active progress segment to finish,
  // then crossfade the image as the next segment begins.
  setInterval(advance,5600);
  section.addEventListener('mouseenter',function(){paused=true});
  section.addEventListener('mouseleave',function(){paused=false});
  section.addEventListener('focusin',function(){paused=true});
  section.addEventListener('focusout',function(){paused=false});
})();

(function(){
  var tabs=document.querySelectorAll('[data-mission-tab]');
  var panels=document.querySelectorAll('[data-mission-panel]');
  if(!tabs.length)return;
  tabs.forEach(function(tab){tab.addEventListener('click',function(){if(tab.disabled)return;var target=tab.getAttribute('data-mission-tab');if(tab.classList.contains('is-active'))return;tabs.forEach(function(item){var active=item===tab;item.classList.toggle('is-active',active);item.setAttribute('aria-selected',String(active))});var activePanel=[].find.call(panels,function(panel){return panel.getAttribute('data-mission-panel')===target});panels.forEach(function(panel){panel.hidden=true;panel.classList.remove('is-active')});if(activePanel){activePanel.hidden=false;requestAnimationFrame(function(){activePanel.classList.add('is-active')})}})});
})();

(function(){
  var stage=document.querySelector('.mission-sticky-stage');
  var section=stage&&stage.querySelector('.mission-vision');
  var tabs=document.querySelectorAll('[data-mission-tab]');
  if(!stage||!section||tabs.length<2)return;
  var last=-1;
  var targetReveal=0;
  var currentReveal=0;
  var revealFrame=0;
  function animateReveal(){
    currentReveal+=(targetReveal-currentReveal)*.12;
    if(Math.abs(targetReveal-currentReveal)<.001)currentReveal=targetReveal;
    section.style.setProperty('--mission-image-reveal',String(currentReveal));
    if(currentReveal!==targetReveal)revealFrame=requestAnimationFrame(animateReveal);
    else revealFrame=0;
  }
  function update(){
    var range=Math.max(1,stage.offsetHeight-section.offsetHeight);
    var progress=Math.max(0,Math.min(1,-stage.getBoundingClientRect().top/range));
    targetReveal=Math.max(0,Math.min(1,(progress-.5)*2));
    if(!revealFrame)revealFrame=requestAnimationFrame(animateReveal);
    var next=progress>=.5?1:0;
    if(next===last)return;
    last=next;
    if(!tabs[next].classList.contains('is-active'))tabs[next].click();
  }
  addEventListener('scroll',update,{passive:true});
  addEventListener('resize',update);
  update();
})();

(function(){
  var tabs=document.querySelectorAll('[data-mission-tab]');
  var copy=document.querySelector('.mission-copy');
  if(!copy||tabs.length<2)return;
  var changeTimer;
  var heading=copy.querySelector('.section-heading');
  var subheading=copy.querySelector('.mission-subheading');
  var body=copy.querySelector('.body-large');
  var states={
    mission:['Our mission','Connect requirements with supply.','Support professional buyers with clear product information and coordinated sourcing and delivery arrangements.'],
    'mission-two':['Our vision','Build lasting trading relationships.','Earn trust through professional communication, transparent coordination and a consistent focus on client requirements.']
  };
  tabs.forEach(function(tab){tab.addEventListener('click',function(){
    var state=states[tab.getAttribute('data-mission-tab')];
    if(!state)return;
    clearTimeout(changeTimer);
    copy.classList.add('is-changing');
    changeTimer=setTimeout(function(){
      heading.textContent=state[0];
      subheading.textContent=state[1];
      body.textContent=state[2];
      copy.classList.remove('is-changing');
      copy.classList.add('is-entering');
      requestAnimationFrame(function(){
        requestAnimationFrame(function(){copy.classList.remove('is-entering')});
      });
    },850);
  })});
})();

(function(){
  var shapes={corner:['M0 0h5.63c7.808 0 13.536 7.337 11.642 14.91l-6.09 24.359A11.527 11.527 0 0 1 0 48V0Z','M0 0c5.29 0 9.9 3.6 11.183 8.731l6.09 24.359C19.165 40.663 13.437 48 5.63 48H0V0Z'],blob:['M6.728 9.09A12 12 0 0 1 18.369 0H39c6.627 0 12 5.373 12 12v24c0 6.627-5.372 12-12 12H12.37C4.561 48-1.167 40.663.727 33.09l6-24Z','M.728 14.91C-1.166 7.338 4.562 0 12.369 0H39c6.628 0 12 5.372 12 12v24c0 6.628-5.372 12-12 12H18.37a12 12 0 0 1-11.641-9.09l-6-24Z']};
  function svg(width,path,extra){return '<svg xmlns="http://www.w3.org/2000/svg" width="'+width+'" height="48" viewBox="0 0 '+width+' 48" fill="none" aria-hidden="true"><path d="'+path+'" '+(extra||'')+'></path></svg>'}
  function samples(path,d){path.setAttribute('d',d);var len=path.getTotalLength();return Array.from({length:128},function(_,i){var p=path.getPointAtLength(len*i/128);return [p.x,p.y]})}
  document.querySelectorAll('.eneco-split-button').forEach(function(button){
    var label=button.textContent.trim().replace(/[↗→]/g,'').trim();button.replaceChildren();
    var text=document.createElement('span');text.className='btn_label';text.textContent=label;
    var corner=document.createElement('span');corner.className='label_corner';corner.innerHTML=svg(18,shapes.corner[0]);text.append(corner);
    var icon=document.createElement('span');icon.className='btn_icon';icon.setAttribute('aria-hidden','true');icon.innerHTML=svg(51,shapes.blob[0]);button.append(text,icon);
    var parts=[{path:corner.querySelector('path'),shape:'corner'},{path:icon.querySelector('path'),shape:'blob'}];parts.forEach(function(part){part.from=samples(part.path,shapes[part.shape][0]);part.to=samples(part.path,shapes[part.shape][1]);part.path.setAttribute('d',shapes[part.shape][0])});
    var progress=0,animation=0;
    function morph(active){cancelAnimationFrame(animation);var start=performance.now(),from=progress,target=active?1:0;if(matchMedia('(prefers-reduced-motion: reduce)').matches){progress=target;parts.forEach(function(p){p.path.setAttribute('d',shapes[p.shape][target])});return}function frame(now){var t=Math.min(1,(now-start)/300),e=1-Math.pow(1-t,3);progress=from+(target-from)*e;parts.forEach(function(p){var d=p.from.map(function(a,i){var b=p.to[i];return(i?'L':'M')+(a[0]+(b[0]-a[0])*progress).toFixed(3)+' '+(a[1]+(b[1]-a[1])*progress).toFixed(3)}).join('')+'Z';p.path.setAttribute('d',t===1?shapes[p.shape][target]:d)});if(t<1)animation=requestAnimationFrame(frame)}animation=requestAnimationFrame(frame)}
    button.addEventListener('pointerenter',function(){morph(true)});button.addEventListener('pointerleave',function(){morph(false)});
  });
})();

(function(){
  var items=document.querySelectorAll('.value-item');
  var description=document.querySelector('.value-description');
  var descriptions={professional:'A structured approach to product and commercial enquiries.',transparent:'Clear communication about requirements, documentation and arrangements.',connected:'An international perspective on sourcing and supply coordination.'};
  if(!items.length||!description)return;
  items.forEach(function(item){item.addEventListener('mouseenter',function(){activate(item)});item.addEventListener('focus',function(){activate(item)});item.addEventListener('click',function(){activate(item)})});
  function activate(item){if(item.classList.contains('is-active'))return;items.forEach(function(other){var active=other===item;other.classList.toggle('is-active',active);other.setAttribute('aria-selected',String(active))});description.classList.add('is-changing');setTimeout(function(){description.querySelector('.value-description-copy').textContent=descriptions[item.dataset.value];description.classList.remove('is-changing')},220)}
})();

(function(){
  var section=document.querySelector('.values-showcase');
  var head=document.querySelector('.values-showcase-head');
  var items=document.querySelectorAll('.value-item');
  var description=document.querySelector('.value-description-copy');
  var tickGroups=document.querySelectorAll('.value-ticks');
  if(!section||!items.length||!description)return;
  var copy={professional:'A structured approach to product and commercial enquiries.',transparent:'Clear communication about requirements, documentation and arrangements.',connected:'An international perspective on sourcing and supply coordination.'};
  var current=1;
  tickGroups.forEach(function(group){for(var i=0;i<30;i++){var line=document.createElement('i');line.className='tick-line';group.append(line)}});
  function renderTicks(progress){var center=Math.round(progress*29);tickGroups.forEach(function(group){group.querySelectorAll('.tick-line').forEach(function(line,i){var distance=Math.abs(i-center),active=distance<=2;var widths=[16,27,32,27,16];line.classList.toggle('is-active',active);line.style.width=(active?widths[distance+2]:16)+'px';line.style.opacity=active?'1':'.8'})})}
  function update(){
    var rect=section.getBoundingClientRect();
    var travel=Math.max(1,section.offsetHeight-innerHeight);
    var progress=Math.max(0,Math.min(1,-rect.top/travel));
    if(head)head.classList.toggle('is-pinned',rect.top<=0&&rect.bottom>=innerHeight);
    var index=Math.min(items.length-1,Math.floor(progress*items.length));
    section.style.setProperty('--value-progress',progress.toFixed(3));
    section.style.setProperty('--value-description-shift',((index-1)*138)+'px');
    renderTicks(index/(items.length-1));
    if(index===current)return;
    current=index;
    items.forEach(function(item,i){var active=i===index;item.classList.toggle('is-active',active);item.setAttribute('aria-selected',String(active))});
    description.classList.add('is-changing');
    setTimeout(function(){description.textContent=copy[items[index].dataset.value];description.classList.remove('is-changing')},220);
  }
  addEventListener('scroll',update,{passive:true});addEventListener('resize',update);update();
})();

(function(){
  var cards=document.querySelectorAll('.logistics-option-grid article');
  if(!cards.length)return;
  function activate(card){cards.forEach(function(item){var active=item===card;item.classList.toggle('is-expanded',active);item.setAttribute('aria-expanded',String(active))})}
  cards.forEach(function(card){
    card.addEventListener('pointerenter',function(event){
      if(event.pointerType==='mouse')activate(card);
    });
    card.addEventListener('click',function(){activate(card)});
    card.addEventListener('focus',function(){
      if(card.matches(':focus-visible'))activate(card);
    });
    card.addEventListener('keydown',function(event){
      if(event.key==='Enter'||event.key===' '){
        event.preventDefault();
        activate(card);
      }
    });
  });
})();





(function(){
  var toggle=document.querySelector('.filter-toggle');
  var filters=document.querySelector('.directory-filters');
  var results=document.querySelector('.directory-results');
  var views=document.querySelectorAll('.view-toggle button');
  var search=document.getElementById('product-search-input');
  if(!toggle||!filters||!results)return;
  toggle.addEventListener('click',function(){var open=toggle.getAttribute('aria-expanded')!=='true';toggle.setAttribute('aria-expanded',String(open));filters.classList.toggle('is-collapsed',!open)});
  views.forEach(function(view){view.addEventListener('click',function(){views.forEach(function(item){var active=item===view;item.classList.toggle('is-active',active);item.setAttribute('aria-pressed',String(active))});results.classList.toggle('is-technical',view!==views[0])})});
  if(search){var cards=Array.from(results.querySelectorAll('.directory-card'));search.addEventListener('input',function(){var query=search.value.toLowerCase().trim();cards.forEach(function(card){card.hidden=query&&!card.textContent.toLowerCase().includes(query)})})}
})();

(function(){
  var tabs=document.querySelectorAll('.markets-region-tabs [data-region]'), pins=document.querySelectorAll('.markets-map [data-region]'), panel=document.querySelector('.markets-region-panel');
  if(!tabs.length||!panel)return;
  var copy={
    'Middle East':'Reserved for confirmed countries served, regional supply information and logistics arrangements. Contact ENECO to discuss your destination and product requirements.',
    'Asia':'Reserved for confirmed countries served, regional supply information and logistics arrangements. Contact ENECO to discuss your destination and product requirements.',
    'Africa':'Reserved for confirmed countries served, regional supply information and logistics arrangements. Contact ENECO to discuss your destination and product requirements.',
    'Europe':'Reserved for confirmed countries served, regional supply information and logistics arrangements. Contact ENECO to discuss your destination and product requirements.',
    'Other regions':'Reserved for confirmed countries served, regional supply information and logistics arrangements. Contact ENECO to discuss your destination and product requirements.'
  };
  var cardAnimation;
  var reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
  async function showRegion(region){
    if(cardAnimation)cardAnimation.cancel();
    var animate=!reducedMotion.matches&&typeof panel.animate==='function';
    if(animate&&!panel.hidden){
      var exit=panel.animate([{opacity:getComputedStyle(panel).opacity},{opacity:0,transform:'translateY(8px)'}],{duration:140,easing:'ease-in',fill:'forwards'});
      cardAnimation=exit;
      try{await exit.finished}catch(error){return}
      if(cardAnimation!==exit)return;
      exit.cancel();
    }
    panel.querySelector('h2').textContent=region;
    panel.querySelector('p:not(.eyebrow)').textContent=copy[region];
    panel.hidden=false;
    cardAnimation=animate?panel.animate(
      [{opacity:0,transform:'translateY(8px)'},{opacity:1,transform:'translateY(0)'}],
      {duration:260,easing:'ease-out'}
    ):null;
  }
  function activate(region){
    tabs.forEach(function(tab){var active=tab.dataset.region===region;tab.classList.toggle('is-active',active);tab.setAttribute('aria-selected',String(active));});
    pins.forEach(function(pin){var active=pin.dataset.region===region;pin.classList.toggle('is-active',active);pin.setAttribute('aria-pressed',String(active));});
    showRegion(region);
  }
  tabs.forEach(function(tab){tab.addEventListener('click',function(){activate(tab.dataset.region)})});pins.forEach(function(pin){pin.addEventListener('click',function(){activate(pin.dataset.region)})});
})();

(function(){
  var cards=document.querySelector('.markets-supply-steps');
  if(!cards||!('IntersectionObserver' in window)||window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  cards.classList.add('is-reveal-ready');
  var observer=new IntersectionObserver(function(entries){if(entries.some(function(entry){return entry.isIntersecting})){cards.classList.add('is-revealed');observer.disconnect()}},{threshold:.16});
  observer.observe(cards);
})();






(function () {
  var selectors = Array.from(document.querySelectorAll('.product-detail-page :is(#overview-grade,#spec-grade,#quote-grade)'));
  var links = document.querySelectorAll('[data-product-quote]');
  var caption = document.querySelector('.product-detail-page .spec-table-wrap caption');

  function syncGrade(grade) {
    selectors.forEach(function (select) {
      if (Array.from(select.options).some(function (option) { return option.value === grade; })) select.value = grade;
    });
    if (caption) caption.textContent = document.getElementById('spec-grade').value + ' · Specification layout';
    var params = new URLSearchParams({product: 'Road Bitumen', grade: grade});
    links.forEach(function (link) { link.href = 'Request%20a%20quote.html?' + params + '#rfq-form'; });
  }

  if (selectors.length) {
    selectors.forEach(function (select) {
      select.addEventListener('change', function () { syncGrade(select.value); });
    });
    syncGrade(selectors[0].value);
  }

  var form = document.querySelector('.request-quote-page #rfq-form');
  if (!form) return;
  var params = new URLSearchParams(location.search);
  var product = form.elements.namedItem('product');
  var grade = form.elements.namedItem('grade');
  if (product && Array.from(product.options).some(function (option) { return option.value === params.get('product'); })) {
    product.value = params.get('product');
    if (grade && params.has('grade')) grade.value = params.get('grade').slice(0, 100);
  }
})();

(function () {
  var filter = document.querySelector('.news-filter, .directory-tabs');
  if (!filter) return;
  var tabs = Array.from(filter.querySelectorAll('a'));
  var cards = document.querySelectorAll('.news-grid [data-category], .directory-results [data-category]');

  function update() {
    var selected = tabs.find(function (tab) { return tab.hash === location.hash; }) || tabs[0];
    tabs.forEach(function (tab) {
      tab.classList.toggle('is-active', tab === selected);
      if (tab === selected) tab.setAttribute('aria-current', 'true');
      else tab.removeAttribute('aria-current');
    });
    cards.forEach(function (card) {
      var visible = selected === tabs[0] || '#' + card.dataset.category === selected.hash;
      card.hidden = !visible;
      card.style.display = visible ? '' : 'none';
    });
  }

  filter.addEventListener('click', function (event) {
    var tab = event.target.closest('a');
    if (!tabs.includes(tab) || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    if (location.hash !== tab.hash) history.pushState(null, '', tab.hash);
    update();
  });
  addEventListener('hashchange', update);
  update();
})();

(function () {
  var logo = document.querySelector('.site-navigation a.header-wordmark img');
  if (!logo) return;
  var darkLogo = logo.getAttribute('src');
  var lightLogo = 'eneco-wordmark-light.svg';
  var preload = new Image();
  preload.src = lightLogo;
  var surfaces = '.mission-vision, .mission-sticky-stage, .trading-reach, .trading-approach, ' +
    '.markets-global-presence, .logistics-reference-process, .credentials-track, ' +
    '.product-specifications, .product-enquiry, .supply-cta, .eneco-footer, .contact-google-map';
  var frame = 0;

  function update() {
    frame = 0;
    var bounds = logo.getBoundingClientRect();
    var beneath = document.elementsFromPoint(bounds.left + bounds.width / 2, bounds.top + bounds.height / 2);
    var surface = beneath.find(function (node) {
      return node.closest('main, .eneco-footer') && !node.closest('.site-navigation');
    });
    var next = surface && surface.closest(surfaces) ? lightLogo : darkLogo;
    if (logo.getAttribute('src') !== next) logo.src = next;
  }

  function schedule() {
    if (!frame) frame = requestAnimationFrame(update);
  }

  addEventListener('scroll', schedule, {passive: true});
  addEventListener('resize', schedule);
  addEventListener('pageshow', schedule);
  document.addEventListener('click', schedule);
  schedule();
})();

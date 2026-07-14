(function(){'use strict';
function qs(s,c){return(c||document).querySelector(s)}
function qsa(s,c){return Array.from((c||document).querySelectorAll(s))}
function money(cents,currency){return(cents/100).toLocaleString(undefined,{style:'currency',currency:currency||'USD',minimumFractionDigits:2})}
function round2(n){return Math.round(n*100)/100}

function getActiveTier(tiers,count){
  if(!tiers||!tiers.length)return null;
  const q=tiers.filter(t=>count>=t.minItems).sort((a,b)=>b.minItems-a.minItems);
  return q[0]||null;
}
function calcPricing(selected,tiers){
  const subtotal=selected.reduce((s,p)=>s+p.price,0);
  const tier=getActiveTier(tiers,selected.length);
  const discountPct=tier?tier.discount:0;
  const discountAmt=round2(subtotal*discountPct/100);
  const finalTotal=round2(subtotal-discountAmt);
  return{subtotal,discountPct,discountAmt,finalTotal,tier};
}

const ICON_CHECK='<svg viewBox="0 0 24 24" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>';
const ICON_REMOVE='<svg viewBox="0 0 24 24" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';

function buildCard(product,currency){
  const div=document.createElement('div');
  div.className='bb-card'+(product.available?'':' is-soldout');
  div.dataset.productId=product.id;
  div.dataset.variantId=product.variantId;
  div.dataset.price=product.price;
  const img=product.image?`<img class="bb-card__img" src="${product.image}" alt="${product.title}" loading="lazy" width="300" height="300">`:'<div class="bb-card__img" aria-hidden="true"></div>';
  div.innerHTML=`<div class="bb-card__img-wrap">${img}<span class="bb-card__check" aria-hidden="true">${ICON_CHECK}</span></div><div class="bb-card__body"><p class="bb-card__title">${product.title}</p><p class="bb-card__price">${money(product.price,currency)}</p><div class="bb-card__btn"><button class="bb-card__add-btn" type="button"${product.available?'':' disabled'}>${product.available?'Add to bundle':'Sold out'}</button></div></div>`;
  return div;
}
function buildPanelItem(product,currency){
  const li=document.createElement('div');
  li.className='bb-panel__item';
  li.dataset.productId=product.id;
  li.innerHTML=`${product.image?`<img class="bb-panel__item-img" src="${product.image}" alt="${product.title}" loading="lazy" width="44" height="44">`:'<div class="bb-panel__item-img" aria-hidden="true"></div>'}<div class="bb-panel__item-info"><div class="bb-panel__item-title">${product.title}</div><div class="bb-panel__item-price">${money(product.price,currency)}</div></div><button class="bb-panel__item-remove" type="button" aria-label="Remove ${product.title}">${ICON_REMOVE}</button>`;
  return li;
}

function BundleBuilder(rootEl){
  const bundleId=rootEl.dataset.bundleId;
  const proxyUrl=rootEl.dataset.proxyUrl;
  const currency=rootEl.dataset.currency||'USD';
  let config=null,products=[],selected=[];

  const loadingEl=qs('.bb-loading',rootEl),errorEl=qs('.bb-error',rootEl),errorMsgEl=qs('.bb-error__msg',rootEl),wrapEl=qs('.bb-wrap',rootEl);
  const tabsEl=qs('.bb-tabs',rootEl),panesEl=qs('.bb-panes',rootEl);
  const panelCountEl=qs('.bb-panel__count-num',rootEl),panelItemsEl=qs('.bb-panel__items',rootEl),panelEmptyEl=qs('.bb-panel__empty',rootEl);
  const tierLabelEl=qs('.bb-panel__tier-label',rootEl),comparePriceEl=qs('.bb-panel__compare-price',rootEl),finalPriceEl=qs('.bb-panel__final-price',rootEl);
  const progressEl=qs('.bb-panel__progress-hint',rootEl),ctaBtn=qs('.bb-panel__cta',rootEl),ctaLabelEl=qs('.bb-panel__cta-label',rootEl),ctaSpinnerEl=qs('.bb-panel__cta-spinner',rootEl);
  const headerTitleEl=qs('.bb-header__title',rootEl),headerSubEl=qs('.bb-header__subtitle',rootEl);

  function init(){
    if(!bundleId){showError('No Bundle ID configured. Please add a Bundle ID in the section settings.');return;}
    fetch(`${proxyUrl}?bundle_id=${encodeURIComponent(bundleId)}`)
      .then(r=>{if(!r.ok)throw new Error(`Server returned ${r.status}`);return r.json();})
      .then(data=>{config=data.bundle;products=data.products||[];render();})
      .catch(err=>{console.error('[BundleBuilder]',err);showError('Could not load bundle. Please try refreshing the page.');});
  }

  function render(){
    if(config.display){
      headerTitleEl.textContent=config.display.heading||'';
      headerSubEl.textContent=config.display.subtitle||'';
      if(config.display.ctaLabel)ctaLabelEl.textContent=config.display.ctaLabel;
    }
    const groups=groupByCollection(products,config);
    renderTabs(groups);renderPanes(groups);
    const firstTab=qs('.bb-tab',tabsEl),firstPane=qs('.bb-pane',panesEl);
    if(firstTab)activateTab(firstTab,firstPane);
    loadingEl.hidden=true;wrapEl.hidden=false;
    ctaBtn.addEventListener('click',handleAddToCart);
  }

  function groupByCollection(prods,cfg){
    if(cfg.sourceType==='collections'&&cfg.collections){
      return cfg.collections.map(col=>({label:col.title||col.id,id:col.id,products:prods.filter(p=>p.collectionId===col.id)}));
    }
    return[{label:cfg.title||'Products',id:'all',products:prods}];
  }

  function renderTabs(groups){
    tabsEl.innerHTML='';
    groups.forEach((group,idx)=>{
      const btn=document.createElement('button');
      btn.className='bb-tab';btn.type='button';btn.role='tab';
      btn.setAttribute('aria-selected','false');btn.setAttribute('aria-controls',`bb-pane-${idx}`);
      btn.id=`bb-tab-${idx}`;btn.textContent=group.label;btn.dataset.idx=idx;
      btn.addEventListener('click',()=>activateTab(btn,qs(`#bb-pane-${idx}`,panesEl)));
      tabsEl.appendChild(btn);
    });
  }

  function renderPanes(groups){
    panesEl.innerHTML='';
    groups.forEach((group,idx)=>{
      const pane=document.createElement('div');
      pane.className='bb-pane';pane.id=`bb-pane-${idx}`;
      pane.setAttribute('role','tabpanel');pane.setAttribute('aria-labelledby',`bb-tab-${idx}`);pane.hidden=true;
      const grid=document.createElement('div');grid.className='bb-grid';
      group.products.forEach(product=>{
        const card=buildCard(product,currency);
        card.querySelector('.bb-card__add-btn').addEventListener('click',()=>toggleProduct(product,card));
        grid.appendChild(card);
      });
      if(!group.products.length){const e=document.createElement('p');e.textContent='No products in this collection yet.';e.style.color='#999';grid.appendChild(e);}
      pane.appendChild(grid);panesEl.appendChild(pane);
    });
  }

  function activateTab(btn,pane){
    qsa('.bb-tab',tabsEl).forEach(t=>t.setAttribute('aria-selected','false'));
    qsa('.bb-pane',panesEl).forEach(p=>{p.classList.remove('is-active');p.hidden=true;});
    btn.setAttribute('aria-selected','true');pane.classList.add('is-active');pane.hidden=false;
  }

  function toggleProduct(product,cardEl){
    const already=selected.findIndex(p=>p.id===product.id);
    if(already!==-1){
      selected.splice(already,1);cardEl.classList.remove('is-selected');
      cardEl.querySelector('.bb-card__add-btn').textContent='Add to bundle';
    }else{
      const max=config.maxItems||Infinity;
      if(selected.length>=max){showProgressHint(`Maximum ${max} items reached.`);return;}
      selected.push(product);cardEl.classList.add('is-selected');
      cardEl.querySelector('.bb-card__add-btn').textContent='Remove';
    }
    syncPanel();
  }

  function syncPanel(){
    panelCountEl.textContent=selected.length;
    panelItemsEl.innerHTML='';
    if(selected.length===0){panelItemsEl.appendChild(panelEmptyEl);}
    else{
      panelEmptyEl.remove();
      selected.forEach(product=>{
        const row=buildPanelItem(product,currency);
        row.querySelector('.bb-panel__item-remove').addEventListener('click',()=>removeProduct(product));
        panelItemsEl.appendChild(row);
      });
    }
    const{subtotal,discountPct,finalTotal,tier}=calcPricing(selected,config.tiers||[]);
    if(selected.length===0){comparePriceEl.textContent='';finalPriceEl.textContent='';tierLabelEl.textContent='';}
    else if(discountPct>0){
      comparePriceEl.textContent=money(subtotal*100,currency);
      finalPriceEl.textContent=money(finalTotal*100,currency);
      tierLabelEl.textContent=tier?tier.label:`Save ${discountPct}%`;
    }else{
      comparePriceEl.textContent='';finalPriceEl.textContent=money(subtotal*100,currency);tierLabelEl.textContent='';
    }
    const min=config.minItems||1,max=config.maxItems;
    if(selected.length<min){showProgressHint(`Add ${min-selected.length} more item${min-selected.length!==1?'s':''} to unlock your bundle.`);}
    else if(max&&selected.length>=max){showProgressHint('Bundle complete! Ready to add to cart.');}
    else{
      const nextTier=(config.tiers||[]).filter(t=>t.minItems>selected.length).sort((a,b)=>a.minItems-b.minItems)[0];
      showProgressHint(nextTier?`Add ${nextTier.minItems-selected.length} more to save ${nextTier.discount}%.`:'');
    }
    const canCheckout=selected.length>=min;
    ctaBtn.disabled=!canCheckout;ctaBtn.setAttribute('aria-disabled',String(!canCheckout));
  }

  function removeProduct(product){
    const idx=selected.findIndex(p=>p.id===product.id);if(idx===-1)return;
    selected.splice(idx,1);
    const card=qs(`.bb-card[data-product-id="${product.id}"]`,panesEl);
    if(card){card.classList.remove('is-selected');const btn=card.querySelector('.bb-card__add-btn');if(btn)btn.textContent='Add to bundle';}
    syncPanel();
  }

  function showProgressHint(msg){if(progressEl)progressEl.textContent=msg;}

  function handleAddToCart(){
    if(!selected.length)return;
    setCtaLoading(true);
    const items=selected.map(p=>({id:parseInt(p.variantId,10),quantity:1}));
    fetch('/cart/add.js',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({items})})
      .then(r=>{if(!r.ok)return r.json().then(d=>{throw new Error(d.description||`Cart error ${r.status}`);});return r.json();})
      .then(()=>{
        document.dispatchEvent(new CustomEvent('cart:refresh',{bubbles:true}));
        document.dispatchEvent(new CustomEvent('theme:cart:open',{bubbles:true}));
        selected=[];
        qsa('.bb-card.is-selected',panesEl).forEach(c=>{c.classList.remove('is-selected');const btn=c.querySelector('.bb-card__add-btn');if(btn)btn.textContent='Add to bundle';});
        syncPanel();setCtaLoading(false);
      })
      .catch(err=>{console.error('[BundleBuilder] cart error:',err);alert(err.message||'Could not add to cart. Please try again.');setCtaLoading(false);});
  }

  function setCtaLoading(on){ctaBtn.disabled=on;ctaLabelEl.hidden=on;ctaSpinnerEl.hidden=!on;}
  function showError(msg){loadingEl.hidden=true;errorMsgEl.textContent=msg;errorEl.hidden=false;}

  init();
}

function boot(){document.querySelectorAll('.bb-root').forEach(el=>new BundleBuilder(el));}
if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',boot);}else{boot();}
})();

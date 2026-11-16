(() => {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const sections = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduced) {
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('in-view'); observer.unobserve(entry.target); }
    }), { threshold: 0.12 });
    sections.forEach(section => observer.observe(section));
  } else sections.forEach(section => section.classList.add('in-view'));

  function petals(container, count, durationMin, durationMax) {
    if (reduced) return;
    for (let i = 0; i < count; i++) {
      const p = document.createElement('i'); p.className = 'petal';
      p.style.left = `${Math.random() * 100}%`;
      p.style.animationDuration = `${durationMin + Math.random() * (durationMax - durationMin)}s`;
      p.style.animationDelay = `${Math.random() * 1.8}s`;
      p.style.setProperty('--drift', `${Math.random() * 150 - 75}px`);
      p.style.transform = `rotate(${Math.random() * 180}deg)`;
      container.appendChild(p);
      p.addEventListener('animationend', () => p.remove());
    }
  }
  petals(document.getElementById('openingPetals'), 18, 9, 15);

  const canvas = document.getElementById('scratchCanvas');
  const card = document.getElementById('scratchCard');
  const hint = document.getElementById('scratchHint');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  let drawing = false, revealed = false, checked = false;
  function drawFoil() {
    const rect = canvas.getBoundingClientRect(); const dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(rect.width * dpr); canvas.height = Math.round(rect.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const g = ctx.createLinearGradient(0, 0, rect.width, rect.height);
    g.addColorStop(0, '#d8c49f'); g.addColorStop(.3, '#f3e5c9'); g.addColorStop(.55, '#c6aa79'); g.addColorStop(.8, '#eee0c3'); g.addColorStop(1, '#c7aa79');
    ctx.globalCompositeOperation = 'source-over'; ctx.fillStyle = g; ctx.fillRect(0, 0, rect.width, rect.height);
    ctx.fillStyle = 'rgba(255,255,255,.34)';
    for (let i = 0; i < 140; i++) { const x = Math.random()*rect.width, y = Math.random()*rect.height; ctx.fillRect(x,y,Math.random()*1.5+.3,Math.random()*1.5+.3); }
    ctx.strokeStyle = 'rgba(126,94,55,.42)'; ctx.lineWidth = 1; ctx.strokeRect(7,7,rect.width-14,rect.height-14);
    ctx.fillStyle = '#8d7048'; ctx.font = '10px Georgia'; ctx.textAlign = 'center'; ctx.fillText('✧  RUB TO REVEAL  ✧', rect.width/2, rect.height/2 + 4);
  }
  function point(e) { const r=canvas.getBoundingClientRect(); return {x:e.clientX-r.left,y:e.clientY-r.top}; }
  function scratch(e) {
    if (!drawing || revealed) return; const p=point(e);
    ctx.globalCompositeOperation='destination-out'; ctx.beginPath(); ctx.arc(p.x,p.y,17,0,Math.PI*2); ctx.fill();
    if (!checked) { checked=true; setTimeout(checkScratch,180); }
  }
  function checkScratch() {
    if (revealed) return;
    try {
      const pixels=ctx.getImageData(0,0,canvas.width,canvas.height).data; let clear=0;
      for(let i=3;i<pixels.length;i+=4) if(pixels[i]<70) clear++;
      if(clear/(pixels.length/4)>.48) revealDate();
    } catch {}
  }
  function revealDate() {
    if(revealed)return; revealed=true; card.classList.add('revealed'); hint.textContent='Wednesday · 9 December 2026';
    petals(document.getElementById('petalBurst'), 65, 2.2, 3.2);
    setTimeout(()=>document.getElementById('petalBurst').replaceChildren(),3300);
  }
  drawFoil(); window.addEventListener('resize',()=>{if(!revealed)drawFoil()});
  canvas.addEventListener('pointerdown',e=>{drawing=true;canvas.setPointerCapture(e.pointerId);scratch(e)});
  canvas.addEventListener('pointermove',scratch);
  ['pointerup','pointercancel','lostpointercapture'].forEach(n=>canvas.addEventListener(n,()=>{drawing=false;checkScratch()}));

  const form=document.getElementById('blessingForm'), name=document.getElementById('guestName'), message=document.getElementById('guestMessage');
  const count=document.getElementById('charCount'), status=document.getElementById('formStatus'), btn=document.getElementById('sendBtn');
  message.addEventListener('input',()=>count.textContent=`${message.value.length} / 500`);
  form.addEventListener('submit',async e=>{
    e.preventDefault(); const text=message.value.trim();
    if(!text){status.textContent='Please write a blessing before sending.';message.focus();return;}
    if(text.length>500){status.textContent='Please keep your blessing within 500 characters.';return;}
    btn.disabled=true; status.textContent='Sending your blessing…';
    try{
      const response=await fetch('/api/blessings',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:name.value,message:text})});
      const data=await response.json(); if(!response.ok)throw new Error(data.error||'Could not send your blessing.');
      form.reset();count.textContent='0 / 500';status.textContent='Blessing sent';
    }catch(err){status.textContent=err.message||'Please try again in a moment.';}
    finally{btn.disabled=false;}
  });
})();

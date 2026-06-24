
document.addEventListener('DOMContentLoaded', ()=>{
  const header = document.querySelector('.site-header');
  window.addEventListener('scroll', ()=>{
    if(window.scrollY>20) header.classList.add('scrolled'); else header.classList.remove('scrolled');
  });

  function initMobileMenu(){
    const menuButton = document.querySelector('.menu-btn');
    const menuPanel = document.querySelector('#site-nav-menu');
    if(!menuButton || !menuPanel || !header) return;

    function setOpen(isOpen){
      header.classList.toggle('menu-open', isOpen);
      menuButton.setAttribute('aria-expanded', String(isOpen));
    }

    menuButton.addEventListener('click', event => {
      event.stopPropagation();
      const isOpen = header.classList.contains('menu-open');
      setOpen(!isOpen);
    });

    document.addEventListener('click', event => {
      if(!header.classList.contains('menu-open')) return;
      if(menuPanel.contains(event.target) || menuButton.contains(event.target)) return;
      setOpen(false);
    });

    document.addEventListener('keydown', event => {
      if(event.key === 'Escape') setOpen(false);
    });

    window.addEventListener('resize', () => {
      if(window.innerWidth > 768) setOpen(false);
    });

    setOpen(false);
  }
  
  // Simple responsive carousel
  function initCarousel(rootSelector, options = {}){
    const root = document.querySelector(rootSelector);
    if(!root) return;
    const track = root.querySelector(options.trackSelector || '.carousel-track');
    const viewport = root.querySelector(options.viewportSelector || '.carousel-viewport');
    const prev = root.querySelector(options.prevSelector || '.carousel-btn.prev');
    const next = root.querySelector(options.nextSelector || '.carousel-btn.next');
    const dotsEl = root.querySelector(options.dotsSelector || '.carousel-dots');
    let activeIndex = 0;
    let slidesToShow = 4;
    const gap = options.gap ?? 20;
    const countMode = options.countMode || 'bounded';

    function getItems(){
      return Array.from(track.children);
    }

    if(!viewport || !dotsEl || !getItems().length) return;

    function calc(){
      const items = getItems();
      const w = viewport.clientWidth;
      if(typeof options.getSlidesToShow === 'function') slidesToShow = options.getSlidesToShow(w);
      else if(w>=1100) slidesToShow = 4;
      else if(w>=900) slidesToShow = 3;
      else if(w>=600) slidesToShow = 2;
      else slidesToShow = 1;
      const itemW = items[0].getBoundingClientRect().width + gap;
      return {itemW};
    }

    function buildDots(){
      const items = getItems();
      dotsEl.innerHTML='';
      const maxIndex = Math.max(0, items.length - slidesToShow);
      const pages = countMode === 'items' ? items.length : maxIndex + 1;
      for(let i=0;i<pages;i++){
        const b = document.createElement('button');
        b.type = 'button';
        b.setAttribute('aria-label', `Go to slide ${i + 1}`);
        b.addEventListener('click', ()=>{
          activeIndex = i;
          update();
        });
        if(i===0) b.classList.add('active');
        dotsEl.appendChild(b);
      }
    }

    function update(){
      const items = getItems();
      const {itemW} = calc();
      const maxIndex = Math.max(0, items.length - slidesToShow);
      if(activeIndex < 0) activeIndex = 0;
      if(activeIndex > items.length - 1) activeIndex = items.length - 1;
      const index = countMode === 'items'
        ? Math.min(activeIndex, maxIndex)
        : Math.max(0, Math.min(activeIndex, maxIndex));
      const translateX = -index * itemW;
      track.style.transform = `translateX(${translateX}px)`;
      Array.from(dotsEl.children).forEach((b,i)=>b.classList.toggle('active', i===activeIndex));
    }

    prev && prev.addEventListener('click', ()=>{
      activeIndex--;
      update();
    });
    next && next.addEventListener('click', ()=>{
      activeIndex++;
      update();
    });
    window.addEventListener('resize', ()=>{ buildDots(); update(); });

    let dragStartX = 0;
    let dragDeltaX = 0;
    let isPointerDown = false;

    function startDrag(clientX){
      isPointerDown = true;
      dragStartX = clientX;
      dragDeltaX = 0;
      viewport.classList.add('dragging');
    }

    function moveDrag(clientX){
      if(!isPointerDown) return;
      dragDeltaX = clientX - dragStartX;
    }

    function finishDrag(){
      if(!isPointerDown) return;
      if(dragDeltaX < -30) activeIndex++;
      else if(dragDeltaX > 30) activeIndex--;
      isPointerDown = false;
      dragDeltaX = 0;
      viewport.classList.remove('dragging');
      update();
    }

    viewport.addEventListener('pointerdown', event => {
      if(event.pointerType === 'mouse' && event.button !== 0) return;
      startDrag(event.clientX);
      if(typeof viewport.setPointerCapture === 'function') {
        viewport.setPointerCapture(event.pointerId);
      }
    });

    viewport.addEventListener('pointermove', event => {
      moveDrag(event.clientX);
    });

    viewport.addEventListener('touchstart', event => {
      const touch = event.touches[0];
      if(!touch) return;
      startDrag(touch.clientX);
    }, { passive: true });

    viewport.addEventListener('touchmove', event => {
      const touch = event.touches[0];
      if(!touch) return;
      moveDrag(touch.clientX);
    }, { passive: true });

    viewport.addEventListener('touchend', finishDrag);
    viewport.addEventListener('touchcancel', finishDrag);

    viewport.addEventListener('pointerup', finishDrag);
    viewport.addEventListener('pointercancel', finishDrag);
    viewport.addEventListener('pointerleave', event => {
      if(!isPointerDown || event.buttons !== 0) return;
      finishDrag();
    });

    const observer = new MutationObserver(() => {
      const items = getItems();
      if(!items.length){
        dotsEl.innerHTML='';
        track.style.transform = 'translateX(0px)';
        activeIndex = 0;
        return;
      }
      if(activeIndex > items.length - 1) activeIndex = items.length - 1;
      buildDots();
      update();
    });

    observer.observe(track, { childList: true });

    buildDots(); update();
  }

  function initFaq(rootSelector){
    const root = document.querySelector(rootSelector);
    if(!root) return;
    const items = Array.from(root.querySelectorAll('.faq-item'));
    if(!items.length) return;

    function ensureAnswerInner(answer){
      if(!answer || answer.querySelector('.faq-answer-inner')) return;
      const inner = document.createElement('div');
      inner.className = 'faq-answer-inner';
      while(answer.firstChild) {
        inner.appendChild(answer.firstChild);
      }
      answer.appendChild(inner);
    }

    function syncAnswerState(item, isOpen){
      const button = item.querySelector('.faq-question');
      const answer = item.querySelector('.faq-answer');
      item.classList.toggle('is-open', isOpen);
      button?.setAttribute('aria-expanded', String(isOpen));
      if(!answer) return;

      ensureAnswerInner(answer);
      answer.hidden = false;
      answer.setAttribute('aria-hidden', String(!isOpen));
    }

    items.forEach(item => {
      const answer = item.querySelector('.faq-answer');
      if(!answer) return;
      ensureAnswerInner(answer);
      answer.hidden = false;
    });

    function setOpen(targetItem){
      items.forEach(item => {
        const isOpen = item === targetItem;
        syncAnswerState(item, isOpen);
      });
    }

    items.forEach(item => {
      const button = item.querySelector('.faq-question');
      button?.addEventListener('click', () => {
        const isOpen = item.classList.contains('is-open');
        setOpen(isOpen ? null : item);
      });
    });

    const initialOpen = root.querySelector('.faq-item.is-open') || items[0];
    setOpen(initialOpen);
  }

  function initScrollReveal(){
    const selectors = [
      '.features-header',
      '.features-image',
      '.features-cards .card',
      '.panel-large',
      '.product-card',
      '.testimonial-card',
      '.faq-item',
      '.contact-help-media',
      '.contact-help-copy'
    ];

    const elements = selectors.flatMap(selector => Array.from(document.querySelectorAll(selector)));
    if(!elements.length) return;

    elements.forEach((element, index) => {
      element.classList.add('reveal-on-scroll');
      element.style.setProperty('--reveal-delay', `${Math.min(index % 6, 5) * 70}ms`);
    });

    if(window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) {
      elements.forEach(element => element.classList.add('is-visible'));
      return;
    }

    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if(!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, {
      threshold: 0.18,
      rootMargin: '0px 0px -8% 0px'
    });

    elements.forEach(element => {
      const rect = element.getBoundingClientRect();
      if(rect.top < window.innerHeight * 0.92 && rect.bottom > 0) {
        element.classList.add('is-visible');
        return;
      }
      observer.observe(element);
    });
  }

  function initHowItWorksMotion(){
    const section = document.querySelector('.how-it-works');
    if(!section) return;
    let isVisible = false;

    function markVisible(){
      if(isVisible) return true;
      isVisible = true;
      section.classList.add('is-visible');
      window.removeEventListener('scroll', handleViewportCheck, passiveScrollOptions);
      window.removeEventListener('resize', handleViewportCheck);
      return true;
    }

    function isInViewport(){
      const rect = section.getBoundingClientRect();
      return rect.top < window.innerHeight * 0.9 && rect.bottom > window.innerHeight * 0.18;
    }

    function handleViewportCheck(){
      if(isInViewport()) markVisible();
    }

    const passiveScrollOptions = { passive: true };

    if(window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) {
      markVisible();
      return;
    }

    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if(!entry.isIntersecting) return;
        markVisible();
        observer.unobserve(section);
      });
    }, {
      threshold: 0.18,
      rootMargin: '0px 0px -8% 0px'
    });

    if(isInViewport()) {
      markVisible();
      return;
    }

    window.addEventListener('scroll', handleViewportCheck, passiveScrollOptions);
    window.addEventListener('resize', handleViewportCheck);
    observer.observe(section);
  }

  initCarousel('.carousel', {
    countMode: 'items',
    getSlidesToShow(width){
      if(width >= 1100) return 3;
      if(width >= 760) return 2;
      return 1;
    }
  });
  initCarousel('.testimonials-carousel', {
    trackSelector: '.testimonials-track',
    viewportSelector: '.testimonials-viewport',
    dotsSelector: '.testimonials-pagination',
    gap: 16,
    countMode: 'items',
    getSlidesToShow(width){
      if(width >= 1100) return 3;
      if(width >= 760) return 2;
      return 1;
    }
  });
  initFaq('.faq-list');
  initMobileMenu();
  initScrollReveal();
  initHowItWorksMotion();
});

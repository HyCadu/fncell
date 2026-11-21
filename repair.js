(() => {
  const story = document.querySelector('.screen-story');
  const stage = story.querySelector('.screen-stage');
  const rig = stage.querySelector('.screen-rig');
  const oldScreen = rig.querySelector('.damaged');
  const newScreen = rig.querySelector('.replacement');
  const glint = rig.querySelector('.screen-glint');
  const caption = stage.querySelector('.screen-detail p');
  const button = stage.querySelector('.screen-detail a');
  const meter = stage.querySelector('.screen-meter i');
  const motion = matchMedia('(prefers-reduced-motion: no-preference) and (min-height: 590px)');
  const fallbackCaption = caption.textContent;
  const phases = [
    [0, 'A queda deixou marcas no vidro.'],
    [.21, 'A tela trincada se solta da moldura.'],
    [.46, 'Com o módulo fora, o chassi fica exposto.'],
    [.58, 'A nova tela se alinha à moldura.'],
    [.79, 'O módulo encaixa no aparelho.'],
    [.90, 'Tela nova. Tudo no lugar.']
  ];
  let visible = false;
  let frame = 0;
  let offset = 0;
  let distance = 1;
  let progress = null;
  let target = 0;
  let lastPaint = null;

  function ease(p, from, to) {
    const t = Math.max(0, Math.min(1, (p-from)/(to-from)));
    return t*t*(3-2*t);
  }

  function paint(now) {
    frame = 0;
    if (!motion.matches || !visible || document.hidden) return;
    const dt = Math.min(50, lastPaint === null ? 16 : now-lastPaint);
    lastPaint = now;
    if (progress === null) progress = target;
    const delta = target-progress;
    const step = Math.min(Math.abs(delta)*(1-Math.exp(-dt/135)), dt/1845);
    progress = Math.abs(delta) < .001 ? target : progress + Math.sign(delta)*step;
    const p = progress;
    const approach = ease(p,0,.2);
    const lift = ease(p,.2,.36);
    const exit = ease(p,.26,.51);
    const arrive = ease(p,.52,.78);
    const seat = ease(p,.73,.86);
    const settle = ease(p,.82,.94);
    rig.style.transform = `scale(${.96+.04*approach-.02*settle}) rotateX(${4+3*lift-6*settle}deg) rotateY(${-8-5*lift+12*settle}deg) rotateZ(${-4+3*settle}deg)`;
    oldScreen.style.visibility = p >= .51 ? 'hidden' : 'visible';
    oldScreen.style.opacity = 1-ease(p,.38,.51);
    oldScreen.style.transform = `translate3d(${-8*lift-90*exit}%,${-4*lift-7*exit}%,${5+33*lift}px) rotateY(${-14*lift}deg) rotateZ(${-4*exit}deg)`;
    newScreen.style.visibility = p <= .52 ? 'hidden' : 'visible';
    newScreen.style.opacity = ease(p,.52,.65);
    newScreen.style.transform = `translate3d(${84*(1-arrive)+7*(1-seat)}%,${-8*(1-arrive)-3*(1-seat)}%,${5+30*(1-seat)}px) rotateY(${11*(1-seat)}deg) rotateZ(${3*(1-arrive)}deg)`;
    glint.style.transform = `translateX(${-110+220*ease(p,.85,.97)}%)`;
    meter.style.transform = `scaleX(${.02+.98*p})`;
    let text = phases[0][1];
    for (const [at, value] of phases) if (p >= at) text = value;
    if (caption.textContent !== text) caption.textContent = text;
    button.hidden = p < .9;
    if (progress !== target) frame = requestAnimationFrame(paint);
    else lastPaint = null;
  }

  function schedule() {
    if (!visible || !motion.matches || document.hidden) {
      cancelAnimationFrame(frame);
      frame = 0;
      lastPaint = progress = null;
      return;
    }
    target = Math.max(0,Math.min(1,(offset-story.getBoundingClientRect().top)/distance));
    if (!frame) frame = requestAnimationFrame(paint);
  }
  function measure() {
    offset = window.innerHeight * .69;
    distance = Math.min(548, window.innerHeight * .595);
    schedule();
  }
  function configure() {

    if (!motion.matches) {
      for (const el of [rig,oldScreen,newScreen,glint,meter]) el.removeAttribute('style');
      button.hidden = false;
      caption.textContent = fallbackCaption;
    } else {
      button.hidden = true;
    }
    measure();
  }
  if (!('IntersectionObserver' in window)) return;
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    schedule();
  }).observe(story);
  window.addEventListener('scroll',schedule,{passive:true});
  window.addEventListener('resize',measure);
  document.addEventListener('visibilitychange',schedule);
  motion.addListener(configure);
  configure();
})();



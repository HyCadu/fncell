const quoteForm = document.querySelector('#quote-form');
document.querySelectorAll('[data-service]').forEach(link => {
  link.addEventListener('click', () => {
    quoteForm.elements.servico.value = link.dataset.service;
    quoteForm.elements.servico.dispatchEvent(new Event('change'));
  });
});

// The native form opens WhatsApp. Only the composed message belongs in its URL.
quoteForm.addEventListener('formdata', event => {
  const data = event.formData;
  const message = [
    'Olá! Quero pedir um orçamento na FN Cell.',
    'Serviço: ' + data.get('servico'),
    'Aparelho: ' + data.get('aparelho').trim(),
  ];
  if (data.get('atendimento')) message.push('Atendimento: ' + data.get('atendimento'));
  const note = data.get('mensagem').trim();
  if (note) message.push(note);
  for (const key of ['servico','aparelho','atendimento','mensagem']) data.delete(key);
  data.set('text', message.join('\n'));
});


function styleChoice(select) {
  const label = select.labels[0];
  const trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.className = 'choice-trigger';
  trigger.id = select.id + '-trigger';
  trigger.setAttribute('role', 'combobox');
  trigger.setAttribute('aria-labelledby', label.id);
  trigger.setAttribute('aria-expanded', 'false');
  trigger.setAttribute('aria-required', String(select.required));
  const list = document.createElement('ul');
  list.className = 'choice-list';
  list.id = select.id + '-options';
  list.setAttribute('role', 'listbox');
  list.setAttribute('aria-labelledby', label.id);
  list.hidden = true;
  trigger.setAttribute('aria-controls', list.id);
  const options = [...select.options].map((option, index) => {
    const item = document.createElement('li');
    item.id = list.id + '-' + index;
    item.setAttribute('role', 'option');
    item.textContent = option.text;
    item.addEventListener('mousedown', event => event.preventDefault());
    item.addEventListener('click', () => commit(index));
    list.append(item);
    return item;
  });
  let active = select.selectedIndex;
  function sync() {
    trigger.textContent = select.selectedOptions[0].text;
    options.forEach((item,i) => item.setAttribute('aria-selected', String(i === select.selectedIndex)));
    if (select.validity.valid) trigger.removeAttribute('aria-invalid');
  }
  function highlight(index) {
    options[active].classList.remove('active');
    active = index;
    options[active].classList.add('active');
    trigger.setAttribute('aria-activedescendant', options[active].id);
    const item = options[active];
    if (item.offsetTop < list.scrollTop) list.scrollTop = item.offsetTop;
    else if (item.offsetTop + item.offsetHeight > list.scrollTop + list.clientHeight)
      list.scrollTop = item.offsetTop + item.offsetHeight - list.clientHeight;
  }
  function expand(open) {
    list.hidden = !open;
    trigger.setAttribute('aria-expanded', String(open));
    if (open) highlight(select.selectedIndex);
    else trigger.removeAttribute('aria-activedescendant');
  }
  function commit(index) {
    select.selectedIndex = index;
    select.dispatchEvent(new Event('change', {bubbles:true}));
    expand(false);
    trigger.focus({preventScroll:true});
  }
  trigger.addEventListener('click', () => expand(list.hidden));
  trigger.addEventListener('keydown', event => {
    const key = event.key;
    if (key === 'Escape' && !list.hidden) {
      event.preventDefault();
      expand(false);
    } else if (key === 'ArrowDown' || key === 'ArrowUp' || key === 'Home' || key === 'End') {
      event.preventDefault();
      if (list.hidden) expand(true);
      const next = key === 'Home' ? 0 : key === 'End' ? options.length-1 : active + (key === 'ArrowDown' ? 1 : -1);
      highlight(Math.max(0,Math.min(options.length-1,next)));
    } else if (!list.hidden && (key === 'Enter' || key === ' ')) {
      event.preventDefault();
      commit(active);
    } else if (key.length === 1 && key !== ' ' && !event.ctrlKey && !event.metaKey && !event.altKey) {
      const match = options.findIndex(item => item.textContent.toLocaleLowerCase().startsWith(key.toLocaleLowerCase()));
      if (match >= 0) {
        if (list.hidden) expand(true);
        highlight(match);
      }
    }
  });
  document.addEventListener('pointerdown', event => {
    if (!select.parentElement.contains(event.target)) expand(false);
  });
  trigger.addEventListener('blur', () => expand(false));
  select.addEventListener('change', sync);
  select.addEventListener('invalid', event => {
    event.preventDefault();
    trigger.setAttribute('aria-invalid','true');
    requestAnimationFrame(() => { trigger.focus(); expand(true); });
  });
  select.hidden = true;
  label.htmlFor = trigger.id;
  select.after(trigger,list);
  sync();
}
quoteForm.querySelectorAll('select').forEach(styleChoice);

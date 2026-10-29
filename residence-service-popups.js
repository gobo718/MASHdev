/* MASHpedition · 14-06 Residence service POPUP presentation layer.
   Read-only until authoritative account/service handlers are connected.
   No new room, no invented messages/visits/gifts/rewards, no persistent
   local state, no economy or progression writes. */
(() => {
  'use strict';
  const definitions = Object.freeze({
    mailbox: { title: 'MAILBOX', rows: 'messages', empty: 'Mailbox records have not been connected to this build.' },
    guestbook: { title: 'GUESTBOOK', rows: 'visits', empty: 'Guestbook activity has not been connected to this build.' },
    'gift-dropbox': { title: 'GIFT DROPBOX', rows: 'gifts', empty: 'Gift records have not been connected to this build.' },
    'trick-or-treat': { title: 'TRICK-OR-TREAT', rows: null, empty: 'Trick-or-Treat eligibility and rewards are not connected to this build.' }
  });
  const snapshots = new Map();
  // Retain only the existing displayed fields, copied as primitives at the
  // moment an account service supplies them. Caller-owned arrays/records must
  // not silently repaint a different resident's mailbox, visits or gifts.
  const recordFields = Object.freeze({
    mailbox: Object.freeze(['id','subject','sender','receivedAt','read']),
    guestbook: Object.freeze(['id','visitor','action','visitedAt','signingStyle']),
    'gift-dropbox': Object.freeze(['id','itemLabel','sender','sentAt'])
  });
  const primitive = value => value === null || ['string','number','boolean','undefined'].includes(typeof value)
    ? value : null;
  function isolatedSnapshot(service, data) {
    if (service === 'trick-or-treat')
      return Object.freeze({status:primitive(data.status)});
    const key=definitions[service].rows;
    if (!Array.isArray(data[key])) return Object.freeze({[key]:null});
    const rows=data[key].map(record => {
      if (!record || typeof record !== 'object' || Array.isArray(record)) return null;
      const copy={};
      for (const field of recordFields[service]) copy[field]=primitive(record[field]);
      return Object.freeze(copy);
    });
    return Object.freeze({[key]:Object.freeze(rows)});
  }
  let previouslyFocused = null;
  const dialog = document.createElement('dialog');
  dialog.className = 'residence-service-dialog';
  dialog.setAttribute('aria-modal', 'true');
  const heading = document.createElement('h2');
  heading.id = 'residence-service-title';
  dialog.setAttribute('aria-labelledby', heading.id);
  const description = document.createElement('p');
  description.className = 'residence-service-note';
  const content = document.createElement('div');
  content.className = 'residence-service-content';
  const close = document.createElement('button');
  close.type = 'button';
  close.className = 'residence-service-close';
  close.textContent = 'CLOSE';
  dialog.append(heading, description, content, close);
  document.body.append(dialog);
  function finishClose() {
    const focusTarget = previouslyFocused;
    previouslyFocused = null;
    if (focusTarget && focusTarget.isConnected) focusTarget.focus();
  }
  close.addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', finishClose);
  dialog.addEventListener('click', event => {
    if (event.target === dialog) dialog.close();
  });
  function validDate(value) {
    if (typeof value !== 'string' || !Number.isFinite(Date.parse(value))) return 'Date unavailable';
    return new Date(value).toLocaleString();
  }
  function node(tag, className, value) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    el.textContent = String(value ?? '');
    return el;
  }
  function recordCard(kind, record) {
    const article = document.createElement('article');
    article.className = 'residence-service-entry';
    const label = kind === 'mailbox' ? record.subject :
      kind === 'guestbook' ? record.visitor : record.itemLabel;
    article.append(node('strong', '', label || 'Untitled entry'));
    if (kind === 'mailbox') {
      article.append(node('p', '', 'From: ' + (record.sender || 'Unknown sender')));
      article.append(node('small', '', validDate(record.receivedAt) + ' · ' + (record.read ? 'READ' : 'UNREAD')));
    } else if (kind === 'guestbook') {
      article.append(node('p', '', 'Visit activity: ' + (record.action || 'Not specified')));
      article.append(node('small', '', validDate(record.visitedAt)));
      if (record.signingStyle) article.append(node('small', '', ' · Signing style: ' + record.signingStyle));
    } else {
      article.append(node('p', '', 'From: ' + (record.sender || 'Unknown sender')));
      article.append(node('small', '', validDate(record.sentAt) + ' · Package pickup: GIFT SHOP'));
    }
    return article;
  }
  function paint(service) {
    const config = definitions[service], data = snapshots.get(service);
    heading.textContent = config.title;
    description.textContent = service === 'mailbox' ? 'Museum and Docent notifications.' :
      service === 'guestbook' ? 'Residence visit activity. Not a free-text message board.' :
      service === 'gift-dropbox' ? 'Gifts become recipient packages for pickup at the Gift Shop.' :
      'The existing progression system determines eligibility and rewards.';
    content.replaceChildren();
    if (!data) {
      content.append(node('p', 'residence-service-unavailable', config.empty));
      return;
    }
    if (service === 'trick-or-treat') {
      content.append(node('p', '', typeof data.status === 'string' && data.status.trim()
        ? data.status : config.empty));
      return;
    }
    const source = data[config.rows];
    if (!Array.isArray(source)) {
      content.append(node('p', 'residence-service-unavailable', config.empty));
      return;
    }
    const seen = new Set();
    let count = 0;
    for (const item of source) {
      if (!item || typeof item.id !== 'string' || !item.id.trim() || seen.has(item.id)) continue;
      seen.add(item.id);
      content.append(recordCard(service, item));
      count++;
    }
    if (!count) content.append(node('p', '', 'No entries in the supplied service snapshot.'));
  }
  function open(service) {
    if (!Object.hasOwn(definitions, service)) throw new RangeError('Unknown Residence popup service');
    // A service can be reopened while the shared popup is already visible.
    // Do not close/reopen the native dialog: that used to replace the true
    // Residence launcher with the popup CLOSE button as the return target.
    const wasOpen = dialog.open;
    if (!wasOpen) {
      const active = document.activeElement;
      previouslyFocused = active && !dialog.contains(active) ? active : null;
    }
    dialog.dataset.service = service;
    paint(service);
    if (!wasOpen) dialog.showModal();
    close.focus();
  }
  function setSnapshot(service, data) {
    if (!Object.hasOwn(definitions, service)) throw new RangeError('Unknown Residence popup service');
    if (data !== null && (!data || typeof data !== 'object' || Array.isArray(data)))
      throw new TypeError('Presentation snapshot must be an object or null');
    if (data === null) snapshots.delete(service);
    else snapshots.set(service, isolatedSnapshot(service, data));
    if (dialog.open && dialog.dataset.service === service) paint(service);
  }
  const bindings = [
    ['.quick-actions [aria-label="Mailbox"]', 'mailbox'],
    ['.quick-actions [aria-label="Guestbook"]', 'guestbook'],
    ['.microflex-trick-or-treat', 'trick-or-treat']
  ];
  for (const [selector, service] of bindings) {
    const trigger = document.querySelector(selector);
    if (trigger) trigger.addEventListener('click', () => open(service));
  }
  // Gift Dropbox currently has no approved Residence fixture/placement.
  // Expose its popup without inventing a new button or changing the map.
  Object.defineProperty(window, 'MASHResidenceServicePopups', {
    value: Object.freeze({open, setSnapshot}),
    configurable: false, writable: false
  });
})();

export function createHtmlElement(source: string) {
  const htmlEl = document.createElement('html');
  htmlEl.innerHTML = source;

  const head = htmlEl.querySelector('head');
  const body = htmlEl.querySelector('body');
  return { htmlEl, head, body };
}

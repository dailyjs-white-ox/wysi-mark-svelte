const GIST_PATTERN = new RegExp('/gist/(?<username>[^/]*)/(?<gistid>[0-9a-f]*)');

export async function getGistContent(gistPath?: string): Promise<string> {
  if (!gistPath) return '';
  const md = GIST_PATTERN.exec(gistPath);
  const gistId = md?.groups?.gistid;
  if (!gistId) return '';

  const response = await fetch(`https://api.github.com/gists/${gistId}`);
  const data = await response.json();

  if (data && data.files) {
    const firstMarkdownFile = Object.values(data.files).find(
      (file) => file.language === 'Markdown'
    );
    if (!firstMarkdownFile) return '';

    const mdResponse = await fetch(firstMarkdownFile.raw_url);
    return mdResponse.text();
  }

  return '';
}

function fetchAllMarkdownUrls(data) {
  return Promise.all(
    Object.values(data.files)
      .filter((file) => file.language === 'Markdown')
      .map((file) => {
        const fileUrl = file.raw_url;
        return fetch(fileUrl).then((fileResponse) => fileResponse.text());
      })
  );
}

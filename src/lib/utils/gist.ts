export async function getGistContent(gistId?: string | null): Promise<string> {
  if (!gistId) return '';

  const response = await fetch(`https://api.github.com/gists/${gistId}`);
  const data = await response.json();

  if (data && data.files) {
    return (
      await Promise.all(
        Object.values(data.files)
          .filter((file) => file.language === 'Markdown')
          .map((file) => {
            const fileUrl = file.raw_url;
            return fetch(fileUrl).then((fileResponse) => fileResponse.text());
          })
      )
    ).join('---\n');
  }

  return '';
}

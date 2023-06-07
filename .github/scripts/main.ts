const username = Deno.env.get("GITHUB_REPOSITORY_OWNER");
if (username === undefined) {
  console.error("GITHUB_REPOSITORY_OWNER is not set");
  Deno.exit(1);
}

/*
 * GitHub
 */
interface Gist {
  url: string;
  forks_url: string;
  commits_url: string;
  id: string;
  node_id: string;
  git_pull_url: string;
  git_push_url: string;
  html_url: string;
  files: { [key: string]: File };
  public: boolean;
  created_at: Date;
  updated_at: Date;
  description: string;
  comments: number;
  user: null;
  comments_url: string;
  owner: Owner;
  truncated: boolean;
}

interface Owner {
  login: string;
  id: number;
  node_id: string;
  avatar_url: string;
  gravatar_id: string;
  url: string;
  html_url: string;
  followers_url: string;
  following_url: string;
  gists_url: string;
  starred_url: string;
  subscriptions_url: string;
  organizations_url: string;
  repos_url: string;
  events_url: string;
  received_events_url: string;
  type: string;
  site_admin: boolean;
}

interface File {
  filename: string;
  type: string;
  language: string;
  raw_url: string;
  size: number;
}

async function getGitHubGists(username: string): Promise<Gist[]> {
  const url = new URL(`https://api.github.com/users/${username}/gists`)
  const maxPages = 10;
  let gists: Gist[] = []

  try {
    for (let i = 1; i <= maxPages; i++) {
      console.debug(`=> Sending HTTP Request - User (${username}) - Page (${i}) `)
      url.searchParams.set('page', String(i))

      const httpResponse = await fetch(
        url,
        {
          method: "GET",
          headers: {
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28"
          },
        },
      );

      gists = gists.concat(JSON.parse(await httpResponse.text()))
    }

    return gists;
  } catch (e) {
    console.error(e);
    Deno.exit(1);
  }
}

function getGitHubGistId(gist: Gist): string {
  return gist.id.substring(0, 5);
}

function getGitHubGistFileLanguage(gist: Gist): string {
  let fileLanguage = "";
  for (const key in gist.files) {
    fileLanguage = gist.files[key].language;
  }

  return fileLanguage;
}

/*
 * Markdown
 */
function newMarkdownTable(gists: Gist[]): string {
  let tableRows = "";

  tableRows = tableRows + newMarkdownTableHeader();
  tableRows = tableRows + newMarkdownTableSplit();

  for (const gist of gists) {
    tableRows = tableRows +
      newMarkdownTableRow(
        getGitHubGistId(gist),
        getGitHubGistFileLanguage(gist),
        gist.html_url,
        gist.description,
      );
  }

  return tableRows;
}

function newMarkdownTableHeader(): string {
  return "| " + "ID" + " | " + " Language " + " | " + "Link" + " | " +
    "Description" + " |" + "\n";
}

function newMarkdownTableSplit(): string {
  return "| " + "---" + " | " + "---" + " | " + "---" + " | " +
    "---" + " |" + "\n";
}

function newMarkdownTableRow(
  id: string,
  language: string,
  link: string,
  description: string,
): string {
  return "| " + id + " | " + language + " | " +
    `[Link](${link})` + " | " + description + " |" + "\n";
}

function writeMarkdownFile(
  path: string,
  table: string,
): void {
  try {
    Deno.writeTextFileSync(path, table);
  } catch (e) {
    console.error(e);
    Deno.exit(1);
  }
}

const gists = await getGitHubGists(username);
const table = newMarkdownTable(gists);
writeMarkdownFile("./README.md", table);

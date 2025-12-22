import { $ } from "bun";
import type { Git } from "@forgewright/core";

export interface GitHubRepo {
  owner: string;
  name: string;
}

export interface GitHubRelease {
  id: number;
  tag_name: string;
  name: string;
  body: string;
  html_url: string;
  draft: boolean;
  prerelease: boolean;
}

export class GitHub {
  private token: string | undefined;

  constructor(token?: string) {
    this.token = token ?? process.env.GITHUB_TOKEN;
  }

  async parseRepoFromRemote(git: Git): Promise<GitHubRepo | null> {
    const url = await git.getRemoteUrl();
    if (!url) return null;

    // Handle SSH: git@github.com:owner/repo.git
    const sshMatch = url.match(/git@github\.com:([^/]+)\/([^.]+)(?:\.git)?/);
    if (sshMatch) {
      return { owner: sshMatch[1]!, name: sshMatch[2]! };
    }

    // Handle HTTPS: https://github.com/owner/repo.git
    const httpsMatch = url.match(/github\.com\/([^/]+)\/([^/.]+)(?:\.git)?/);
    if (httpsMatch) {
      return { owner: httpsMatch[1]!, name: httpsMatch[2]! };
    }

    return null;
  }

  async createRelease(
    repo: GitHubRepo,
    options: {
      tag: string;
      name: string;
      body: string;
      draft?: boolean;
      prerelease?: boolean;
    }
  ): Promise<GitHubRelease> {
    if (!this.token) {
      throw new Error("GITHUB_TOKEN is required to create releases");
    }

    const response = await fetch(
      `https://api.github.com/repos/${repo.owner}/${repo.name}/releases`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.token}`,
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tag_name: options.tag,
          name: options.name,
          body: options.body,
          draft: options.draft ?? false,
          prerelease: options.prerelease ?? false,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to create GitHub release: ${response.status} ${error}`);
    }

    return response.json() as Promise<GitHubRelease>;
  }

  async getLatestRelease(repo: GitHubRepo): Promise<GitHubRelease | null> {
    const response = await fetch(
      `https://api.github.com/repos/${repo.owner}/${repo.name}/releases/latest`,
      {
        headers: {
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
          ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
        },
      }
    );

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error(`Failed to get latest release: ${response.status}`);
    }

    return response.json() as Promise<GitHubRelease>;
  }

  isCI(): boolean {
    return (
      !!process.env.CI ||
      !!process.env.GITHUB_ACTIONS ||
      !!process.env.GITHUB_RUN_ID
    );
  }

  async ghCliAvailable(): Promise<boolean> {
    try {
      await $`gh --version`.quiet();
      return true;
    } catch {
      return false;
    }
  }

  async createReleaseWithCLI(
    options: {
      tag: string;
      title: string;
      notes: string;
      draft?: boolean;
      prerelease?: boolean;
    }
  ): Promise<string> {
    const args = [
      "release",
      "create",
      options.tag,
      "--title",
      options.title,
      "--notes",
      options.notes,
    ];

    if (options.draft) args.push("--draft");
    if (options.prerelease) args.push("--prerelease");

    const result = await $`gh ${args}`.text();
    return result.trim();
  }
}

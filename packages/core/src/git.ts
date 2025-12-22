import { $ } from "bun";
import { z } from "zod";

export const CommitSchema = z.object({
  hash: z.string(),
  shortHash: z.string(),
  message: z.string(),
  body: z.string(),
  author: z.object({
    name: z.string(),
    email: z.string(),
  }),
  date: z.date(),
  files: z.array(z.string()),
});

export type Commit = z.infer<typeof CommitSchema>;

export const TagSchema = z.object({
  name: z.string(),
  hash: z.string(),
  date: z.date(),
});

export type Tag = z.infer<typeof TagSchema>;

export interface GitOptions {
  cwd?: string;
}

export class Git {
  private cwd: string;

  constructor(options: GitOptions = {}) {
    this.cwd = options.cwd ?? process.cwd();
  }

  async getCommits(since?: string): Promise<Commit[]> {
    const range = since ? `${since}..HEAD` : "HEAD";
    const format = "%H|%h|%s|%b|%an|%ae|%aI";

    const result = await $`git log ${range} --format="${format}" --name-only`
      .cwd(this.cwd)
      .text();

    if (!result.trim()) return [];

    const commits: Commit[] = [];
    const entries = result.trim().split("\n\n");

    for (const entry of entries) {
      const lines = entry.split("\n");
      const [header, ...fileLines] = lines;

      if (!header) continue;

      const [hash, shortHash, message, body, authorName, authorEmail, dateStr] =
        header.split("|");

      commits.push({
        hash: hash ?? "",
        shortHash: shortHash ?? "",
        message: message ?? "",
        body: body ?? "",
        author: {
          name: authorName ?? "",
          email: authorEmail ?? "",
        },
        date: new Date(dateStr ?? ""),
        files: fileLines.filter(Boolean),
      });
    }

    return commits;
  }

  async getLatestTag(): Promise<Tag | null> {
    try {
      const name = await $`git describe --tags --abbrev=0`.cwd(this.cwd).text();
      const trimmedName = name.trim();

      if (!trimmedName) return null;

      const hash = await $`git rev-list -n 1 ${trimmedName}`.cwd(this.cwd).text();
      const dateStr = await $`git log -1 --format=%aI ${trimmedName}`
        .cwd(this.cwd)
        .text();

      return {
        name: trimmedName,
        hash: hash.trim(),
        date: new Date(dateStr.trim()),
      };
    } catch {
      return null;
    }
  }

  async getAllTags(): Promise<Tag[]> {
    try {
      const result = await $`git tag --sort=-creatordate --format="%(refname:short)|%(objectname)|%(creatordate:iso)"`
        .cwd(this.cwd)
        .text();

      if (!result.trim()) return [];

      return result
        .trim()
        .split("\n")
        .map((line) => {
          const [name, hash, dateStr] = line.split("|");
          return {
            name: name ?? "",
            hash: hash ?? "",
            date: new Date(dateStr ?? ""),
          };
        });
    } catch {
      return [];
    }
  }

  async getDiff(from: string, to: string = "HEAD"): Promise<string> {
    return $`git diff ${from}..${to}`.cwd(this.cwd).text();
  }

  async getFileDiff(file: string, from: string, to: string = "HEAD"): Promise<string> {
    return $`git diff ${from}..${to} -- ${file}`.cwd(this.cwd).text();
  }

  async createTag(name: string, message?: string): Promise<void> {
    if (message) {
      await $`git tag -a ${name} -m ${message}`.cwd(this.cwd);
    } else {
      await $`git tag ${name}`.cwd(this.cwd);
    }
  }

  async pushTag(name: string): Promise<void> {
    await $`git push origin ${name}`.cwd(this.cwd);
  }

  async getCurrentBranch(): Promise<string> {
    const result = await $`git rev-parse --abbrev-ref HEAD`.cwd(this.cwd).text();
    return result.trim();
  }

  async isClean(): Promise<boolean> {
    const result = await $`git status --porcelain`.cwd(this.cwd).text();
    return result.trim() === "";
  }

  async getRemoteUrl(): Promise<string | null> {
    try {
      const result = await $`git remote get-url origin`.cwd(this.cwd).text();
      return result.trim() || null;
    } catch {
      return null;
    }
  }
}

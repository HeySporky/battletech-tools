/*
 * Client-only GitHub contribution flow: fork the upstream repo, commit the
 * exported catalog file to a new branch on the user's fork, and open a PR.
 * Uses the user's own personal access token; nothing is sent anywhere but
 * GitHub's API, and this app has no backend to persist or relay it.
 */

const GITHUB_API_BASE = "https://api.github.com";
const GITHUB_API_VERSION = "2022-11-28";

export interface IGithubContributionRequest {
    token: string;
    upstreamOwner: string;
    upstreamRepo: string;
    filePath: string;
    // Either the complete file, or a function that builds it from the file currently on the
    // upstream default branch (null when the file does not exist there yet).
    fileContents: string | ((currentUpstreamContents: string | null) => string);
    commitMessage: string;
    pullRequestTitle: string;
    pullRequestBody: string;
    branchPrefix?: string;
}

export interface IGithubContributionResult {
    pullRequestUrl: string;
}

function githubHeaders(token: string): HeadersInit {
    return {
        "Authorization": `Bearer ${token}`,
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": GITHUB_API_VERSION,
    };
}

async function githubRequest<T>(
    url: string,
    token: string,
    init: RequestInit = {},
): Promise<T> {
    const response = await fetch(url, {
        ...init,
        headers: {
            ...githubHeaders(token),
            ...(init.headers ?? {}),
        },
    });

    if (!response.ok) {
        let detail = "";
        try {
            const errorBody = await response.json();
            detail = errorBody?.message ? `: ${errorBody.message}` : "";
        } catch {
            // Response body wasn't JSON; fall back to the bare status.
        }
        throw new Error(`GitHub API request failed (HTTP ${response.status})${detail}`);
    }

    if (response.status === 204) {
        return undefined as T;
    }

    return response.json() as Promise<T>;
}

function toBase64(content: string): string {
    const bytes = new TextEncoder().encode(content);
    let binary = "";
    bytes.forEach((byte) => {
        binary += String.fromCharCode(byte);
    });
    return btoa(binary);
}

function fromBase64(content: string): string {
    const binary = atob(content.replace(/\s/g, ""));
    return new TextDecoder().decode(Uint8Array.from(binary, (char) => char.charCodeAt(0)));
}

function delay(ms: number): Promise<void> {
    return new Promise((resolve) => window.setTimeout(resolve, ms));
}

export async function submitEquipmentCatalogContribution(
    request: IGithubContributionRequest,
): Promise<IGithubContributionResult> {
    const { token, upstreamOwner, upstreamRepo, filePath, fileContents, commitMessage, pullRequestTitle, pullRequestBody } = request;
    const branchPrefix = request.branchPrefix ?? "equipment-editor";

    if (!token || !token.trim()) {
        throw new Error("A GitHub personal access token is required to submit a contribution.");
    }

    const currentUser = await githubRequest<{ login: string }>(`${GITHUB_API_BASE}/user`, token);
    const login = currentUser.login;

    const upstreamRepoInfo = await githubRequest<{ default_branch: string }>(
        `${GITHUB_API_BASE}/repos/${upstreamOwner}/${upstreamRepo}`,
        token,
    );
    const defaultBranch = upstreamRepoInfo.default_branch;

    // The repo owner can't fork their own repo, so they branch in it directly.
    const ownsUpstream = login.toLowerCase() === upstreamOwner.toLowerCase();
    const headOwner = ownsUpstream ? upstreamOwner : login;

    if (!ownsUpstream) {
        // Forking is idempotent - GitHub returns the existing fork if the user already has one.
        await githubRequest(`${GITHUB_API_BASE}/repos/${upstreamOwner}/${upstreamRepo}/forks`, token, {
            method: "POST",
        });

        // Forks are created asynchronously, so poll until the fork is queryable.
        let forkReady = false;
        for (let attempt = 0; attempt < 10 && !forkReady; attempt++) {
            try {
                await githubRequest(`${GITHUB_API_BASE}/repos/${login}/${upstreamRepo}`, token);
                forkReady = true;
            } catch {
                await delay(1500);
            }
        }
        if (!forkReady) {
            throw new Error("Timed out waiting for your GitHub fork to become available. Please try again in a moment.");
        }
    }

    let resolvedContents: string;
    if (typeof fileContents === "function") {
        let currentUpstreamContents: string | null = null;
        try {
            const upstreamFile = await githubRequest<{ content: string }>(
                `${GITHUB_API_BASE}/repos/${upstreamOwner}/${upstreamRepo}/contents/${filePath}?ref=${defaultBranch}`,
                token,
            );
            currentUpstreamContents = fromBase64(upstreamFile.content);
        } catch {
            currentUpstreamContents = null;
        }
        resolvedContents = fileContents(currentUpstreamContents);
    } else {
        resolvedContents = fileContents;
    }

    const headDefaultBranchRef = await githubRequest<{ object: { sha: string } }>(
        `${GITHUB_API_BASE}/repos/${headOwner}/${upstreamRepo}/git/ref/heads/${defaultBranch}`,
        token,
    );
    const baseSha = headDefaultBranchRef.object.sha;

    const branchName = `${branchPrefix}/${filePath.replace(/[^a-z0-9-]+/gi, "-")}-${Date.now()}`;

    await githubRequest(`${GITHUB_API_BASE}/repos/${headOwner}/${upstreamRepo}/git/refs`, token, {
        method: "POST",
        body: JSON.stringify({
            ref: `refs/heads/${branchName}`,
            sha: baseSha,
        }),
    });

    let existingFileSha: string | undefined;
    try {
        const existingFile = await githubRequest<{ sha: string }>(
            `${GITHUB_API_BASE}/repos/${headOwner}/${upstreamRepo}/contents/${filePath}?ref=${branchName}`,
            token,
        );
        existingFileSha = existingFile.sha;
    } catch {
        existingFileSha = undefined;
    }

    await githubRequest(`${GITHUB_API_BASE}/repos/${headOwner}/${upstreamRepo}/contents/${filePath}`, token, {
        method: "PUT",
        body: JSON.stringify({
            message: commitMessage,
            content: toBase64(resolvedContents),
            branch: branchName,
            sha: existingFileSha,
        }),
    });

    const pullRequest = await githubRequest<{ html_url: string }>(
        `${GITHUB_API_BASE}/repos/${upstreamOwner}/${upstreamRepo}/pulls`,
        token,
        {
            method: "POST",
            body: JSON.stringify({
                title: pullRequestTitle,
                head: `${headOwner}:${branchName}`,
                base: defaultBranch,
                body: pullRequestBody,
                maintainer_can_modify: true,
            }),
        },
    );

    return { pullRequestUrl: pullRequest.html_url };
}

// The flow is not specific to equipment catalogs; this is the name new callers should use.
export const submitGithubFileContribution = submitEquipmentCatalogContribution;

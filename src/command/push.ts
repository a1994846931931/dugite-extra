import { git, IGitExecutionOptions, GitError } from '../core/git';
import { IPushProgress, PushProgressParser, executionOptionsWithProgress } from '../progress';

/**
 * Push from the remote to the branch, optionally setting the upstream.
 *
 * @param repository - The repository from which to push
 *
 * @param account - The account to use when authenticating with the remote
 *
 * @param remote - The remote to push the specified branch to
 *
 * @param localBranch - The local branch to push
 *
 * @param remoteBranch - The remote branch to push to
 *
 * @param setUpstream - Whether or not to update the tracking information
 *                      of the specified branch to point to the remote.
 *
 * @param progressCallback - An optional function which will be invoked
 *                           with information about the current progress
 *                           of the push operation. When provided this enables
 *                           the '--progress' command line flag for
 *                           'git push'.
 */
export async function push(repositoryPath: string, remote: string, localBranch: string, remoteBranch?: string,
    options?: IGitExecutionOptions, progressCallback?: (progress: IPushProgress) => void): Promise<void> {

    const args = [
        'push',
        remote,
        remoteBranch ? `${localBranch}:${remoteBranch}` : localBranch,
    ];

    let opts: IGitExecutionOptions = {};
    if (options) {
        opts = {
            ...opts,
            ...options
        };
    }

    if (progressCallback) {
        args.push('--progress');
        const title = `Pushing to ${remote}`;
        const kind = 'push';

        opts = executionOptionsWithProgress(
            opts,
            new PushProgressParser(),
            progress => {
                const description = progress.kind === 'progress' ? progress.details.text : progress.text;
                const value = progress.percent;

                progressCallback({
                    kind,
                    title,
                    description,
                    value,
                    remote,
                    branch: localBranch,
                });
            }
        );

        // Initial progress
        progressCallback({
            kind: 'push',
            title,
            value: 0,
            remote,
            branch: localBranch,
        });
    }

    const result = await git(args, repositoryPath, 'push', opts);

    if (result.gitErrorDescription) {
        throw new GitError(result, args);
    }
}

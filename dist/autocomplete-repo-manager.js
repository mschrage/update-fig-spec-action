"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AutocompleteRepoManager = void 0;
const core = __importStar(require("@actions/core"));
const utils_1 = require("./utils");
class AutocompleteRepoManager {
    get repo() {
        return Object.assign(Object.assign({}, this.autocompleteRepo), { defaultBranch: this.autocompleteDefaultBranch });
    }
    constructor(autocompleteRepo, autocompleteDefaultBranch) {
        this.autocompleteRepo = autocompleteRepo;
        this.autocompleteDefaultBranch = autocompleteDefaultBranch;
    }
    createCommitOnNewRepoBranch(octokit, fork, branchName, changedFile) {
        return __awaiter(this, void 0, void 0, function* () {
            core.startGroup('commit');
            // create new branch on top of the upstream master
            const masterRef = yield octokit.rest.git.getRef(Object.assign(Object.assign({}, fork), { ref: `heads/${this.autocompleteDefaultBranch}` }));
            const newBranchRef = yield octokit.rest.git.createRef(Object.assign(Object.assign({}, fork), { ref: `refs/heads/${branchName}`, sha: masterRef.data.object.sha }));
            core.info(`Created a new branch on the fork: refs/heads/${branchName}`);
            // create new blob, new tree, commit everything and update PR branch
            const newBlob = yield octokit.rest.git.createBlob(Object.assign(Object.assign({}, fork), { content: changedFile.content, encoding: 'utf-8' }));
            const newTree = yield octokit.rest.git.createTree(Object.assign(Object.assign({}, fork), { tree: [
                    {
                        path: changedFile.path,
                        sha: newBlob.data.sha,
                        mode: '100644',
                        type: 'blob'
                    }
                ], base_tree: newBranchRef.data.object.sha }));
            const newCommit = yield octokit.rest.git.createCommit(Object.assign(Object.assign({}, fork), { message: 'feat: update spec', tree: newTree.data.sha, parents: [newBranchRef.data.object.sha] }));
            core.info(`Created new commit: ${newCommit.data.sha}`);
            octokit.rest.git.updateRef(Object.assign(Object.assign({}, fork), { ref: `heads/${branchName}`, sha: newCommit.data.sha }));
            core.info('Updated the created branch to point to the new commit');
            core.endGroup();
        });
    }
    createAutocompleteRepoPR(octokit, specName, forkOwner, branchName) {
        return __awaiter(this, void 0, void 0, function* () {
            // create a new branch in the fork and create
            const result = yield octokit.rest.pulls.create(Object.assign(Object.assign({}, this.autocompleteRepo), { title: `feat(${specName}): update spec`, head: `${forkOwner}:${branchName}`, base: this.autocompleteDefaultBranch }));
            core.info(`Created target autocomplete repo PR (#${result.data.number}) from branch ${forkOwner}:${branchName}`);
            return result.data.number;
        });
    }
    /**
     * Rebase an autocomplete fork on top of the current autocomplete default branch
     */
    rebaseForkOnDefaultBranch(octokit, fork) {
        return __awaiter(this, void 0, void 0, function* () {
            const upstreamMaster = yield octokit.rest.git.getRef(Object.assign(Object.assign({}, this.autocompleteRepo), { ref: `heads/${this.autocompleteDefaultBranch}` }));
            const newSha = upstreamMaster.data.object.sha;
            yield octokit.rest.git.updateRef(Object.assign(Object.assign({}, fork), { ref: `heads/${this.autocompleteDefaultBranch}`, sha: newSha }));
            core.info(`Rebased ${fork} on top of 'heads/${this.autocompleteDefaultBranch}'`);
        });
    }
    /**
     * Checks if a fork of the autocomplete repo already exists or it creates a new one for the current user
     */
    checkOrCreateFork(octokit) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield octokit.rest.users.getAuthenticated();
            core.info(`Authenticated user: ${user.data.login}`);
            const autocompleteForks = yield octokit.rest.repos.listForks(this.autocompleteRepo);
            for (let i = 0; i < autocompleteForks.data.length; i++) {
                const fork = autocompleteForks.data[i];
                if (fork.owner.login === user.data.login) {
                    core.info('A fork of the target autocomplete repo already exists');
                    const forkData = { owner: fork.owner.login, repo: fork.name };
                    yield this.rebaseForkOnDefaultBranch(octokit, forkData);
                    return forkData;
                }
            }
            // TODO: race until the repo is created
            const createdFork = yield octokit.rest.repos.createFork(this.autocompleteRepo);
            core.info(`Created fork: ${createdFork.data.owner.login}/${createdFork.data.name}`);
            return { owner: user.data.login, repo: createdFork.data.name };
        });
    }
    /**
     * Gets a spec file from the autocomplete repo
     * @param octokit the Octokit object
     * @param specPath the path relative to `src/` of the spec in the default autocomplete repo, excluding the extension
     */
    getSpec(octokit, specPath) {
        return __awaiter(this, void 0, void 0, function* () {
            let fileData;
            try {
                fileData = yield octokit.rest.repos.getContent(Object.assign(Object.assign({}, this.autocompleteRepo), { path: specPath }));
            }
            catch (error) {
                if (error.status === 404) {
                    return null;
                }
                throw error;
            }
            if ((0, utils_1.isFile)(fileData.data)) {
                return Buffer.from(fileData.data.content, 'base64').toString();
            }
            throw new Error(`spec-path: ${specPath} does not correspond to a valid file`);
        });
    }
}
exports.AutocompleteRepoManager = AutocompleteRepoManager;

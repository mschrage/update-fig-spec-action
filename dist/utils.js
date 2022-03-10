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
exports.isFile = exports.getFormattedSpecContent = exports.getRepoDefaultBranch = void 0;
const github = __importStar(require("@actions/github"));
const prettier_1 = require("./prettier");
const eslint_1 = require("./eslint");
function getRepoDefaultBranch(octokit, repo) {
    return __awaiter(this, void 0, void 0, function* () {
        return (yield octokit.rest.repos.get(repo)).data.default_branch;
    });
}
exports.getRepoDefaultBranch = getRepoDefaultBranch;
function getFormattedSpecContent(octokit, specPath) {
    return __awaiter(this, void 0, void 0, function* () {
        const specFile = yield octokit.rest.repos.getContent(Object.assign(Object.assign({}, github.context.repo), { path: specPath }));
        if (isFile(specFile.data)) {
            const decodedFile = Buffer.from(specFile.data.content, 'base64').toString();
            const lintedString = yield (0, eslint_1.lintString)(decodedFile, specPath);
            return (0, prettier_1.format)(lintedString);
        }
        throw new Error(`spec-path: ${specPath} does not correspond to a valid file`);
    });
}
exports.getFormattedSpecContent = getFormattedSpecContent;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isFile(value) {
    return !Array.isArray(value) && value.type === 'file';
}
exports.isFile = isFile;

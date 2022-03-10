"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.lintString = void 0;
// import modules required by eslint configuration so that they get bundled by ncc
require("@typescript-eslint/parser");
require("@typescript-eslint/eslint-plugin");
require("@withfig/eslint-plugin-fig-linter");
require("eslint-plugin-compat");
const eslint_1 = require("eslint");
const path_1 = __importDefault(require("path"));
const config = {
    parser: '@typescript-eslint/parser',
    parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module'
    },
    extends: [
        'plugin:@typescript-eslint/recommended',
        'plugin:@withfig/fig-linter/recommended',
        'plugin:compat/recommended'
    ],
    env: {
        browser: true
    },
    plugins: ['@withfig/fig-linter'],
    rules: {
        '@typescript-eslint/explicit-module-boundary-types': 0,
        'no-unused-vars': ['off'],
        'no-var': ['off'],
        '@typescript-eslint/no-unused-vars': ['off']
    }
};
const BASE_ERROR_MESSAGE = `The action encountered the following error(s) while linting the generated spec,
if you are using some official integration report the failure to the Fig team to receive help:\n\n\n`;
function lintString(code, specPath) {
    return __awaiter(this, void 0, void 0, function* () {
        const eslint = new eslint_1.ESLint({
            resolvePluginsRelativeTo: path_1.default.join(process.cwd(), 'dist'),
            baseConfig: config,
            fix: true,
            useEslintrc: false
        });
        const [lintResult] = yield eslint.lintText(code, { filePath: specPath });
        if (lintResult.errorCount > lintResult.fixableErrorCount) {
            throw new Error(BASE_ERROR_MESSAGE +
                lintResult.messages
                    .map(m => `${m.ruleId} ${m.line}:${m.column} - ${m.message}`)
                    .join('\n'));
        }
        return lintResult.output || code;
    });
}
exports.lintString = lintString;

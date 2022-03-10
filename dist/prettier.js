"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.format = void 0;
const prettier_1 = __importDefault(require("prettier"));
function format(code) {
    return prettier_1.default.format(code, { parser: 'typescript' });
}
exports.format = format;

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTransport = getTransport;
const nodemailer_1 = __importDefault(require("nodemailer"));
let _transport = null;
function getTransport() {
    if (!_transport) {
        const port = Number(process.env.EMAIL_PORT) || 587;
        _transport = nodemailer_1.default.createTransport({
            host: process.env.EMAIL_HOST,
            port,
            secure: port === 465,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });
    }
    return _transport;
}
//# sourceMappingURL=emailTransport.js.map
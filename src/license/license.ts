import { sendRequestToServer } from "../utils/requests";
import Config from "../config/config";
import { FetchResponse } from "../../maze-utils/src/background-request-proxy";
import { logError } from "../utils/logger";

export function isActivated() {
    return true;
}

export function freeTrialActive() {
    return true;
}

export function getFreeTrialTimeLeft() {
    return Infinity;
}

export function isFreeAccessRequestActive() {
    return false;
}

export function getFreeAccessRequestTimeLeft() {
    return Infinity;
}

export async function getLicenseKey(): Promise<string | null> {
    return "";
}

async function generateLicenseKey(type: "free") {
    let result: FetchResponse
    try {
        result = await sendRequestToServer("GET", `/api/generateToken/${type}`, {
            key: Date.now()
        });
    } catch (e) {
        logError("Caught an error while requesting to generate a license key", e);
        return null;
    }

    if (result.status === 200) {
        const json = JSON.parse(result.responseText);

        return json.licenseKey ?? null;
    }

    return null;
}

export interface CustomContentScript {
    id: string;
    runAt: "document_start" | "document_end" | "document_idle";
    matches: string[];
    allFrames: boolean;
    js?: string[];
    css?: string[];
}

export function getContentScripts(activated?: boolean): CustomContentScript[] {
    activated ??= isActivated();

    if (activated) {
        return [{
            id: "content",
            runAt: "document_start",
            matches: [
                "https://*.youtube.com/*",
                "https://www.youtube-nocookie.com/embed/*"
            ],
            allFrames: true,
            js: [
                "./js/content.js"
            ],
            css: [
                "content.css",
                "shared.css"
            ]
        }];
    } else {
        return [{
            id: "unactivatedWarning",
            runAt: "document_start",
            matches: [
                "https://*.youtube.com/*",
                "https://www.youtube-nocookie.com/embed/*"
            ],
            allFrames: true,
            js: [
                "./js/unactivatedWarning.js"
            ]
        }];
    }
}

export function askBackgroundToRegisterNeededContentScripts(activated: boolean): Promise<void> {
    return new Promise((resolve) => chrome.runtime.sendMessage({
        message: "registerNeededContentScripts",
        activated
    }, resolve));
}

export function askBackgroundToSetupAlarms(): Promise<void> {
    return new Promise((resolve) => chrome.runtime.sendMessage({
        message: "setupAlarms",
    }, resolve));
}

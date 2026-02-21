function toHex(bytes: Uint8Array): string {
    return Array.from(bytes)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
}

export async function buildJoinFingerprint(): Promise<string> {
    const screenData = window.screen;
    const nav = window.navigator as Navigator & {deviceMemory?: number};
    const payload = {
        userAgent: nav.userAgent,
        language: nav.language,
        languages: nav.languages,
        platform: nav.platform,
        hardwareConcurrency: nav.hardwareConcurrency,
        deviceMemory: nav.deviceMemory ?? null,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        screen: {
            width: screenData.width,
            height: screenData.height,
            colorDepth: screenData.colorDepth,
            pixelRatio: window.devicePixelRatio,
        },
    };

    const raw = JSON.stringify(payload);
    if (!crypto?.subtle) {
        return raw;
    }
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(raw));
    return toHex(new Uint8Array(digest));
}

export function generateTimeOptions(): Array<{value: string; content: string}> {
    const step = 15;
    const options: Array<{value: string; content: string}> = [];
    for (let minutes = 0; minutes < 24 * 60; minutes += step) {
        const h24 = Math.floor(minutes / 60);
        const m = minutes % 60;
        const h12 = h24 === 0 ? 12 : h24 > 12 ? h24 - 12 : h24;
        const ampm = h24 < 12 ? 'AM' : 'PM';
        const t12 = `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
        const t24 = `${String(h24).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
        options.push({value: t24, content: t12});
    }
    return options;
}

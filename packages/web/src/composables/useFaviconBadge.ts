import { watch, unref } from 'vue'

interface FaviconBadgeOptions {
    backgroundColor?: string;
    textColor?: string;
    maxCount?: number;
}

export const useFaviconBadge = (
    countRef: () => number,
    options: FaviconBadgeOptions = {}
) => {
    const favicon = document.querySelector<HTMLLinkElement>('link[rel~="icon"]');
    if (!favicon) return;

    const bg = options.backgroundColor ?? '#ff2056';
    const fg = options.textColor ?? '#fff';
    const maxCount = options.maxCount ?? 99;

    const baseImage = new Image();
    baseImage.src = new URL('@/assets/logo.svg', import.meta.url).href;

    const drawBadge = (count: number) => {
        const size = 128;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;

        const ctx = canvas.getContext('2d')!;
        ctx.clearRect(0, 0, size, size);

        ctx.drawImage(baseImage, 0, 0, size, size);

        if (count > 0) {
            const radius = size * 0.4;
            const x = size - radius;
            const y = radius;

            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fillStyle = bg;
            ctx.fill();

            ctx.fillStyle = fg;
            ctx.font = `bold ${radius}px system-ui`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(count > maxCount ? `${maxCount}+` : String(count), x, y);
        }
        favicon.href = canvas.toDataURL('image/png');
    }

    baseImage.onload = () => {
        drawBadge(countRef());
    }

    watch(
        countRef,
        (value) => {
            if (baseImage.complete) {
                drawBadge(unref(value));
            }
        },
        { immediate: true }
    )
}

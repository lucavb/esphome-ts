export const convertNumbers = (
    num: number,
    max: number = 255,
    fromEsp: boolean = false,
): number => {
    if (fromEsp) {
        return Math.floor(num * max);
    } else {
        return Math.min(Math.max(num, 0), max) / max;
    }
};

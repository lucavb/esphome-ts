export const convertNumbers = (num: number, max = 255, fromEsp = false): number => {
    if (fromEsp) {
        return Math.floor(num * max);
    } else {
        return Math.min(Math.max(num, 0), max) / max;
    }
};

export const convertNumbers = (num: number, fromEsp: boolean): number => {
    if (fromEsp) {
        return Math.floor(num * 100.0);
    } else {
        return Math.min(Math.max(num, 0), 100) / 100.0;
    }
};

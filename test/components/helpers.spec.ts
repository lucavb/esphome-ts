import { convertNumbers } from '../../src/components/helpers';

describe('esphome-ts helpers', () => {
    describe('convert-numbers', () => {
        it('should convert towards the esp scale', () => {
            const input = 5;
            const max = 100;
            const result = convertNumbers(input, max);
            expect(result).toBe(input / max);
        });

        it('should convert from the esp scale', () => {
            const input = 0.8;
            const max = 255;
            const result = convertNumbers(input, max, true);
            expect(result).toBe(input * max);
        });

        it('should do max conversion', () => {
            const input = -50;
            const max = 100;
            const result = convertNumbers(input, max, false);
            expect(result).toBe(0);
        });

        it('should do min conversion', () => {
            const input = 150;
            const max = 100;
            const result = convertNumbers(input, max, false);
            expect(result).toBe(1);
        });
    });
});

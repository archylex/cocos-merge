export const utils = {
    getRandomIndices(count: number): number[] {
        const array = new Array(count).fill(0).map((e, i) => e = i);
        const result = [];
        
        for (let i = 0; i < array.length; i++) {
            const idx = Math.floor(Math.random() * array.length);    
            result.push(array.splice(idx, 1));
        }

        return result;
    }
}
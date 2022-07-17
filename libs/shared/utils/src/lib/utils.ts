export function delay(delay: number) {
    return new Promise(resolve => setTimeout(resolve, delay));
}

export function getNextIndex(currentIndex: number, array: any[]): number {
    return currentIndex >= array.length - 1 ? 0 : currentIndex + 1;
}

export function isObject(item: any): item is {[key: string]: any } {
    return (item && typeof item === 'object' && !Array.isArray(item));
}

export function mergeDeep(target: any, source: any) {
    const output = Object.assign({}, target);
    if (isObject(target) && isObject(source)) {
        Object.keys(source).forEach(key => {
            if (isObject(source[key])) {
                if (!(key in target))
                    Object.assign(output, { [key]: source[key] });
                else
                    output[key] = mergeDeep(target[key], source[key]);
            } else {
                Object.assign(output, { [key]: source[key] });
            }
        });
    }
    return output;
}


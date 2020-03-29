export const convertObjectToParameters = (obj: any) => {
    return Object.keys(flatten(obj))
        .filter((key) => !!obj[key])
        .map((key) => `${key}=${obj[key]}`)
        .join('&');
};


const flatten = (obj: object) => {
    return Object.assign({}, ...function _flatten(o): any {
        // @ts-ignore
        return [].concat(...Object.keys(o).map((k) => typeof o[k] === 'object' ? _flatten(o[k]) : ({[k]: o[k]})));
    }(obj));
};

export const jsonCopy = (original: object) => {
    return JSON.parse(JSON.stringify(original));
};

export const clone = (original: any): any => Object.assign(Object.create(Object.getPrototypeOf(original)), original);

export const clone = (original: never): never => Object.assign(Object.create(Object.getPrototypeOf(original)), original);

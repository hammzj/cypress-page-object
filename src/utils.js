export const clone = (original) =>
    Object.assign(Object.create(Object.getPrototypeOf(original)), original);

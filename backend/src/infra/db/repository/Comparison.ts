export const Comparison = {
    equal: "=",
    notEqual: "!=",
    lessThan: "<",
    lessThanOrEqual: "<=",
    greaterThan: ">",
    greaterThanOrEqual: ">="
};

export type Comparison = (typeof Comparison)[keyof typeof Comparison];
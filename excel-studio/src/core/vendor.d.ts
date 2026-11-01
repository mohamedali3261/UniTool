declare module "fast-formula-parser" {
  class FormulaParser {
    static FormulaError: any;
    constructor(options?: any);
    parse(formula: string, position?: any, allowArray?: boolean): any;
    supportedFunctions(): string[];
  }
  export default FormulaParser;
}

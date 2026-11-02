import SUM from "./SUM";
import AVERAGE from "./AVERAGE";
import COUNT from "./COUNT";
import COUNTA from "./COUNTA";
import MAX from "./MAX";
import MIN from "./MIN";
import IF from "./IF";
import SUMIF from "./SUMIF";
import COUNTIF from "./COUNTIF";
import VLOOKUP from "./VLOOKUP";
import type { FormulaLesson } from "./types";
export const formulaLessons: Record<string, FormulaLesson> = {
  SUM,
  AVERAGE,
  COUNT,
  COUNTA,
  MAX,
  MIN,
  IF,
  SUMIF,
  COUNTIF,
  VLOOKUP,
};

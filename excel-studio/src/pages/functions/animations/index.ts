import SUMIFS from "./SUMIFS";
import COUNTIFS from "./COUNTIFS";
import AVERAGEIF from "./AVERAGEIF";
import IFERROR from "./IFERROR";
import AND from "./AND";
import OR from "./OR";
import ROUND from "./ROUND";
import LEN from "./LEN";
import LEFT from "./LEFT";
import CONCATENATE from "./CONCATENATE";
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
  SUMIFS,
  COUNTIFS,
  AVERAGEIF,
  IFERROR,
  AND,
  OR,
  ROUND,
  LEN,
  LEFT,
  CONCATENATE,
};

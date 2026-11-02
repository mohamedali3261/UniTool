import SUMPRODUCT from "./lessons/math/SUMPRODUCT";
import QUOTIENT from "./lessons/math/QUOTIENT";
import TRUNC from "./lessons/math/TRUNC";
import SIGN from "./lessons/math/SIGN";
import EVEN from "./lessons/math/EVEN";
import ODD from "./lessons/math/ODD";
import INDEX from "./lessons/lookup/INDEX";
import ROW from "./lessons/lookup/ROW";
import COLUMN from "./lessons/lookup/COLUMN";
import ROWS from "./lessons/lookup/ROWS";
import COLUMNS from "./lessons/lookup/COLUMNS";
import NOT from "./lessons/logic/NOT";
import IFNA from "./lessons/logic/IFNA";
import FIND from "./lessons/text/FIND";
import SEARCH from "./lessons/text/SEARCH";
import REPLACE from "./lessons/text/REPLACE";
import EXACT from "./lessons/text/EXACT";
import REPT from "./lessons/text/REPT";
import VALUE from "./lessons/text/VALUE";
import TEXT from "./lessons/text/TEXT";
import SUM from "./lessons/math/SUM";
import SUMIF from "./lessons/math/SUMIF";
import SUMIFS from "./lessons/math/SUMIFS";
import ROUND from "./lessons/math/ROUND";
import AVERAGE from "./lessons/statistics/AVERAGE";
import COUNT from "./lessons/statistics/COUNT";
import COUNTA from "./lessons/statistics/COUNTA";
import MAX from "./lessons/statistics/MAX";
import MIN from "./lessons/statistics/MIN";
import COUNTIF from "./lessons/statistics/COUNTIF";
import COUNTIFS from "./lessons/statistics/COUNTIFS";
import AVERAGEIF from "./lessons/statistics/AVERAGEIF";
import IF from "./lessons/logic/IF";
import IFERROR from "./lessons/logic/IFERROR";
import AND from "./lessons/logic/AND";
import OR from "./lessons/logic/OR";
import LEN from "./lessons/text/LEN";
import LEFT from "./lessons/text/LEFT";
import CONCATENATE from "./lessons/text/CONCATENATE";
import VLOOKUP from "./lessons/lookup/VLOOKUP";
import PRODUCT from "./lessons/math/PRODUCT";
import ABS from "./lessons/math/ABS";
import ROUNDUP from "./lessons/math/ROUNDUP";
import ROUNDDOWN from "./lessons/math/ROUNDDOWN";
import INT from "./lessons/math/INT";
import MOD from "./lessons/math/MOD";
import POWER from "./lessons/math/POWER";
import SQRT from "./lessons/math/SQRT";
import MEDIAN from "./lessons/statistics/MEDIAN";
import LARGE from "./lessons/statistics/LARGE";
import SMALL from "./lessons/statistics/SMALL";
import COUNTBLANK from "./lessons/statistics/COUNTBLANK";
import AVERAGEIFS from "./lessons/statistics/AVERAGEIFS";
import RIGHT from "./lessons/text/RIGHT";
import MID from "./lessons/text/MID";
import UPPER from "./lessons/text/UPPER";
import LOWER from "./lessons/text/LOWER";
import TRIM from "./lessons/text/TRIM";
import SUBSTITUTE from "./lessons/text/SUBSTITUTE";
import MATCH from "./lessons/lookup/MATCH";
import type { FormulaLesson } from "./types";
export const formulaLessons: Record<string, FormulaLesson> = {
  SUMPRODUCT,
  QUOTIENT,
  TRUNC,
  SIGN,
  EVEN,
  ODD,
  INDEX,
  ROW,
  COLUMN,
  ROWS,
  COLUMNS,
  NOT,
  IFNA,
  FIND,
  SEARCH,
  REPLACE,
  EXACT,
  REPT,
  VALUE,
  TEXT,

  SUM,
  SUMIF,
  SUMIFS,
  ROUND,
  AVERAGE,
  COUNT,
  COUNTA,
  MAX,
  MIN,
  COUNTIF,
  COUNTIFS,
  AVERAGEIF,
  IF,
  IFERROR,
  AND,
  OR,
  LEN,
  LEFT,
  CONCATENATE,
  VLOOKUP,
  PRODUCT,
  ABS,
  ROUNDUP,
  ROUNDDOWN,
  INT,
  MOD,
  POWER,
  SQRT,
  MEDIAN,
  LARGE,
  SMALL,
  COUNTBLANK,
  AVERAGEIFS,
  RIGHT,
  MID,
  UPPER,
  LOWER,
  TRIM,
  SUBSTITUTE,
  MATCH,
};
export const lessonSections: Record<string, string> = {
  SUMPRODUCT: "math",
  QUOTIENT: "math",
  TRUNC: "math",
  SIGN: "math",
  EVEN: "math",
  ODD: "math",
  INDEX: "lookup",
  ROW: "lookup",
  COLUMN: "lookup",
  ROWS: "lookup",
  COLUMNS: "lookup",
  NOT: "logic",
  IFNA: "logic",
  FIND: "text",
  SEARCH: "text",
  REPLACE: "text",
  EXACT: "text",
  REPT: "text",
  VALUE: "text",
  TEXT: "text",

  SUM: "math",
  SUMIF: "math",
  SUMIFS: "math",
  ROUND: "math",
  AVERAGE: "statistics",
  COUNT: "statistics",
  COUNTA: "statistics",
  MAX: "statistics",
  MIN: "statistics",
  COUNTIF: "statistics",
  COUNTIFS: "statistics",
  AVERAGEIF: "statistics",
  IF: "logic",
  IFERROR: "logic",
  AND: "logic",
  OR: "logic",
  LEN: "text",
  LEFT: "text",
  CONCATENATE: "text",
  VLOOKUP: "lookup",
  PRODUCT: "math",
  ABS: "math",
  ROUNDUP: "math",
  ROUNDDOWN: "math",
  INT: "math",
  MOD: "math",
  POWER: "math",
  SQRT: "math",
  MEDIAN: "statistics",
  LARGE: "statistics",
  SMALL: "statistics",
  COUNTBLANK: "statistics",
  AVERAGEIFS: "statistics",
  RIGHT: "text",
  MID: "text",
  UPPER: "text",
  LOWER: "text",
  TRIM: "text",
  SUBSTITUTE: "text",
  MATCH: "lookup",
};

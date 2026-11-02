/** نموذج تقارير محلي، محفوظ داخل ملف المشروع وليس خدمة Power BI سحابية. */
export type Aggregate =
  "sum" | "average" | "count" | "distinct" | "min" | "max";
export type VisualType =
  "kpi" | "bar" | "line" | "area" | "donut" | "scatter" | "table";
export interface BIWidget {
  id: string;
  title: string;
  type: VisualType;
  metric: string;
  dimension: string;
  secondary?: string;
  aggregation: Aggregate;
  bucket: "none" | "month" | "year";
  sort: "value-desc" | "value-asc" | "label";
  limit: number;
  wide: boolean;
  color: string;
  target?: number;
}
export interface BIFilter {
  id: string;
  field: string;
  op: "eq" | "contains" | "gt" | "lt" | "between" | "empty" | "notempty";
  value: string;
  value2?: string;
  bucket?: BIWidget["bucket"];
}
export interface Dashboard {
  version: 1;
  title: string;
  source: string;
  widgets: BIWidget[];
  filters: BIFilter[];
  excludeTotals: boolean;
}
export interface ValidationRule {
  column: number;
  type: "number" | "list" | "date";
  min?: number;
  max?: number;
  options?: string[];
  required: boolean;
}
export interface ConditionalRule {
  id: string;
  column: number;
  op: "gt" | "lt" | "between" | "duplicates" | "empty" | "contains";
  value: string;
  value2?: string;
  fill: string;
  color: string;
}

import { DataFieldEnum } from '../../enums/data-field-enum';
import { SeverityEnum } from '../../enums/severity-enum';
import { StatusEnum } from '../../enums/status-enum';

export interface MetricsSummaryResponseInterface {
  window: WindowResponseInterface;
  filters: FiltersResponseInterface;
  incidents: IncidentsKpiResponseInterface;
  time: TimeKpiResponseInterface;
  score: ScoreKpiResponseInterface;
  actions: ActionsKpiResponseInterface;
}

export interface WindowResponseInterface {
  from: string;
  to: string;
  dateField: DataFieldEnum;
}

export interface FiltersResponseInterface {
  severities: SeverityEnum[];
  statuses: StatusEnum[];
}

export interface IncidentsKpiResponseInterface {
  total: number;
  open: number;
  closed: number;
  bySeverity: Record<string, number>;
}

export interface TimeKpiResponseInterface {
  mtta: DistResponseInterface;
  mttr: DistResponseInterface;
}

export interface DistResponseInterface {
  avgMin: number | null;
  p50Min: number | null;
  p90Min: number | null;
  count: number;
}

export interface ScoreKpiResponseInterface {
  avg: number | null;
  p50: number | null;
  p90: number | null;
  count: number;
  checksCoveragePct: ChecksCoverageResponseInterface;
}

export interface ChecksCoverageResponseInterface {
  minEvents: number | null;
  impact: number | null;
  fiveWhys: number | null;
  rootAndFactors: number | null;
  actionsBoth: number | null;
  communication: number | null;
}

export interface ActionsKpiResponseInterface {
  total: number;
  open: number;
  overdueOpen: number;
  done: number;
  doneOnTime: number;
  doneLate: number;
  onTimeRatePct: number | null;
}
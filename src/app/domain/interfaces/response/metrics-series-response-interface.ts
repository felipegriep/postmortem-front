import { BucketEnum } from '../../enums/bucket-enum';

export interface MetricsSeriesResponseInterface {
  bucket: BucketEnum;
  points: PointResponseInterface[];
}

export interface PointResponseInterface {
  at: string; // início do bucket (yyyy-MM-dd)
  incidents: number;
  avgMttaMin: number | null;
  avgMttrMin: number | null;
  avgScore: number | null;
  onTimeRatePct: number | null;
}
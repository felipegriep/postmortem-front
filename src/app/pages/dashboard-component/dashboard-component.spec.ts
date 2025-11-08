import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of } from 'rxjs';
import { RouterTestingModule } from '@angular/router/testing';

import { DashboardComponent } from './dashboard-component';
import { MetricsService } from '../../services/metrics-service';
import { MetricsSummaryResponseInterface } from '../../domain/interfaces/response/metrics-summary-response-interface';
import { MetricsSeriesResponseInterface } from '../../domain/interfaces/response/metrics-series-response-interface';
import { DataFieldEnum } from '../../domain/enums/data-field-enum';
import { SeverityEnum } from '../../domain/enums/severity-enum';
import { StatusEnum } from '../../domain/enums/status-enum';
import { BucketEnum } from '../../domain/enums/bucket-enum';

describe('DashboardComponent', () => {
    let component: DashboardComponent;
    let fixture: ComponentFixture<DashboardComponent>;
    let metricsService: jasmine.SpyObj<MetricsService>;

    const mockSummaryData: MetricsSummaryResponseInterface = {
        window: {
            from: '2024-01-01',
            to: '2024-01-31',
            dateField: DataFieldEnum.STARTED,
        },
        filters: {
            severities: [SeverityEnum.SEV_1],
            statuses: [StatusEnum.OPEN],
        },
        incidents: {
            total: 12,
            open: 3,
            closed: 9,
            bySeverity: { 'SEV-1': 2, 'SEV-2': 10 },
        },
        time: {
            mtta: {
                avgMin: 14,
                p50Min: 12,
                p90Min: 25,
                count: 12,
            },
            mttr: {
                avgMin: 68,
                p50Min: 55,
                p90Min: 120,
                count: 9,
            },
        },
        score: {
            avg: 72,
            p50: 75,
            p90: 85,
            count: 12,
            checksCoveragePct: {
                minEvents: 85.0,
                impact: 75.0,
                fiveWhys: 58.0,
                rootAndFactors: 70.0,
                actionsBoth: 80.0,
                communication: 65.0,
            },
        },
        actions: {
            total: 25,
            open: 8,
            overdueOpen: 3,
            done: 17,
            doneOnTime: 14,
            doneLate: 3,
            onTimeRatePct: 82.4,
        },
    };

    const mockSeriesData: MetricsSeriesResponseInterface = {
        bucket: BucketEnum.DAY,
        points: [
            {
                at: '2024-01-01',
                incidents: 2,
                avgMttaMin: 15,
                avgMttrMin: 60,
                avgScore: 70,
                onTimeRatePct: 85.0,
            },
            {
                at: '2024-01-02',
                incidents: 1,
                avgMttaMin: 12,
                avgMttrMin: 45,
                avgScore: 75,
                onTimeRatePct: 90.0,
            },
        ],
    };

    beforeEach(async () => {
        const spy = jasmine.createSpyObj('MetricsService', ['summary', 'series']);

        await TestBed.configureTestingModule({
            imports: [
                DashboardComponent,
                NoopAnimationsModule,
                HttpClientTestingModule,
                RouterTestingModule,
            ],
            providers: [{ provide: MetricsService, useValue: spy }],
        }).compileComponents();

        fixture = TestBed.createComponent(DashboardComponent);
        component = fixture.componentInstance;
        metricsService = TestBed.inject(MetricsService) as jasmine.SpyObj<MetricsService>;
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should load data on init', () => {
        metricsService.summary.and.returnValue(of(mockSummaryData));
        metricsService.series.and.returnValue(of(mockSeriesData));

        component.ngOnInit();

        expect(metricsService.summary).toHaveBeenCalled();
        expect(metricsService.series).toHaveBeenCalled();
    });

    it('should clear filters', () => {
        component.filters.severities = [SeverityEnum.SEV_1];
        component.filters.statuses = [StatusEnum.CLOSED];
        component.filters.includeOpenInMttr = true;

        metricsService.summary.and.returnValue(of(mockSummaryData));
        metricsService.series.and.returnValue(of(mockSeriesData));

        component.clearFilters();

        expect(component.filters.severities).toEqual([]);
        expect(component.filters.statuses).toEqual([]);
        expect(component.filters.includeOpenInMttr).toBe(false);
    });

    it('should apply filters', () => {
        metricsService.summary.and.returnValue(of(mockSummaryData));
        metricsService.series.and.returnValue(of(mockSeriesData));

        component.applyFilters();

        expect(metricsService.summary).toHaveBeenCalled();
        expect(metricsService.series).toHaveBeenCalled();
    });
});

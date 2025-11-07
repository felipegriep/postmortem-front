import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule, DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE, NativeDateAdapter } from '@angular/material/core';
import { MatChipsModule } from '@angular/material/chips';
import { Platform } from '@angular/cdk/platform';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { NgxEchartsModule } from 'ngx-echarts';
import type { EChartsOption } from 'echarts';

import { DataFieldEnum } from '../../domain/enums/data-field-enum';
import { normalizeToDate } from '../../shared/date-utils';
import { SeverityEnum } from '../../domain/enums/severity-enum';

// Custom Date Adapter para formato brasileiro
class BrazilianDateAdapter extends NativeDateAdapter {
    override getFirstDayOfWeek(): number {
        return 0; // Domingo
    }
    
    override format(date: Date, displayFormat: Object): string {
        if (displayFormat === 'input') {
            const day = date.getDate().toString().padStart(2, '0');
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const year = date.getFullYear();
            return `${day}/${month}/${year}`;
        }
        return super.format(date, displayFormat);
    }
}

// Formato de data brasileiro
const BR_DATE_FORMATS = {
    parse: {
        dateInput: 'input',
    },
    display: {
        dateInput: 'input',
        monthYearLabel: { year: 'numeric', month: 'short' },
        dateA11yLabel: { year: 'numeric', month: 'long', day: 'numeric' },
        monthYearA11yLabel: { year: 'numeric', month: 'long' },
    },
};
import { StatusEnum } from '../../domain/enums/status-enum';
import { BucketEnum } from '../../domain/enums/bucket-enum';
import { MetricsService, GetMetricsSummaryParams, GetMetricsSeriesParams } from '../../services/metrics-service';
import { MetricsSummaryResponseInterface } from '../../domain/interfaces/response/metrics-summary-response-interface';
import { MetricsSeriesResponseInterface } from '../../domain/interfaces/response/metrics-series-response-interface';

interface DashboardFilters {
    startDate: Date | null;
    endDate: Date | null;
    dateField: DataFieldEnum;
    severities: SeverityEnum[];
    statuses: StatusEnum[];
    includeOpenInMttr: boolean;
}

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        MatToolbarModule,
        MatCardModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatDatepickerModule,
        MatNativeDateModule,
        MatChipsModule,
        MatButtonToggleModule,
        MatSlideToggleModule,
        MatButtonModule,
        MatProgressSpinnerModule,
        MatIconModule,
        NgxEchartsModule,
    ],
    providers: [
        { provide: MAT_DATE_LOCALE, useValue: 'pt-BR' },
        { provide: MAT_DATE_FORMATS, useValue: BR_DATE_FORMATS },
        { provide: DateAdapter, useClass: BrazilianDateAdapter },
    ],
    templateUrl: './dashboard-component.html',
    styleUrls: ['./dashboard-component.scss'],
})
export class DashboardComponent implements OnInit {
    // Dados
    summaryData: MetricsSummaryResponseInterface | null = null;
    seriesData: MetricsSeriesResponseInterface | null = null;
    
    // Estado
    loading = false;
    errorMessage: string | null = null;

    // Filtros
    filters: DashboardFilters = {
        startDate: this.getDefaultStartDate(),
        endDate: new Date(),
        dateField: DataFieldEnum.STARTED,
        severities: [],
        statuses: [],
        includeOpenInMttr: false,
    };

    // Opções disponíveis
    availableSeverities = Object.values(SeverityEnum);
    availableStatuses = Object.values(StatusEnum);

    // Configurações dos gráficos
    timeChartOption: EChartsOption = {};
    qualityChartOption: EChartsOption = {};
    
    // Chave única para forçar recriação do gráfico quando necessário
    chartKey = Date.now();

    constructor(private metricsService: MetricsService) {}

    ngOnInit(): void {
        this.loadData();
    }

    private formatDateToDD_MM_YYYY(dateString: string): string {
        const date = normalizeToDate(dateString);
        if (!date) return dateString;
        
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        
        return `${day}/${month}/${year}`;
    }

    private getDefaultStartDate(): Date {
        const date = new Date();
        date.setMonth(date.getMonth() - 1); // 1 mês atrás
        return date;
    }

    private formatDateForApi(date: Date | null): string {
        if (!date) return '';
        return date.toISOString().split('T')[0]; // yyyy-MM-dd
    }

    applyFilters(): void {
        this.loadData();
    }

    clearFilters(): void {
        this.filters = {
            startDate: this.getDefaultStartDate(),
            endDate: new Date(),
            dateField: DataFieldEnum.STARTED,
            severities: [],
            statuses: [],
            includeOpenInMttr: false,
        };
        this.loadData();
    }

    private loadData(): void {
        if (!this.filters.startDate || !this.filters.endDate) {
            this.errorMessage = 'Por favor, selecione um período válido.';
            return;
        }

        this.loading = true;
        this.errorMessage = null;

        // Parâmetros para o summary
        const summaryParams: GetMetricsSummaryParams = {
            from: this.formatDateForApi(this.filters.startDate),
            to: this.formatDateForApi(this.filters.endDate),
            dateField: this.filters.dateField,
            severities: this.filters.severities.length > 0 ? this.filters.severities : undefined,
            statuses: this.filters.statuses.length > 0 ? this.filters.statuses : undefined,
            includeOpenInMttr: this.filters.includeOpenInMttr,
        };

        // Parâmetros para a série
        const seriesParams: GetMetricsSeriesParams = {
            from: this.formatDateForApi(this.filters.startDate),
            to: this.formatDateForApi(this.filters.endDate),
            bucket: BucketEnum.DAY, // Padrão: diário
            dateField: this.filters.dateField,
            severities: this.filters.severities.length > 0 ? this.filters.severities : undefined,
        };

        // Carregar dados em paralelo
        Promise.all([
            this.metricsService.summary(summaryParams).toPromise(),
            this.metricsService.series(seriesParams).toPromise(),
        ])
            .then(([summary, series]) => {
                this.summaryData = summary || null;
                this.seriesData = series || null;
                
                // Configurar gráficos se temos dados de série
                if (series) {
                    this.updateChartOptions(series);
                } else {
                    // Usar dados de exemplo para demonstração
                    this.loadExampleData();
                }
                
                // Forçar recriação dos gráficos para limpar qualquer estado problemático
                this.chartKey = Date.now();
                
                this.loading = false;
            })
            .catch((error) => {
                console.error('Erro ao carregar dados:', error);
                this.errorMessage = 'Erro ao carregar os dados do servidor. Exibindo dados de exemplo.';
                
                // Em caso de erro, carregar dados de exemplo para demonstração
                this.loadExampleData();
                
                // Forçar recriação dos gráficos para limpar qualquer estado problemático
                this.chartKey = Date.now();
                
                this.loading = false;
            });
    }

    private updateChartOptions(seriesData: MetricsSeriesResponseInterface): void {
        // Preparar dados para os gráficos
        const dates = seriesData.points.map(point => point.at);
        const formattedDates = dates.map(date => this.formatDateToDD_MM_YYYY(date));
        const mttaData = seriesData.points.map(point => point.avgMttaMin);
        const mttrData = seriesData.points.map(point => point.avgMttrMin);
        const scoreData = seriesData.points.map(point => point.avgScore);
        const onTimeData = seriesData.points.map(point => point.onTimeRatePct);

        // Configuração do gráfico de tempo (MTTA/MTTR)
        this.timeChartOption = {
            title: {
                text: 'MTTA / MTTR ao longo do tempo',
                left: 'center',
                textStyle: { 
                    fontSize: 14,
                    fontFamily: 'Exo 2, sans-serif'
                }
            },
            tooltip: {
                trigger: 'axis',
                axisPointer: {
                    type: 'cross',
                    animation: false
                },
                hideDelay: 100,
                enterable: false,
                confine: true,
                formatter: (params: any) => {
                    let result = `<strong>${params[0].axisValueLabel}</strong><br/>`;
                    params.forEach((param: any) => {
                        const value = param.value !== null ? `${param.value} min` : 'N/A';
                        result += `${param.marker} ${param.seriesName}: ${value}<br/>`;
                    });
                    return result;
                },
                textStyle: {
                    fontFamily: 'Exo 2, sans-serif'
                }
            },
            legend: {
                data: ['MTTA', 'MTTR'],
                bottom: 10,
                textStyle: {
                    fontFamily: 'Exo 2, sans-serif'
                }
            },
            xAxis: {
                type: 'category',
                data: formattedDates,
                axisLabel: { 
                    rotate: 45,
                    fontFamily: 'Exo 2, sans-serif'
                }
            },
            yAxis: {
                type: 'value',
                name: 'Minutos',
                nameLocation: 'middle',
                nameGap: 40,
                nameTextStyle: {
                    fontFamily: 'Exo 2, sans-serif'
                },
                axisLabel: {
                    fontFamily: 'Exo 2, sans-serif'
                }
            },
            series: [
                {
                    name: 'MTTA',
                    type: 'line',
                    data: mttaData,
                    itemStyle: { color: '#3b82f6' },
                    lineStyle: { color: '#3b82f6' },
                    symbol: 'circle',
                    symbolSize: 6,
                    connectNulls: false
                },
                {
                    name: 'MTTR',
                    type: 'line',
                    data: mttrData,
                    itemStyle: { color: '#ef4444' },
                    lineStyle: { color: '#ef4444' },
                    symbol: 'circle',
                    symbolSize: 6,
                    connectNulls: false
                }
            ],
            grid: {
                left: '10%',
                right: '10%',
                bottom: '20%',
                top: '15%'
            }
        };

        // Configuração do gráfico de qualidade (Score/On-time)
        this.qualityChartOption = {
            title: {
                text: 'Score médio / Taxa de conclusão no prazo',
                left: 'center',
                textStyle: { 
                    fontSize: 14,
                    fontFamily: 'Exo 2, sans-serif'
                }
            },
            tooltip: {
                trigger: 'axis',
                axisPointer: {
                    type: 'cross',
                    animation: false,
                    snap: true
                },
                showDelay: 0,
                hideDelay: 200,
                enterable: false,
                confine: true,
                transitionDuration: 0,
                alwaysShowContent: false,
                triggerOn: 'mousemove',
                formatter: (params: any) => {
                    if (!params || params.length === 0) return '';
                    let result = `<strong>${params[0].axisValueLabel}</strong><br/>`;
                    params.forEach((param: any, index: number) => {
                        let value = param.value;
                        if (value !== null && value !== undefined) {
                            value = index === 0 ? `${value}/100` : `${value.toFixed(1)}%`;
                        } else {
                            value = 'N/A';
                        }
                        result += `${param.marker} ${param.seriesName}: ${value}<br/>`;
                    });
                    return result;
                },
                textStyle: {
                    fontFamily: 'Exo 2, sans-serif'
                }
            },
            legend: {
                data: ['Score médio', 'On-time %'],
                bottom: 10,
                textStyle: {
                    fontFamily: 'Exo 2, sans-serif'
                }
            },
            xAxis: {
                type: 'category',
                data: formattedDates,
                axisLabel: { 
                    rotate: 45,
                    fontFamily: 'Exo 2, sans-serif'
                }
            },
            yAxis: [
                {
                    type: 'value',
                    name: 'Score (0-100)',
                    position: 'left',
                    nameLocation: 'middle',
                    nameGap: 40,
                    min: 0,
                    max: 100,
                    nameTextStyle: {
                        fontFamily: 'Exo 2, sans-serif'
                    },
                    axisLabel: {
                        fontFamily: 'Exo 2, sans-serif'
                    }
                },
                {
                    type: 'value',
                    name: 'Percentual (%)',
                    position: 'right',
                    nameLocation: 'middle',
                    nameGap: 40,
                    min: 0,
                    max: 100,
                    nameTextStyle: {
                        fontFamily: 'Exo 2, sans-serif'
                    },
                    axisLabel: {
                        fontFamily: 'Exo 2, sans-serif'
                    }
                }
            ],
            series: [
                {
                    name: 'Score médio',
                    type: 'line',
                    data: scoreData,
                    itemStyle: { color: '#10b981' },
                    lineStyle: { color: '#10b981' },
                    symbol: 'circle',
                    symbolSize: 6,
                    yAxisIndex: 0,
                    connectNulls: false
                },
                {
                    name: 'On-time %',
                    type: 'line',
                    data: onTimeData,
                    itemStyle: { color: '#8b5cf6' },
                    lineStyle: { color: '#8b5cf6' },
                    symbol: 'circle',
                    symbolSize: 6,
                    yAxisIndex: 1,
                    connectNulls: false
                }
            ],
            grid: {
                left: '10%',
                right: '10%',
                bottom: '20%',
                top: '15%'
            }
        };
    }

    private loadExampleData(): void {
        // Dados de exemplo para demonstração
        const exampleSummary: MetricsSummaryResponseInterface = {
            window: {
                from: this.formatDateForApi(this.filters.startDate),
                to: this.formatDateForApi(this.filters.endDate),
                dateField: this.filters.dateField,
            },
            filters: {
                severities: this.filters.severities,
                statuses: this.filters.statuses,
            },
            incidents: {
                total: 12,
                open: 3,
                closed: 9,
                bySeverity: { 'SEV-1': 2, 'SEV-2': 5, 'SEV-3': 4, 'SEV-4': 1 },
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

        const exampleSeries: MetricsSeriesResponseInterface = {
            bucket: BucketEnum.DAY,
            points: [
                { at: '2024-10-01', incidents: 2, avgMttaMin: 15, avgMttrMin: 60, avgScore: 70, onTimeRatePct: 85.0 },
                { at: '2024-10-02', incidents: 1, avgMttaMin: 12, avgMttrMin: 45, avgScore: 75, onTimeRatePct: 90.0 },
                { at: '2024-10-03', incidents: 3, avgMttaMin: 18, avgMttrMin: 80, avgScore: 65, onTimeRatePct: 70.0 },
                { at: '2024-10-04', incidents: 0, avgMttaMin: null, avgMttrMin: null, avgScore: null, onTimeRatePct: null },
                { at: '2024-10-05', incidents: 1, avgMttaMin: 10, avgMttrMin: 30, avgScore: 85, onTimeRatePct: 95.0 },
                { at: '2024-10-06', incidents: 2, avgMttaMin: 16, avgMttrMin: 65, avgScore: 72, onTimeRatePct: 80.0 },
                { at: '2024-10-07', incidents: 1, avgMttaMin: 8, avgMttrMin: 25, avgScore: 88, onTimeRatePct: 100.0 },
                { at: '2024-10-08', incidents: 2, avgMttaMin: 20, avgMttrMin: 95, avgScore: 60, onTimeRatePct: 65.0 },
            ],
        };

        this.summaryData = exampleSummary;
        this.seriesData = exampleSeries;
        this.updateChartOptions(exampleSeries);
    }
}
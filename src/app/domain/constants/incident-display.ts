import { SeverityEnum } from '../enums/severity-enum';
import { StatusEnum } from '../enums/status-enum';

export interface SelectOption<T> {
    value: T;
    label: string;
}

export const SEVERITY_LABELS: Record<SeverityEnum, string> = {
    [SeverityEnum.SEV_1]: 'Crítica (SEV-1)',
    [SeverityEnum.SEV_2]: 'Alta (SEV-2)',
    [SeverityEnum.SEV_3]: 'Moderada (SEV-3)',
    [SeverityEnum.SEV_4]: 'Baixa (SEV-4)',
};

export const STATUS_LABELS: Record<StatusEnum, string> = {
    [StatusEnum.OPEN]: 'Aberto',
    [StatusEnum.IN_ANALYSIS]: 'Em análise',
    [StatusEnum.CLOSED]: 'Fechado',
};

const buildValueMap = <T extends string>(values: T[]) => {
    const map: Record<string, T> = {};
    values.forEach((value) => {
        const base = value.toUpperCase();
        map[base] = value;
        map[base.replace(/-/g, '')] = value;
        map[base.replace(/_/g, '')] = value;
        map[base.replace(/\s+/g, '')] = value;
    });
    return map;
};

const SEVERITY_VALUE_MAP = buildValueMap(Object.values(SeverityEnum));
const STATUS_VALUE_MAP = buildValueMap(Object.values(StatusEnum));

export const SEVERITY_OPTIONS: SelectOption<SeverityEnum>[] = Object.values(SeverityEnum).map(
    (value) => ({
        value,
        label: SEVERITY_LABELS[value],
    })
);

export const STATUS_OPTIONS: SelectOption<StatusEnum>[] = Object.values(StatusEnum).map(
    (value) => ({
        value,
        label: STATUS_LABELS[value],
    })
);

export function toSeverityEnum(value?: string | SeverityEnum | null): SeverityEnum | undefined {
    if (!value) return undefined;
    const normalized = value.toString().trim().toUpperCase();
    return (
        SEVERITY_VALUE_MAP[normalized] ||
        SEVERITY_VALUE_MAP[normalized.replace(/[\s_-]/g, '')] ||
        undefined
    ) as SeverityEnum | undefined;
}

export function toStatusEnum(value?: string | StatusEnum | null): StatusEnum | undefined {
    if (!value) return undefined;
    const normalized = value.toString().trim().toUpperCase();
    return (
        STATUS_VALUE_MAP[normalized] ||
        STATUS_VALUE_MAP[normalized.replace(/[\s_-]/g, '')] ||
        undefined
    ) as StatusEnum | undefined;
}

export function getSeverityLabel(value?: string | SeverityEnum | null): string {
    const sev = toSeverityEnum(value);
    return sev ? SEVERITY_LABELS[sev] : value ?? '';
}

export function getStatusLabel(value?: string | StatusEnum | null): string {
    const status = toStatusEnum(value);
    return status ? STATUS_LABELS[status] : value ?? '';
}

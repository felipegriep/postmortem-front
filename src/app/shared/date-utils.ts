import { BACKEND_DATETIME_FORMAT } from './date.constants';

const pad = (value: number): string => value.toString().padStart(2, '0');

export function normalizeToDate(dateLike: Date | string | number | null | undefined): Date | null {
    if (dateLike === null || dateLike === undefined) {
        return null;
    }

    if (dateLike instanceof Date) {
        return isNaN(dateLike.getTime()) ? null : new Date(dateLike.getTime());
    }

    const raw = typeof dateLike === 'string' ? dateLike.trim() : String(dateLike).trim();
    if (!raw) return null;

    const isoLike = raw.includes(' ') && !raw.includes('T') ? raw.replace(' ', 'T') : raw;
    const parsed = new Date(isoLike);
    return isNaN(parsed.getTime()) ? null : parsed;
}

export function toLocalInputDateTime(
    dateLike: Date | string | number | null | undefined
): string | null {
    const parsed = normalizeToDate(dateLike);
    if (!parsed) return null;

    return [parsed.getFullYear(), pad(parsed.getMonth() + 1), pad(parsed.getDate())]
        .join('-')
        .concat('T')
        .concat(
            [pad(parsed.getHours()), pad(parsed.getMinutes()), pad(parsed.getSeconds())].join(':')
        );
}

export function toBackendDateTimeString(
    dateLike: Date | string | number | null | undefined
): string | null {
    const parsed = normalizeToDate(dateLike);
    if (!parsed) return null;

    return [parsed.getFullYear(), pad(parsed.getMonth() + 1), pad(parsed.getDate())]
        .join('-')
        .concat(' ')
        .concat(
            [pad(parsed.getHours()), pad(parsed.getMinutes()), pad(parsed.getSeconds())].join(':')
        );
}

export function formatDateToDisplay(
    dateLike: Date | string | number | null | undefined
): string | null {
    const parsed = normalizeToDate(dateLike);
    if (!parsed) return null;
    return [pad(parsed.getDate()), pad(parsed.getMonth() + 1), parsed.getFullYear()]
        .join('/')
        .concat(' ')
        .concat(
            [pad(parsed.getHours()), pad(parsed.getMinutes()), pad(parsed.getSeconds())].join(':')
        );
}

export { BACKEND_DATETIME_FORMAT };

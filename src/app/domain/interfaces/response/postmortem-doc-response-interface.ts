export interface PostmortemDocResponseInterface {
    id: number,
    incidentId: number,
    mdContent: Uint8Array,
    generatedAt: string;
    completenessScore: number;
    version: number;
    createdAt: string;
    updatedAt: string;
}

import { IMetadata } from "@src/types/element.collection";

export interface IPageMetadata extends IMetadata {
    baseUrl: string;
    path: string | "";
    title?: string;
}

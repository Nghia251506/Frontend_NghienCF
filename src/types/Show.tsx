export interface Show{
    id: number;
    title: string;
    description: string;
    date: Date;
    location: string;
    bannerUrl: string;
}
export interface ShowCreateDto{
    title: string;
    description: string;
    date: Date;
    location: string;
    bannerUrl: string;
}
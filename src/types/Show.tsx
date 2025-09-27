export interface Show{
    id: number;
    title: string;
    description: string;
    date: Date;
    location: string;
    bannerUrl: string;
    capacity: string;
    slogan: string;
}
export interface ShowCreateDto{
    title: string;
    description: string;
    date: Date;
    location: string;
    bannerUrl: string;
    capacity: string;
    slogan: string;
}
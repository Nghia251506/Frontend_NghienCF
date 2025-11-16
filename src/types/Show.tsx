export interface Show{
    id: number;
    title: string;
    description: string;
    date: Date;
    location: string;
    bannerUrl?: string;
    totalSeats: number;
    remainingSeats?:number;
    slogan: string;
    isDefault: 'Active' | 'Inactive';
    deleteStatus: 'Active' | 'Deleted';
}
export interface ShowCreateDto{
    title: string;
    description: string;
    date: string;
    location: string;
    bannerUrl: string;
    capacity: string;
    slogan: string;
}
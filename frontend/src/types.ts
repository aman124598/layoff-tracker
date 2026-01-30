export interface Layoff {
    id: number;
    company_name: string;
    layoff_date: string;
    employees_laid_off: number | null;
    country: string;
    industry: string;
    source_url: string;
}

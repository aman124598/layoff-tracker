export interface Layoff {
    id: number;
    company_name: string;
    layoff_date: string;
    employees_laid_off: number | null;
    country: string;
    industry: string;
    source_url: string;
    source_name?: string;
}

export type CommentKind = 'general' | 'helpful' | 'question' | 'correction' | 'false_flag';

export interface LayoffComment {
    id: number;
    layoff_id: number;
    display_name: string;
    comment_text: string;
    comment_kind: CommentKind;
    created_at: string;
}

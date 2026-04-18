import axios from 'axios';
import type { Layoff } from './types';

// Use environment variable for API URL, fallback to localhost for development
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const fetchLayoffs = async (): Promise<Layoff[]> => {
    const response = await axios.get(`${API_URL}/layoffs`);
    return response.data;
};

export const fetchLayoffsBySource = async (source: string): Promise<Layoff[]> => {
    const response = await axios.get(`${API_URL}/layoffs/by-source`, { params: { source } });
    return response.data;
};

export const fetchSources = async (): Promise<{ sources: Array<{ name: string; count: number }>; total: number }> => {
    const response = await axios.get(`${API_URL}/layoffs/sources`);
    return response.data;
};

export const fetchSourceStats = async () => {
    const response = await axios.get(`${API_URL}/layoffs/sources/stats`);
    return response.data;
};

export const syncLayoffs = async () => {
    const response = await axios.post(`${API_URL}/layoffs/sync`);
    return response.data;
};

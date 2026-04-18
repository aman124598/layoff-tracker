const axios = require('axios');
const { supabase } = require('../db');

const NEWS_API_URL = 'https://newsapi.org/v2/everything';

// Major companies - name must appear in title for validation
const MAJOR_COMPANIES = {
    'Google': ['google'],
    'Meta': ['meta', 'facebook'],
    'Microsoft': ['microsoft'],
    'Amazon': ['amazon'],
    'Apple': ['apple'],
    'Tesla': ['tesla'],
    'Netflix': ['netflix'],
    'Uber': ['uber'],
    'Spotify': ['spotify'],
    'Salesforce': ['salesforce'],
    'Intel': ['intel'],
    'IBM': ['ibm'],
    'Oracle': ['oracle'],
    'Cisco': ['cisco'],
    'Dell': ['dell'],
    'Nvidia': ['nvidia'],
    'AMD': ['amd'],
    'Samsung': ['samsung'],
    'Sony': ['sony'],
    'EA': ['electronic arts'],
    'Ubisoft': ['ubisoft'],
    'Disney': ['disney'],
    'Boeing': ['boeing'],
    'Ford': ['ford'],
    'Volkswagen': ['volkswagen'],
    'Walmart': ['walmart'],
    'Target': ['target'],
    'Mastercard': ['mastercard'],
    'Dow': ['dow'],
    'Accenture': ['accenture'],

    // Indian Companies
    'Flipkart': ['flipkart'],
    'Swiggy': ['swiggy'],
    'Zomato': ['zomato'],
    'Ola': ['ola'],
    'Paytm': ['paytm'],
    'PhonePe': ['phonepe'],
    'CRED': ['cred'],
    'Razorpay': ['razorpay'],
    'BYJU\'S': ['byju'],
    'Unacademy': ['unacademy'],
    'Vedantu': ['vedantu'],
    'Dunzo': ['dunzo'],
    'Meesho': ['meesho'],
    'Lenskart': ['lenskart'],
    'Nykaa': ['nykaa'],
    'BigBasket': ['bigbasket'],
    'Blinkit': ['blinkit'],
    'Cars24': ['cars24'],
    'Urban Company': ['urban company'],
    'Infosys': ['infosys'],
    'TCS': ['tcs'],
    'Wipro': ['wipro'],
    'HCL': ['hcl'],
    'Tech Mahindra': ['tech mahindra'],
    'Cognizant': ['cognizant'],
    'Freshworks': ['freshworks'],
    'OYO': ['oyo'],
    'ShareChat': ['sharechat'],
    'Groww': ['groww'],
};

// Extract and VALIDATE company name - must be in TITLE
const extractAndValidateCompany = (title) => {
    if (!title) return null;
    const titleLower = title.toLowerCase();

    for (const [company, keywords] of Object.entries(MAJOR_COMPANIES)) {
        for (const keyword of keywords) {
            // Company keyword must be in the TITLE (not just description)
            if (titleLower.includes(keyword.toLowerCase())) {
                return company;
            }
        }
    }

    return null;
};

// Extract employee count - MUST find a number
const extractEmployeeCount = (title, description) => {
    const text = `${title || ''} ${description || ''}`;

    // Patterns to find layoff numbers - very flexible
    const patterns = [
        /(\d{1,3}(?:,\d{3})*)\s*(?:employees?|workers?|jobs?|staff|people)?(?:\s*(?:laid|cut|fired|off|jobs?))?/i,
        /lay(?:s|ing)?\s*off\s*(\d{1,3}(?:,\d{3})*)/i,
        /cut(?:ting|s)?\s*(\d{1,3}(?:,\d{3})*)/i,
        /(\d{1,3}(?:,\d{3})*)\s*(?:layoffs?|job\s*cuts?)/i,
        /reduction\s*of\s*(\d{1,3}(?:,\d{3})*)/i,
        /(\d+)\s*percent/i, // Handle percentage-based reductions
    ];

    for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match) {
            const numStr = (match[1] || '').replace(/,/g, '');
            const num = parseInt(numStr, 10);
            // Accept numbers from 10 upwards (more inclusive)
            if (!isNaN(num) && num >= 10 && num < 1000000) {
                return num;
            }
        }
    }

    return null;
};

// Validate that title is about CONFIRMED layoffs (already happened)
const isConfirmedLayoff = (title) => {
    if (!title) return false;
    const titleLower = title.toLowerCase();

    // Keywords indicating layoffs (much more inclusive)
    const layoffKeywords = ['laid off', 'layoff', 'firing', 'fired', 'job cut', 'job cuts', 'cut jobs', 'cutting jobs', 'reduction', 'downsize', 'furlough', 'severance'];

    // Keywords indicating planned/at-risk (NOT confirmed) - exclude these
    const excludeKeywords = ['may cut', 'could cut', 'might cut', 'consider', 'considering', 'may consider', 'planned', 'plans to', 'planning', 'expected to', 'threatens', 'fears'];

    // Check if any exclude keywords are present - if so, reject
    if (excludeKeywords.some(kw => titleLower.includes(kw))) {
        return false;
    }

    // Must have a layoff keyword
    return layoffKeywords.some(kw => titleLower.includes(kw));
};

// Check if India-related
const isIndiaRelated = (title, description) => {
    const text = `${title || ''} ${description || ''}`.toLowerCase();
    const indiaKeywords = [
        'india', 'indian', 'bangalore', 'bengaluru', 'mumbai', 'delhi', 'hyderabad', 'chennai', 'pune', 'gurgaon', 'noida',
        'flipkart', 'swiggy', 'zomato', 'ola', 'paytm', 'byju', 'unacademy', 'vedantu', 'dunzo', 'meesho',
        'infosys', 'tcs', 'wipro', 'hcl', 'tech mahindra', 'oyo', 'freshworks', 'sharechat',
        'nykaa', 'bigbasket', 'blinkit', 'urban company', 'cars24', 'lenskart', 'cred', 'razorpay', 'groww',
    ];
    return indiaKeywords.some(keyword => text.includes(keyword));
};

// Get industry
const getIndustry = (companyName) => {
    const map = {
        'EdTech': ['BYJU\'S', 'Unacademy', 'Vedantu'],
        'E-Commerce': ['Flipkart', 'Amazon', 'Meesho', 'Nykaa', 'BigBasket', 'Blinkit'],
        'FinTech': ['Paytm', 'PhonePe', 'Razorpay', 'CRED', 'Groww', 'Mastercard'],
        'Food Delivery': ['Swiggy', 'Zomato', 'Dunzo'],
        'Transportation': ['Ola', 'Uber', 'Tesla', 'Ford', 'Volkswagen', 'Boeing'],
        'Technology': ['Google', 'Meta', 'Microsoft', 'Apple', 'Intel', 'IBM', 'Oracle', 'Cisco', 'Dell', 'Nvidia', 'AMD', 'Infosys', 'TCS', 'Wipro', 'HCL', 'Tech Mahindra', 'Cognizant', 'Freshworks', 'Salesforce', 'Accenture'],
        'Streaming': ['Netflix', 'Spotify', 'Disney'],
        'Gaming': ['Sony', 'EA', 'Ubisoft'],
        'Retail': ['Walmart', 'Target', 'Lenskart'],
        'Travel': ['OYO', 'Cars24', 'Urban Company'],
    };

    for (const [industry, companies] of Object.entries(map)) {
        if (companies.includes(companyName)) return industry;
    }
    return 'Technology';
};

// Fetch from NewsAPI
const fetchFromNewsAPI = async () => {
    if (!process.env.NEWS_API_KEY) {
        console.warn("[NewsAPI] WARNING: NEWS_API_KEY is missing");
        return [];
    }

    try {
        console.log('[NewsAPI] Starting fetch...');
        // Multiple targeted search queries for comprehensive coverage
        const searches = [
            'layoffs employees',
            'job cuts companies',
            'workforce reduction',
            'layoff announcement',
        ];

        let allArticles = [];
        let queryCount = 0;

        for (const query of searches) {
            try {
                queryCount++;
                console.log(`[NewsAPI] Query ${queryCount}/${searches.length}: "${query}"`);
                const response = await axios.get(NEWS_API_URL, {
                    params: {
                        apiKey: process.env.NEWS_API_KEY,
                        q: query,
                        sortBy: 'publishedAt',
                        language: 'en',
                        pageSize: 50
                    }
                });
                const articlesCount = response.data.articles ? response.data.articles.length : 0;
                console.log(`[NewsAPI] Query ${queryCount} returned ${articlesCount} articles`);
                allArticles = [...allArticles, ...(response.data.articles || [])];
            } catch (err) {
                console.error(`[NewsAPI] Query failed: "${query}" - ${err.message}`);
            }
        }

        // Dedupe by URL
        const seen = new Set();
        allArticles = allArticles.filter(article => {
            if (seen.has(article.url)) return false;
            seen.add(article.url);
            return true;
        });

        console.log(`[NewsAPI] Fetched ${allArticles.length} unique articles total`);
        return allArticles;

    } catch (error) {
        console.error("[NewsAPI] Fatal Error:", error.message);
        return [];
    }
};

// Fetch from Layoffs.fyi GitHub data
const fetchFromLayoffsFyi = async () => {
    try {
        console.log('[Layoffs.fyi] Fetching data from GitHub...');

        // Try multiple possible GitHub URLs
        const urls = [
            'https://raw.githubusercontent.com/MohammedTaherMcMoran/Layoffs.fyi-Dataset/main/layoff_data.csv',
            'https://raw.githubusercontent.com/HackerNews/layoffs.fyi/main/layoff_data.csv',
        ];

        let data = null;

        for (const url of urls) {
            try {
                console.log(`[Layoffs.fyi] Trying URL: ${url}`);
                const response = await axios.get(url, { timeout: 5000 });
                if (response.data) {
                    data = response.data;
                    console.log('[Layoffs.fyi] Successfully fetched data');
                    break;
                }
            } catch (err) {
                console.log(`[Layoffs.fyi] URL failed (${err.response?.status || err.message}): ${url}`);
            }
        }

        if (!data) {
            console.log('[Layoffs.fyi] No data sources available - skipping');
            return [];
        }

        // Parse CSV data
        const lines = data.split('\n').slice(1); // Skip header
        const articles = [];

        for (const line of lines) {
            if (!line.trim()) continue;

            // Parse CSV line (handle quoted fields)
            const parts = [];
            let current = '';
            let inQuotes = false;

            for (let i = 0; i < line.length; i++) {
                const char = line[i];
                if (char === '"') {
                    inQuotes = !inQuotes;
                } else if (char === ',' && !inQuotes) {
                    parts.push(current.trim());
                    current = '';
                } else {
                    current += char;
                }
            }
            parts.push(current.trim());

            if (parts.length >= 5) {
                const company = parts[0]?.replace(/"/g, '').trim();
                const dateStr = parts[1]?.replace(/"/g, '').trim();
                const employees = parseInt(parts[2]?.replace(/"/g, '').trim() || 0);
                const industry = parts[3]?.replace(/"/g, '').trim();
                const country = parts[4]?.replace(/"/g, '').trim();

                if (company && dateStr && employees > 0) {
                    articles.push({
                        title: `${company} lays off ${employees} employees`,
                        description: `Industry: ${industry || 'Unknown'}. Country: ${country || 'Unknown'}`,
                        url: `https://layoffs.fyi?company=${encodeURIComponent(company)}`,
                        publishedAt: dateStr,
                        source: { name: 'Layoffs.fyi' },
                        custom_company: company,
                        custom_country: country,
                        custom_industry: industry,
                        custom_employees: employees,
                        from_layoffsfyi: true
                    });
                }
            }
        }

        console.log(`[Layoffs.fyi] Fetched ${articles.length} records`);
        return articles;

    } catch (error) {
        console.error('[Layoffs.fyi] Fatal error:', error.message);
        return [];
    }
};

// Fetch from additional sources using news APIs
const fetchFromAlternativeSources = async () => {
    try {
        console.log('[Alternative Sources] Fetching data...');
        let articles = [];

        // Try to fetch from market data/financial news sources
        try {
            // Generic layoff news from NewsAPI with financial focus
            const response = await axios.get('https://newsapi.org/v2/everything', {
                params: {
                    apiKey: process.env.NEWS_API_KEY,
                    q: 'layoff OR "job cuts" OR "workforce reduction" OR retrenchment',
                    sortBy: 'publishedAt',
                    language: 'en',
                    pageSize: 100,
                    sources: 'bloomberg,cnbc,reuters,financial-times,business-insider,techcrunch'
                }
            });
            articles = [...articles, ...(response.data.articles || [])];
        } catch (err) {
            console.log('[Alternative Sources] Financial news fetch failed:', err.message);
        }

        // Dedupe
        const seen = new Set();
        articles = articles.filter(article => {
            if (seen.has(article.url)) return false;
            seen.add(article.url);
            return true;
        });

        console.log(`[Alternative Sources] Fetched ${articles.length} articles`);
        return articles;

    } catch (error) {
        console.error('[Alternative Sources] Error:', error.message);
        return [];
    }
};

const fetchAndStoreLayoffs = async () => {
    try {
        console.log('[SYNC] Starting multi-source sync...');

        // Fetch from all sources in parallel
        const [newsAPIArticles, layoffsFyiArticles, alternativeArticles] = await Promise.all([
            fetchFromNewsAPI(),
            fetchFromLayoffsFyi(),
            fetchFromAlternativeSources()
        ]);

        // Combine all sources
        let allArticles = [...newsAPIArticles, ...layoffsFyiArticles, ...alternativeArticles];

        // Dedupe by URL
        const seen = new Set();
        allArticles = allArticles.filter(article => {
            if (seen.has(article.url)) return false;
            seen.add(article.url);
            return true;
        });

        console.log(`[SYNC] Total unique articles from all sources: ${allArticles.length}`);

        let savedCount = 0;
        let skippedCount = 0;

        for (const article of allArticles) {
            const title = article.title || '';
            const description = article.description || '';
            const sourceUrl = article.url;
            const publishedAt = article.publishedAt;
            const sourceName = article.source?.name || 'Unknown';

            // For Layoffs.fyi data, use pre-extracted fields
            let companyName, employeesLaidOff, isIndia, country, industry;

            if (article.from_layoffsfyi) {
                companyName = article.custom_company;
                employeesLaidOff = article.custom_employees;
                country = article.custom_country || 'Unknown';
                industry = article.custom_industry || 'Technology';
                isIndia = country === 'India';
            } else {
                // VALIDATION 1: Title must mention a known company
                companyName = extractAndValidateCompany(title);
                if (!companyName) {
                    skippedCount++;
                    continue;
                }

                // VALIDATION 2: Must be CONFIRMED layoff (not at-risk/planned)
                if (!isConfirmedLayoff(title)) {
                    skippedCount++;
                    continue;
                }

                // VALIDATION 3: Must have employee count
                employeesLaidOff = extractEmployeeCount(title, description);
                if (!employeesLaidOff) {
                    skippedCount++;
                    continue;
                }

                isIndia = isIndiaRelated(title, description);
                country = isIndia ? 'India' : 'USA';
                industry = getIndustry(companyName);
            }

            // Check duplicates - by URL first
            const { data: existingByUrl } = await supabase
                .from('layoffs')
                .select('id')
                .eq('source_url', sourceUrl)
                .limit(1);

            if (existingByUrl && existingByUrl.length > 0) continue;

            // Also check for same company + same layoff count (avoid duplicate news about same event)
            const { data: existingByCompany } = await supabase
                .from('layoffs')
                .select('id')
                .eq('company_name', companyName)
                .eq('employees_laid_off', employeesLaidOff)
                .limit(1);

            if (existingByCompany && existingByCompany.length > 0) {
                console.log(`⊘ Duplicate event: ${companyName} ${employeesLaidOff} already exists`);
                continue;
            }

            const { error } = await supabase
                .from('layoffs')
                .insert({
                    company_name: companyName,
                    layoff_date: publishedAt,
                    employees_laid_off: employeesLaidOff,
                    country: country,
                    industry: industry,
                    source_url: sourceUrl,
                    source_name: sourceName
                });

            if (error) {
                console.error("Insert error:", error.message);
            } else {
                console.log(`✓ [${sourceName}] ${companyName} | ${employeesLaidOff} | ${country} | ${industry}`);
                savedCount++;
            }
        }

        console.log(`[SYNC] Done: ${savedCount} saved, ${skippedCount} skipped`);
        return {
            message: "Sync complete",
            saved: savedCount,
            skipped: skippedCount,
            total_fetched: allArticles.length,
            sources: {
                newsapi: newsAPIArticles.length,
                layoffsfyi: layoffsFyiArticles.length,
                alternative: alternativeArticles.length
            }
        };

    } catch (error) {
        console.error("[SYNC] Error:", error.message);
        throw error;
    }
};

// Auto-sync
let syncInterval = null;

const startAutoSync = () => {
    console.log('[AUTO-SYNC] Started (every 30 min)');
    setTimeout(() => fetchAndStoreLayoffs().catch(console.error), 5000);
    syncInterval = setInterval(() => fetchAndStoreLayoffs().catch(console.error), 30 * 60 * 1000);
};

const stopAutoSync = () => {
    if (syncInterval) { clearInterval(syncInterval); syncInterval = null; }
};

module.exports = { fetchAndStoreLayoffs, startAutoSync, stopAutoSync };

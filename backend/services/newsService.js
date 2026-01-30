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

    // Patterns to find layoff numbers
    const patterns = [
        /lay(?:s|ing)?\s*off\s*(\d{1,3}(?:,\d{3})*)/i,
        /(\d{1,3}(?:,\d{3})*)\s*(?:employees?|workers?|jobs?|staff|people)\s*(?:laid\s*off|cut|fired|let\s*go)/i,
        /cut(?:ting|s)?\s*(\d{1,3}(?:,\d{3})*)\s*(?:jobs?|employees?|workers?|positions?)/i,
        /(\d{1,3}(?:,\d{3})*)\s*(?:layoffs?|job\s*cuts?)/i,
        /eliminat(?:e|ing|es)\s*(\d{1,3}(?:,\d{3})*)\s*(?:jobs?|positions?|roles?)/i,
        /slash(?:ing|es)?\s*(\d{1,3}(?:,\d{3})*)\s*(?:jobs?|employees?)/i,
        /reduc(?:e|ing|es)\s*(?:workforce|staff|headcount)\s*by\s*(\d{1,3}(?:,\d{3})*)/i,
        /fir(?:e|ing|es)\s*(\d{1,3}(?:,\d{3})*)\s*(?:employees?|workers?)/i,
    ];

    for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match) {
            const numStr = (match[1] || '').replace(/,/g, '');
            const num = parseInt(numStr, 10);
            // Only accept reasonable numbers (50 to 99,999) - ignore 100k+
            if (!isNaN(num) && num >= 50 && num < 100000) {
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

    // Keywords indicating confirmed layoffs (past tense / completed action)
    const confirmedKeywords = ['laid off', 'lays off', 'layoffs', 'fired', 'cut', 'cuts', 'slashed', 'eliminated', 'axed', 'let go', 'downsized'];

    // Keywords indicating planned/at-risk (NOT confirmed) - exclude these
    const excludeKeywords = ['at risk', 'could', 'may', 'might', 'plans to', 'planning', 'considering', 'expected to', 'threatens', 'warns', 'fears', 'potential', 'proposed', 'rumor', 'rumour'];

    // Check if any exclude keywords are present - if so, reject
    if (excludeKeywords.some(kw => titleLower.includes(kw))) {
        return false;
    }

    // Must have a confirmed layoff keyword
    return confirmedKeywords.some(kw => titleLower.includes(kw));
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

const fetchAndStoreLayoffs = async () => {
    if (!process.env.NEWS_API_KEY) {
        throw new Error("NEWS_API_KEY is missing");
    }

    try {
        // More targeted search queries
        const searches = [
            '"layoffs" AND ("employees" OR "workers") AND (Google OR Meta OR Microsoft OR Amazon OR Tesla)',
            '"laid off" AND (Flipkart OR Swiggy OR Zomato OR Paytm OR BYJU OR Ola OR India)',
            '"job cuts" AND (Intel OR Salesforce OR Netflix OR Spotify OR IBM OR Cisco)',
        ];

        let allArticles = [];

        for (const query of searches) {
            try {
                const response = await axios.get(NEWS_API_URL, {
                    params: {
                        apiKey: process.env.NEWS_API_KEY,
                        q: query,
                        sortBy: 'publishedAt',
                        language: 'en',
                        pageSize: 50
                    }
                });
                allArticles = [...allArticles, ...response.data.articles];
            } catch (err) {
                console.error(`Query failed`, err.message);
            }
        }

        // Dedupe
        const seen = new Set();
        allArticles = allArticles.filter(article => {
            if (seen.has(article.url)) return false;
            seen.add(article.url);
            return true;
        });

        console.log(`[SYNC] Fetched ${allArticles.length} unique articles.`);

        let savedCount = 0;
        let skippedCount = 0;

        for (const article of allArticles) {
            const title = article.title || '';
            const description = article.description || '';
            const sourceUrl = article.url;
            const publishedAt = article.publishedAt;

            // VALIDATION 1: Title must mention a known company
            const companyName = extractAndValidateCompany(title);
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
            const employeesLaidOff = extractEmployeeCount(title, description);
            if (!employeesLaidOff) {
                skippedCount++;
                continue;
            }

            const isIndia = isIndiaRelated(title, description);
            const country = isIndia ? 'India' : 'USA';
            const industry = getIndustry(companyName);

            // Check duplicates - by URL
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
                    source_url: sourceUrl
                });

            if (error) {
                console.error("Insert error:", error.message);
            } else {
                console.log(`✓ ${companyName} | ${employeesLaidOff} | ${country} | ${industry}`);
                savedCount++;
            }
        }

        console.log(`[SYNC] Done: ${savedCount} saved, ${skippedCount} skipped`);
        return { message: "Sync complete", saved: savedCount, skipped: skippedCount, total_fetched: allArticles.length };

    } catch (error) {
        console.error("NewsAPI Error:", error.response?.data || error.message);
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

// server.js - SmartInvest Backend API
//import dotenv from 'dotenv';
//dotenv.config();
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const mongoose = require('mongoose');
//dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// In-memory cache for API data
const cache = {
  stocks: {},
  crypto: {},
  recommendations: {}
};

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Helper function to check cache validity
function isCacheValid(timestamp) {
  return timestamp && (Date.now() - timestamp) < CACHE_DURATION;
}

// Route: Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'SmartInvest API is running' });
});

// Route: Get Stock Data from Alpha Vantage
app.get('/api/stocks/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const cacheKey = symbol.toUpperCase();

    // Check cache first
    if (cache.stocks[cacheKey] && isCacheValid(cache.stocks[cacheKey].timestamp)) {
      return res.json(cache.stocks[cacheKey].data);
    }

    const API_KEY = process.env.ALPHA_VANTAGE_API_KEY;
    const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${API_KEY}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data['Global Quote']) {
      const stockData = {
        symbol: data['Global Quote']['01. symbol'],
        price: parseFloat(data['Global Quote']['05. price']),
        change: parseFloat(data['Global Quote']['09. change']),
        changePercent: data['Global Quote']['10. change percent'],
        volume: data['Global Quote']['06. volume'],
        timestamp: Date.now()
      };

      // Cache the result
      cache.stocks[cacheKey] = {
        data: stockData,
        timestamp: Date.now()
      };

      res.json(stockData);
    } else {
      res.status(404).json({ error: 'Stock not found or API limit reached' });
    }
  } catch (error) {
    console.error('Stock API Error:', error);
    res.status(500).json({ error: 'Failed to fetch stock data' });
  }
});

// Route: Get Multiple Stocks
app.post('/api/stocks/batch', async (req, res) => {
  try {
    const { symbols } = req.body;
    
    if (!symbols || !Array.isArray(symbols)) {
      return res.status(400).json({ error: 'Invalid symbols array' });
    }

    const stockPromises = symbols.map(async (symbol) => {
      const cacheKey = symbol.toUpperCase();
      
      if (cache.stocks[cacheKey] && isCacheValid(cache.stocks[cacheKey].timestamp)) {
        return { symbol, data: cache.stocks[cacheKey].data };
      }

      try {
        const API_KEY = process.env.ALPHA_VANTAGE_API_KEY;
        const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${API_KEY}`;
        
        // Add delay to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const response = await fetch(url);
        const data = await response.json();

        if (data['Global Quote'] && data['Global Quote']['01. symbol']) {
          const stockData = {
            symbol: data['Global Quote']['01. symbol'],
            price: parseFloat(data['Global Quote']['05. price']),
            change: parseFloat(data['Global Quote']['09. change']),
            changePercent: data['Global Quote']['10. change percent'],
            volume: data['Global Quote']['06. volume']
          };

          cache.stocks[cacheKey] = {
            data: stockData,
            timestamp: Date.now()
          };

          return { symbol, data: stockData };
        }
        return { symbol, data: null, error: 'Not found' };
      } catch (err) {
        return { symbol, data: null, error: err.message };
      }
    });

    const results = await Promise.all(stockPromises);
    res.json(results);
  } catch (error) {
    console.error('Batch Stock API Error:', error);
    res.status(500).json({ error: 'Failed to fetch stock data' });
  }
});

// Route: Get Crypto Data from CoinGecko
app.get('/api/crypto/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const cacheKey = id.toLowerCase();

    // Check cache first
    if (cache.crypto[cacheKey] && isCacheValid(cache.crypto[cacheKey].timestamp)) {
      return res.json(cache.crypto[cacheKey].data);
    }

    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${id}&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true`;

    const response = await fetch(url);
    const data = await response.json();

    if (data[id]) {
      const cryptoData = {
        id,
        price: data[id].usd,
        change24h: data[id].usd_24h_change,
        volume24h: data[id].usd_24h_vol,
        timestamp: Date.now()
      };

      // Cache the result
      cache.crypto[cacheKey] = {
        data: cryptoData,
        timestamp: Date.now()
      };

      res.json(cryptoData);
    } else {
      res.status(404).json({ error: 'Cryptocurrency not found' });
    }
  } catch (error) {
    console.error('Crypto API Error:', error);
    res.status(500).json({ error: 'Failed to fetch crypto data' });
  }
});

// Route: Get Multiple Cryptos
app.post('/api/crypto/batch', async (req, res) => {
  try {
    const { ids } = req.body;
    
    if (!ids || !Array.isArray(ids)) {
      return res.status(400).json({ error: 'Invalid ids array' });
    }

    const idsString = ids.join(',');
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${idsString}&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true`;

    const response = await fetch(url);
    const data = await response.json();

    const results = ids.map(id => {
      if (data[id]) {
        return {
          id,
          data: {
            price: data[id].usd,
            change24h: data[id].usd_24h_change,
            volume24h: data[id].usd_24h_vol
          }
        };
      }
      return { id, data: null, error: 'Not found' };
    });

    res.json(results);
  } catch (error) {
    console.error('Batch Crypto API Error:', error);
    res.status(500).json({ error: 'Failed to fetch crypto data' });
  }
});

// Route: Generate AI Investment Recommendations
app.post('/api/recommendations', async (req, res) => {
  try {
    const { profile } = req.body;

    if (!profile) {
      return res.status(400).json({ error: 'Profile data required' });
    }

    const { income, goals, riskTolerance, timeHorizon, savings } = profile;

    // Create cache key based on profile
    const cacheKey = JSON.stringify(profile);
    if (cache.recommendations[cacheKey] && isCacheValid(cache.recommendations[cacheKey].timestamp)) {
      return res.json(cache.recommendations[cacheKey].data);
    }

    const prompt = `You are a professional financial advisor. Based on the following client profile, provide personalized investment recommendations:

Income: $${income} per year
Savings: $${savings}
Financial Goals: ${goals}
Risk Tolerance: ${riskTolerance}
Time Horizon: ${timeHorizon}

Please provide:
1. Recommended asset allocation (stocks, bonds, crypto, cash)
2. Specific investment suggestions for each category
3. Brief explanation of the strategy
4. Risk considerations

Format your response as JSON with the following structure:
{
  "allocation": {
    "stocks": percentage,
    "bonds": percentage,
    "crypto": percentage,
    "cash": percentage
  },
  "recommendations": [
    {
      "category": "category name",
      "suggestion": "specific recommendation",
      "allocation": percentage
    }
  ],
  "strategy": "brief explanation",
  "risks": ["risk 1", "risk 2"]
}`;

    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a professional financial advisor providing investment recommendations. Always respond with valid JSON only.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
      })
    });

    const data = await response.json();

    if (data.choices && data.choices[0]) {
      const content = data.choices[0].message.content;
      
      // Try to parse JSON from the response
      let recommendations;
      try {
        // Remove markdown code blocks if present
        const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '');
        recommendations = JSON.parse(cleanContent);
      } catch (parseError) {
        // If parsing fails, create a structured response
        recommendations = {
          allocation: {
            stocks: 60,
            bonds: 30,
            crypto: 5,
            cash: 5
          },
          recommendations: [
            {
              category: 'Stocks',
              suggestion: 'Diversified index funds (S&P 500, Total Market)',
              allocation: 60
            },
            {
              category: 'Bonds',
              suggestion: 'Government and corporate bond funds',
              allocation: 30
            },
            {
              category: 'Crypto',
              suggestion: 'Bitcoin and Ethereum (small allocation)',
              allocation: 5
            },
            {
              category: 'Cash',
              suggestion: 'High-yield savings account',
              allocation: 5
            }
          ],
          strategy: content.substring(0, 500),
          risks: ['Market volatility', 'Interest rate changes', 'Cryptocurrency volatility']
        };
      }

      // Cache the result
      cache.recommendations[cacheKey] = {
        data: recommendations,
        timestamp: Date.now()
      };

      res.json(recommendations);
    } else {
      res.status(500).json({ error: 'Failed to generate recommendations' });
    }
  } catch (error) {
    console.error('OpenAI API Error:', error);
    res.status(500).json({ error: 'Failed to generate recommendations' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`SmartInvest API running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});
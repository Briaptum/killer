const axios = require('axios');
require('dotenv').config();

class ApiService {
    constructor() {
        this.tmdbApi = axios.create({
            baseURL: 'https://api.themoviedb.org/3',
            params: {
                api_key: process.env.TMDB_API_KEY
            }
        });

        this.lastfmApi = axios.create({
            baseURL: 'http://ws.audioscrobbler.com/2.0',
            params: {
                api_key: process.env.LASTFM_API_KEY,
                format: 'json'
            }
        });
    }

    async getMovies() {
        try {
            const response = await this.tmdbApi.get('/movie/popular');
            return response.data.results
                .map(movie => movie.title)
                .filter(title => title.length < 30); // Filter out movies with very long titles
        } catch (error) {
            console.error('Error fetching movies:', error);
            throw error;
        }
    }

    async getSingers() {
        try {
            const response = await this.lastfmApi.get('/', {
                params: {
                    method: 'chart.gettopartists',
                    limit: 50
                }
            });
            return response.data.artists.artist
                .map(artist => artist.name)
                .filter(name => name.length < 30);
        } catch (error) {
            console.error('Error fetching singers:', error);
            throw error;
        }
    }

    async getHistoricalFigures() {
        try {
            // Using a predefined list of historical figures as Wikipedia API is complex
            // In a production environment, you might want to use a proper historical figures API
            const response = await axios.get('https://api.api-ninjas.com/v1/historicalfigures', {
                headers: {
                    'X-Api-Key': process.env.NINJA_API_KEY
                }
            });
            return response.data
                .map(figure => figure.name)
                .filter(name => name.length < 30);
        } catch (error) {
            console.error('Error fetching historical figures:', error);
            throw error;
        }
    }

    async getAnimals() {
        try {
            const response = await axios.get('https://api.api-ninjas.com/v1/animals', {
                headers: {
                    'X-Api-Key': process.env.NINJA_API_KEY
                }
            });
            return response.data
                .map(animal => animal.name)
                .filter(name => name.length < 30);
        } catch (error) {
            console.error('Error fetching animals:', error);
            throw error;
        }
    }

    async getCountries() {
        try {
            const response = await axios.get('https://restcountries.com/v3.1/all');
            return response.data
                .map(country => country.name.common)
                .filter(name => name.length < 30);
        } catch (error) {
            console.error('Error fetching countries:', error);
            throw error;
        }
    }

    // Helper method to get words for a specific category
    async getWordsByCategory(category) {
        switch (category.toLowerCase()) {
            case 'movies':
                return this.getMovies();
            case 'singers':
                return this.getSingers();
            case 'historical':
                return this.getHistoricalFigures();
            case 'animals':
                return this.getAnimals();
            case 'countries':
                return this.getCountries();
            default:
                throw new Error('Invalid category');
        }
    }
}

module.exports = new ApiService();

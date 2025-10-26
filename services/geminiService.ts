import { GoogleGenAI, Type } from "@google/genai";
import { UserProfile, GetawaySuggestion, Accommodation } from '../types';

const API_KEY_ERROR_MESSAGE = "API_KEY environment variable not set. Please ensure your Gemini API key is configured.";

const generateGetawaySuggestions = async (profile: UserProfile, planPreference: 'chill' | 'touristy'): Promise<GetawaySuggestion[]> => {
    if (!process.env.API_KEY) {
        throw new Error(API_KEY_ERROR_MESSAGE);
    }
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    let preferenceDescription: string;
    let mainInstruction: string;
    let priceInstruction: string;

    if (planPreference === 'chill') {
        preferenceDescription = "The client wants a 'chill getaway'. Focus on relaxing, recharging, and disconnecting. Suggest more secluded, nature-oriented, or low-key experiences. Avoid crowded tourist traps.";
        mainInstruction = `Based on this profile, especially their hobbies, demanding work schedule, and desired trip style, suggest 6 distinct and appealing weekend getaway plans near ${profile.location}.`;
        priceInstruction = "Provide an estimated price per night for accommodation.";
    } else { // touristy
        preferenceDescription = `The client wants a 'touristy plan'. First, identify the closest major metropolitan city to their location (${profile.location}). Then, suggest 6 popular attractions, landmarks, or well-known activities within that major city. These should be energetic and engaging experiences perfect for a tourist.`;
        mainInstruction = `Based on this profile and desired trip style, identify the closest major city to ${profile.location}. Then, suggest 6 distinct and appealing tourist attractions or activities within that major city. For the location, use the attraction's address.`;
        priceInstruction = `Set "pricePerNight" to 0. Include any relevant entrance fees or activity costs directly within the description text.`;
    }

    const prompt = `
      You are an expert travel agent specializing in burnout-prevention getaways for professionals. Your client's profile is:

      - Name: ${profile.name}
      - Job: ${profile.jobTitle}
      - Work Schedule: Works approximately ${profile.workHours}.
      - Hobbies & Preferences: ${profile.preferences.join(', ')}.

      **Client's Desired Trip Style: ${planPreference.charAt(0).toUpperCase() + planPreference.slice(1)}**
      - ${preferenceDescription}
      
      ${mainInstruction}

      For each suggestion, provide a unique ID, a catchy title, a specific location (e.g., the name/address of the attraction), a compelling description (2-3 sentences), ${priceInstruction}, a few relevant tags, and the precise latitude and longitude of the attraction.

      Return the response as a JSON array that strictly adheres to the provided schema.
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            id: { type: Type.STRING, description: 'A unique identifier for the suggestion.' },
                            title: { type: Type.STRING, description: 'The catchy title of the getaway.' },
                            location: { type: Type.STRING, description: 'The specific location of the getaway.' },
                            description: { type: Type.STRING, description: 'A compelling 2-3 sentence description.' },
                            pricePerNight: { type: Type.NUMBER, description: 'Estimated price per night (or 0 for tourist attractions).' },
                            tags: {
                                type: Type.ARRAY,
                                items: { type: Type.STRING },
                                description: 'Relevant tags like "Relaxing", "Adventure", etc.'
                            },
                            latitude: { type: Type.NUMBER, description: 'The latitude of the location.' },
                            longitude: { type: Type.NUMBER, description: 'The longitude of the location.' },
                        },
                        required: ["id", "title", "location", "description", "pricePerNight", "tags", "latitude", "longitude"],
                    },
                },
            },
        });
        
        const jsonString = response.text.trim();
        const rawSuggestions: Omit<GetawaySuggestion, 'imageUrls'>[] = JSON.parse(jsonString);
        
        const suggestions = rawSuggestions.map((s) => {
            const imageUrls = Array.from({ length: 5 }, (_, i) => 
                `https://picsum.photos/seed/${encodeURIComponent(s.title)}-${i}/800/600`
            );
            return {
                ...s,
                imageUrls,
            };
        });
        
        return suggestions as GetawaySuggestion[];
    } catch (error) {
        console.error("Error generating suggestions from Gemini:", error);
        if (error instanceof Error && error.message.includes('API key not valid')) {
            throw new Error('Requested entity was not found.');
        }
        throw error;
    }
};

const generateGeneralSuggestions = async (location: string): Promise<GetawaySuggestion[]> => {
    if (!process.env.API_KEY) {
        throw new Error(API_KEY_ERROR_MESSAGE);
    }
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const prompt = `
      You are a travel agent. Suggest 6 popular and diverse weekend getaway plans near ${location}. They can range from adventurous to relaxing to cultural. For each suggestion, provide a unique ID, a catchy title, a specific location, a compelling description (2-3 sentences), an estimated price per night, a few relevant tags, and the precise latitude and longitude.

      Return the response as a JSON array that strictly adheres to the provided schema.
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            id: { type: Type.STRING, description: 'A unique identifier for the suggestion.' },
                            title: { type: Type.STRING, description: 'The catchy title of the getaway.' },
                            location: { type: Type.STRING, description: 'The specific location of the getaway.' },
                            description: { type: Type.STRING, description: 'A compelling 2-3 sentence description.' },
                            pricePerNight: { type: Type.NUMBER, description: 'Estimated price per night.' },
                            tags: {
                                type: Type.ARRAY,
                                items: { type: Type.STRING },
                                description: 'Relevant tags like "Relaxing", "Adventure", etc.'
                            },
                            latitude: { type: Type.NUMBER, description: 'The latitude of the location.' },
                            longitude: { type: Type.NUMBER, description: 'The longitude of the location.' },
                        },
                        required: ["id", "title", "location", "description", "pricePerNight", "tags", "latitude", "longitude"],
                    },
                },
            },
        });

        const jsonString = response.text.trim();
        const rawSuggestions: Omit<GetawaySuggestion, 'imageUrls'>[] = JSON.parse(jsonString);

        const suggestions = rawSuggestions.map((s) => {
            const imageUrls = Array.from({ length: 5 }, (_, i) =>
                `https://picsum.photos/seed/${encodeURIComponent(s.title)}-${i}/800/600`
            );
            return {
                ...s,
                imageUrls,
            };
        });

        return suggestions as GetawaySuggestion[];
    } catch (error) {
        console.error("Error generating general suggestions from Gemini:", error);
        if (error instanceof Error && error.message.includes('API key not valid')) {
            throw new Error('Requested entity was not found.');
        }
        throw error;
    }
}

const generateRelaxationPlan = async (suggestion: GetawaySuggestion, days: number): Promise<string> => {
    if (!process.env.API_KEY) {
        throw new Error(API_KEY_ERROR_MESSAGE);
    }
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const prompt = `
      You are a wellness and travel expert. Create a personalized relaxation and rejuvenation plan for a stressed professional.
      The getaway is for ${days} day(s) at "${suggestion.title}" in ${suggestion.location}.
      The goal is to disconnect, relax, and prevent burnout. The vibe should match the getaway's description: "${suggestion.description}" and its tags: ${suggestion.tags.join(', ')}.

      Please create a day-by-day itinerary. For each day, suggest 2-3 simple, relaxing activities.
      Focus on mindfulness, nature, good food, and low-stress experiences. Avoid overly packed schedules.
      
      Format the output as a simple, readable text. Use headings for each day (e.g., "Day 1: Arrival and Unwinding") and bullet points for activities.
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        });

        return response.text;
    } catch (error) {
        console.error("Error generating relaxation plan from Gemini:", error);
        if (error instanceof Error && error.message.includes('API key not valid')) {
            throw new Error('Requested entity was not found.');
        }
        throw error;
    }
};

const generatePackingList = async (suggestion: GetawaySuggestion, days: number): Promise<string> => {
    if (!process.env.API_KEY) {
        throw new Error(API_KEY_ERROR_MESSAGE);
    }
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const prompt = `
      You are a pragmatic travel assistant. Create a practical packing list for a stressed professional going on a ${days}-day trip.
      The destination is "${suggestion.title}" in ${suggestion.location}.
      The trip's themes are: ${suggestion.tags.join(', ')}.
      The goal is relaxation and disconnecting.

      Create a comprehensive list but keep it minimal and focused.
      Categorize the list into logical sections like "Clothing", "Toiletries", "Electronics (for minimal use)", and "Wellness & Relaxation".
      
      Format the output as simple, readable text with clear headings for each category and bullet points for items.
    `;
    
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        });

        return response.text;
    } catch (error) {
        console.error("Error generating packing list from Gemini:", error);
        if (error instanceof Error && error.message.includes('API key not valid')) {
            throw new Error('Requested entity was not found.');
        }
        throw error;
    }
};

const generateTripDurationSuggestion = async (profile: UserProfile, suggestion: GetawaySuggestion): Promise<number> => {
    if (!process.env.API_KEY) {
        throw new Error(API_KEY_ERROR_MESSAGE);
    }
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const prompt = `
      You are a wellness and burnout prevention expert advising a client, ${profile.name}.
      Client Profile:
      - Job: ${profile.jobTitle}
      - Work Schedule: ${profile.workHours}, indicating a demanding schedule.
      - Preferences: ${profile.preferences.join(', ')}.

      Proposed Getaway:
      - Destination: "${suggestion.title}" in ${suggestion.location}.
      - Vibe: "${suggestion.description}" (Tags: ${suggestion.tags.join(', ')}).

      Based on the client's demanding work schedule and the nature of this relaxing getaway, what is the optimal number of days for this trip to facilitate genuine recovery and prevent burnout?
      Consider that a trip that is too short might not be effective, and one that is too long might be difficult for them to schedule.
      
      Return the response as a JSON object with a single integer property "days".
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        days: {
                            type: Type.INTEGER,
                            description: 'The optimal number of days for the trip.'
                        }
                    },
                    required: ["days"],
                },
            },
        });

        const jsonString = response.text.trim();
        const result = JSON.parse(jsonString);
        if (typeof result.days === 'number' && result.days > 0) {
            return result.days;
        } else {
            // Fallback in case the model returns an invalid number
            return 3; 
        }
    } catch (error) {
        console.error("Error generating trip duration suggestion from Gemini:", error);
        if (error instanceof Error && error.message.includes('API key not valid')) {
            throw new Error('Requested entity was not found.');
        }
        throw error;
    }
};

const generateUniqueAccommodations = async (attraction: GetawaySuggestion): Promise<Accommodation[]> => {
    if (!process.env.API_KEY) {
        throw new Error(API_KEY_ERROR_MESSAGE);
    }
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const prompt = `
        You are a creative travel assistant specializing in unique stays. A user is looking for a place to stay near a tourist attraction.
        Attraction: "${attraction.title}" located at "${attraction.location}".

        Suggest 3 fictional but realistic-sounding unique accommodation options from local homeowners.
        Crucially, these should NOT be hotels, motels, or commercial properties. Think: private homes, ranches, glamping sites, cozy cabins, artist lofts, garden cottages, etc.

        For each option, provide:
        - A unique, appealing name (e.g., "The Sunstone Loft", "Riverside Garden Cottage").
        - A "hostedBy" field with a fictional but friendly host's name (e.g., "Maria & John").
        - A star rating (a number between 4.0 and 5.0, with one decimal place).
        - An estimated price per night (an integer).
        - A short, compelling description (1-2 sentences) highlighting its unique character.

        Return the response as a JSON array that strictly adheres to the provided schema.
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            name: { type: Type.STRING },
                            hostedBy: { type: Type.STRING },
                            rating: { type: Type.NUMBER },
                            pricePerNight: { type: Type.INTEGER },
                            description: { type: Type.STRING },
                        },
                        required: ["name", "hostedBy", "rating", "pricePerNight", "description"],
                    },
                },
            },
        });
        const jsonString = response.text.trim();
        const accommodations = JSON.parse(jsonString);
        return accommodations as Accommodation[];
    } catch (error) {
        console.error("Error generating unique accommodations:", error);
        if (error instanceof Error && error.message.includes('API key not valid')) {
            throw new Error('Requested entity was not found.');
        }
        throw error;
    }
};

const generateSearchPredictions = async (query: string): Promise<string[]> => {
    if (!process.env.API_KEY) {
        throw new Error(API_KEY_ERROR_MESSAGE);
    }
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const prompt = `
      You are a creative travel assistant AI. A user is typing a search query for a travel destination.
      Their current input is: "${query}"
      
      Based on this input, suggest 4 creative and appealing travel search queries they might be interested in.
      The suggestions should be concise and exciting.
      Focus on famous landmarks, natural wonders, unique experiences, or interesting cities.
      
      Examples:
      - Input: "moun" -> Output: ["Mountain cabins in Aspen", "Mount Fuji hiking trails", "Rocky Mountain National Park", "Blue Mountains Australia"]
      - Input: "bea" -> Output: ["Beach houses in Malibu", "Best beaches in Thailand", "Bear Lake Utah", "Miami Beach nightlife"]

      Return the response as a JSON array of 4 unique strings.
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.STRING,
                        description: 'A concise and appealing travel search query.',
                    },
                    description: 'An array of 4 unique travel search suggestions.'
                },
            },
        });
        const jsonString = response.text.trim();
        const predictions: string[] = JSON.parse(jsonString);
        return predictions;
    } catch (error) {
        console.error("Error generating search predictions from Gemini:", error);
        if (error instanceof Error && error.message.includes('API key not valid')) {
            throw new Error('Requested entity was not found.');
        }
        // Return empty array on failure so the UI doesn't break
        return [];
    }
};


export { generateGetawaySuggestions, generateGeneralSuggestions, generateRelaxationPlan, generatePackingList, generateTripDurationSuggestion, generateUniqueAccommodations, generateSearchPredictions };
export interface UserProfile {
  name: string;
  jobTitle: string;
  company: string;
  location: string;
  workHours: string;
  commute: string;
  eatingHabits: string;
  calendarSummary: string;
  searchHistory: string[];
  preferences: string[];
  avatarUrl: string;
}

export interface GetawaySuggestion {
  id: string;
  title: string;
  location: string;
  description: string;
  imageUrls: string[];
  pricePerNight: number;
  tags: string[];
  latitude: number;
  longitude: number;
}

export interface Accommodation {
  name: string;
  rating: number;
  pricePerNight: number;
  description: string;
  hostedBy: string;
}
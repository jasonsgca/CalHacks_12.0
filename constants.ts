
import { UserProfile } from './types';

export const FRANCESCA_PROFILE: UserProfile = {
  name: "Francesca Rossi",
  jobTitle: "Senior Software Engineer",
  company: "CalCodes",
  location: "San Francisco, CA",
  workHours: ">80 hours/week",
  commute: "1.5 hours daily, heavy traffic",
  eatingHabits: "Quick meals at office cafeteria, frequent coffee shop visits for focus.",
  calendarSummary: "Back-to-back meetings, project deadlines every two weeks. Next free weekend is in 10 days.",
  searchHistory: [
    "quiet cabin rentals near Lake Tahoe",
    "best weekend hiking Big Sur",
    "mindfulness and yoga retreats California",
    "gourmet cooking classes SF",
    "how to prevent burnout software engineer"
  ],
  preferences: ["Hiking", "Nature", "Quiet places", "Good food", "Yoga", "Digital detox"],
  avatarUrl: "https://picsum.photos/seed/francesca/200/200"
};

export const GUEST_PROFILE: UserProfile = {
  name: "Explorer",
  jobTitle: "N/A",
  company: "N/A",
  location: "San Francisco, CA", // Default for initial search
  workHours: "N/A",
  commute: "N/A",
  eatingHabits: "N/A",
  calendarSummary: "N/A",
  searchHistory: [],
  preferences: [],
  avatarUrl: "https://picsum.photos/seed/explorer/200/200",
};

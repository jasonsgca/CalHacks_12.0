import React, { useState, useEffect, useCallback } from 'react';
import { GetawaySuggestion, UserProfile, Accommodation } from '../types';
import { generateRelaxationPlan, generatePackingList, generateTripDurationSuggestion, generateUniqueAccommodations } from '../services/geminiService';
import Spinner from './Spinner';
import Icon from './Icon';

// Declare jspdf to satisfy TypeScript, as it's loaded from a CDN
declare const jspdf: any;

interface RelaxationPlannerProps {
  suggestion: GetawaySuggestion;
  onBack: () => void;
  user: UserProfile;
  planPreference: 'chill' | 'touristy';
}

const handleApiError = (err: unknown): string => {
  let message = "An unknown error occurred.";
  if (err instanceof Error) {
      message = err.message;
      if (message.includes('API_KEY') || message.includes('Requested entity was not found')) {
          message = "Your Gemini API Key is missing or invalid. Please ensure it's configured correctly.";
      }
  }
  return message;
}

const RelaxationPlanner: React.FC<RelaxationPlannerProps> = ({ suggestion, onBack, user, planPreference }) => {
  const [days, setDays] = useState<number>(3);
  const [plan, setPlan] = useState<string | null>(null);
  const [isLoadingPlan, setIsLoadingPlan] = useState<boolean>(false);
  const [planError, setPlanError] = useState<string | null>(null);

  const [isLoadingSuggestion, setIsLoadingSuggestion] = useState<boolean>(false);
  const [suggestionError, setSuggestionError] = useState<string | null>(null);

  const [packingList, setPackingList] = useState<string | null>(null);
  const [isLoadingPackingList, setIsLoadingPackingList] = useState<boolean>(false);
  const [packingListError, setPackingListError] = useState<string | null>(null);

  const [checkInDate, setCheckInDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [isBooking, setIsBooking] = useState<boolean>(false);
  const [isBooked, setIsBooked] = useState<boolean>(false);
  
  const [accommodations, setAccommodations] = useState<Accommodation[] | null>(null);
  const [selectedAccommodation, setSelectedAccommodation] = useState<Accommodation | null>(null);
  const [accommodationError, setAccommodationError] = useState<string | null>(null);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState(suggestion.imageUrls[0]);
  const [isLoadingAccommodations, setIsLoadingAccommodations] = useState<boolean>(true);

  const isGuest = user.name === 'Explorer';

  // Simple deterministic hash to generate a pseudo-random number from a string seed
  const simpleHash = (str: string): number => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0; // Convert to 32bit integer
    }
    return Math.abs(hash);
  };

  const getMatchScore = (seed: string): number => {
    const hash = simpleHash(seed);
    return 75 + (hash % 24); // Generates a consistent score between 75 and 98
  };


  const handleSuggestDays = useCallback(async () => {
    setIsLoadingSuggestion(true);
    setSuggestionError(null);
    try {
        const suggestedDays = await generateTripDurationSuggestion(user, suggestion);
        setDays(suggestedDays);
    } catch (err) {
        setSuggestionError(handleApiError(err));
    } finally {
        setIsLoadingSuggestion(false);
    }
  }, [user, suggestion]);

  useEffect(() => {
    handleSuggestDays();
  }, [handleSuggestDays]);

  const fetchAccommodations = useCallback(async () => {
    setIsLoadingAccommodations(true);
    setAccommodationError(null);
    try {
      const result = await generateUniqueAccommodations(suggestion);
      setAccommodations(result);
    } catch (err) {
      setAccommodationError(handleApiError(err));
    } finally {
      setIsLoadingAccommodations(false);
    }
  }, [suggestion]);

  useEffect(() => {
    fetchAccommodations();
  }, [fetchAccommodations]);

  const handleDownloadPdf = (content: string, filename: string) => {
    try {
      const { jsPDF } = jspdf;
      const doc = new jsPDF();
      
      const margin = 15;
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const textWidth = pageWidth - margin * 2;

      doc.setFontSize(18);
      doc.setFont(undefined, 'bold');
      doc.text("Eden AI Getaway Details", pageWidth / 2, margin, { align: 'center' });

      doc.setFontSize(11);
      doc.setFont(undefined, 'normal');
      const splitText = doc.splitTextToSize(content, textWidth);
      
      let cursorY = margin + 15;
      splitText.forEach((line: string) => {
        if (cursorY > pageHeight - margin) {
          doc.addPage();
          cursorY = margin;
        }
        doc.text(line, margin, cursorY);
        cursorY += 7;
      });

      doc.save(filename);
    } catch (error) {
        console.error("Failed to generate PDF:", error);
        alert("Sorry, there was an issue generating the PDF. Please try again.");
    }
  };

  const handleGeneratePlan = async () => {
    if (!days || days < 1) {
      setPlanError("Please enter a valid number of days.");
      return;
    }
    setIsLoadingPlan(true);
    setPlanError(null);
    setPlan(null);
    try {
      const result = await generateRelaxationPlan(suggestion, days);
      setPlan(result);
    } catch (err) {
      setPlanError(handleApiError(err));
    } finally {
      setIsLoadingPlan(false);
    }
  };

  const handleGeneratePackingList = async () => {
    if (!days || days < 1) {
      setPackingListError("Please set a valid trip duration first.");
      return;
    }
    setIsLoadingPackingList(true);
    setPackingListError(null);
    setPackingList(null);
    try {
      const result = await generatePackingList(suggestion, days);
      setPackingList(result);
    } catch (err) {
      setPackingListError(handleApiError(err));
    } finally {
      setIsLoadingPackingList(false);
    }
  };
  
  const handleBookNow = () => {
    setIsBooking(true);
    setTimeout(() => {
        setIsBooked(true);
        setIsBooking(false);
    }, 2000);
  }

  const handleDownloadBookingDetails = () => {
    let checkOutDateString = 'Not specified';
    if (checkInDate) {
        const checkIn = new Date(checkInDate);
        const checkInUTC = new Date(checkIn.getUTCFullYear(), checkIn.getUTCMonth(), checkIn.getUTCDate());
        const checkOut = new Date(checkInUTC);
        checkOut.setDate(checkOut.getDate() + days);
        checkOutDateString = checkOut.toISOString().split('T')[0];
    }
    
    const bookingDetailsContent = `
      BOOKING RESERVATION
      ======================
      
      Your getaway has been reserved for the next 15 minutes.
      To confirm your booking, please complete the payment using the link sent to your email.

      Reservation ID: #AI-2099-RELAX

      TRIP DETAILS
      ----------------------
      Destination: ${suggestion.title}
      Location: ${suggestion.location}
      ${planPreference === 'touristy' && selectedAccommodation ? 
      `
      ACCOMMODATION
      ----------------------
      Stay: ${selectedAccommodation.name}
      Hosted by: ${selectedAccommodation.hostedBy}
      Check-in Date: ${checkInDate || 'Not specified'}
      Check-out Date: ${checkOutDateString}
      ` 
      : 
      `
      Check-in Date: ${checkInDate || 'Not specified'}
      Check-out Date: ${checkOutDateString}
      `
      }

      PAYMENT
      ----------------------
      A payment link has been sent to your registered email address.
      This reservation will be automatically cancelled if payment is not received within 15 minutes.
      
      PERSONALIZED ITINERARY
      ----------------------
      ${plan || 'No itinerary was generated for this trip.'}


      AI-GENERATED PACKING LIST
      ----------------------
      ${packingList || 'No packing list was generated for this trip.'}
    `;
    handleDownloadPdf(bookingDetailsContent, 'EdenAI_Reservation_Details.pdf');
  }

  let checkOutDateString = 'Select a date';
  if (checkInDate && days > 0) {
      const checkIn = new Date(checkInDate);
      const checkInUTC = new Date(checkIn.getUTCFullYear(), checkIn.getUTCMonth(), checkIn.getUTCDate());
      const checkOut = new Date(checkInUTC);
      checkOut.setDate(checkOut.getDate() + days);
      checkOutDateString = checkOut.toISOString().split('T')[0];
  }

  return (
    <div className="animate-fade-in">
      <button
        onClick={onBack}
        className="flex items-center text-sm text-cyan-300 hover:text-cyan-100 mb-6 group"
      >
        <Icon name="back" className="w-5 h-5 mr-2 transition-transform group-hover:-translate-x-1" />
        Back to Suggestions
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
        {/* Left Side: Suggestion Details */}
        <div>
          <div className="relative w-full h-80 bg-slate-700 rounded-lg border-2 border-cyan-400/30 overflow-hidden">
            {!isImageLoaded && (
              <div className="w-full h-full animate-pulse" />
            )}
            <img
              key={selectedImageUrl}
              src={selectedImageUrl}
              alt={suggestion.title}
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${isImageLoaded ? 'opacity-100' : 'opacity-0'}`}
              onLoad={() => setIsImageLoaded(true)}
            />
          </div>
           {suggestion.imageUrls && suggestion.imageUrls.length > 1 && (
            <div className="mt-2 grid grid-cols-5 gap-2">
              {suggestion.imageUrls.map((url, index) => (
                <button
                  key={index}
                  onClick={() => {
                    if (url !== selectedImageUrl) {
                      setIsImageLoaded(false);
                      setSelectedImageUrl(url);
                    }
                  }}
                  className={`relative aspect-video rounded-md overflow-hidden border-2 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-cyan-400 ${selectedImageUrl === url ? 'border-cyan-400' : 'border-transparent hover:border-slate-500'}`}
                  aria-label={`View image ${index + 1}`}
                >
                  <img src={url} alt={`${suggestion.title} thumbnail ${index + 1}`} className="w-full h-full object-cover" />
                  {selectedImageUrl !== url && <div className="absolute inset-0 bg-black/40 hover:bg-black/20 transition-colors"></div>}
                </button>
              ))}
            </div>
          )}
          <h2 className="mt-4 text-3xl font-bold text-slate-100 uppercase tracking-wide text-glow">{suggestion.title}</h2>
          <div className="flex items-center text-md text-slate-400 mt-1">
            <Icon name="location" className="w-5 h-5 mr-2 text-cyan-400" />
            <span>{suggestion.location}</span>
          </div>
          <p className="text-slate-300 mt-4 font-light leading-relaxed">{suggestion.description}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {suggestion.tags.map(tag => (
              <span key={tag} className="px-2 py-1 bg-cyan-900/50 text-cyan-300 text-xs font-semibold rounded-md border border-cyan-700/50">
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Right Side: Planner & Booking */}
        <div className="space-y-8">
          {/* Planner */}
          <div className="bg-slate-800/50 p-6 rounded-lg border border-cyan-400/20">
            <h3 className="text-xl font-bold text-slate-200 uppercase tracking-wider">Create Relaxation Plan</h3>
            <div className="mt-6 space-y-4">
              <div>
                <label htmlFor="days-input" className="block text-sm font-medium text-slate-400 mb-1">
                  {isLoadingSuggestion ? 'AI Suggesting Duration...' : 'Trip Duration'}
                </label>
                <p className="text-xs text-slate-400 mb-2">AI recommends an optimal duration below, but feel free to adjust it.</p>
                <div className="flex items-center gap-2">
                  <input
                    id="days-input"
                    type="number"
                    min="1"
                    max="14"
                    value={days || ''}
                    onChange={(e) => setDays(parseInt(e.target.value, 10))}
                    className="w-full p-2 border border-slate-600 focus:border-cyan-400 focus:ring-cyan-400 bg-slate-900 text-slate-200 rounded-md"
                    aria-label="How many days you will be visiting"
                  />
                  <button
                      onClick={handleSuggestDays}
                      disabled={isLoadingSuggestion}
                      className="flex-shrink-0 flex items-center justify-center w-40 h-[42px] px-4 py-2 bg-slate-700/50 text-slate-300 rounded-md border border-slate-600 hover:bg-slate-700 hover:border-cyan-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                      {isLoadingSuggestion ? <Spinner /> : "Let AI Decide"}
                  </button>
                </div>
                {days > 1 && (
                  <p className="text-xs text-slate-500 mt-1">
                    ({days - 1} {days - 1 === 1 ? 'night' : 'nights'})
                  </p>
                )}
              </div>
              {suggestionError && (
                  <div className="text-center bg-red-900/50 border border-red-500 text-red-300 px-3 py-2 text-sm rounded-md" role="alert">
                      {suggestionError}
                  </div>
              )}
               <div>
                  <label htmlFor="check-in" className="block text-sm font-medium text-slate-400 mb-2">Check-in Date</label>
                  <input type="date" id="check-in" value={checkInDate} onChange={(e) => setCheckInDate(e.target.value)} className="w-full p-2 border border-slate-600 focus:border-cyan-400 focus:ring-cyan-400 bg-slate-900 text-slate-200 rounded-md" />
              </div>
               <div className="p-3 bg-slate-900/50 rounded-md border border-slate-700 text-sm">
                  <div className="flex justify-between">
                      <span className="text-slate-400">Check-in:</span>
                      <span className="font-medium text-slate-200">{checkInDate || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between mt-1">
                      <span className="text-slate-400">Check-out:</span>
                      <span className="font-medium text-slate-200">{checkOutDateString}</span>
                  </div>
              </div>
              <button
                onClick={handleGeneratePlan}
                disabled={isLoadingPlan || !days || days < 1}
                className="w-full h-12 justify-center flex items-center px-6 py-2 bg-cyan-500/20 text-cyan-300 rounded-md border border-cyan-500 hover:bg-cyan-500/40 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isLoadingPlan ? <Spinner /> : "Create Plan"}
              </button>
            </div>
            <div className="mt-6">
              {isLoadingPlan && (
                <div className="flex flex-col items-center justify-center text-center p-4">
                  <Spinner />
                  <p className="mt-3 text-slate-300">AI is crafting your personalized itinerary...</p>
                </div>
              )}
              {planError && (
                <div className="text-center bg-red-900/50 border border-red-500 text-red-300 px-4 py-3 rounded-md" role="alert">
                  <strong className="font-bold">Error: </strong>
                  <span className="block sm:inline">{planError}</span>
                </div>
              )}
              {plan && (
                <div className="mt-4 p-4 bg-slate-900/70 border border-slate-700 rounded-lg animate-fade-in">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-bold text-lg text-cyan-300 uppercase tracking-wider">Your Itinerary</h4>
                    <button onClick={() => handleDownloadPdf(plan, 'EdenAI_Itinerary.pdf')} title="Download Itinerary as PDF" className="p-2 text-cyan-300 hover:bg-cyan-400/20 rounded-full transition">
                        <Icon name="download" className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="text-slate-300 whitespace-pre-wrap font-light text-sm leading-relaxed">
                    {plan}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Packing List */}
          <div className="bg-slate-800/50 p-6 rounded-lg border border-cyan-400/20">
            <h3 className="text-xl font-bold text-slate-200 uppercase tracking-wider">AI Packing Assistant</h3>
            <p className="text-slate-400 mt-1 text-sm">Let AI create a packing list tailored to your trip.</p>
             <div className="mt-6">
                {!packingList && (
                    <button onClick={handleGeneratePackingList} disabled={isLoadingPackingList || !days} className="w-full h-12 flex items-center justify-center px-6 py-2 bg-cyan-500/20 text-cyan-300 rounded-md border border-cyan-500 hover:bg-cyan-500/40 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-all">
                        {isLoadingPackingList ? <Spinner /> : 'Generate Packing List'}
                    </button>
                )}
                {isLoadingPackingList && (
                    <div className="flex flex-col items-center justify-center text-center p-4">
                    <Spinner />
                    <p className="mt-3 text-slate-300">Analyzing inventory for optimal packing...</p>
                    </div>
                )}
                {packingListError && (
                    <div className="text-center bg-red-900/50 border border-red-500 text-red-300 px-4 py-3 rounded-md" role="alert">
                    <strong className="font-bold">Error: </strong>
                    <span className="block sm:inline">{packingListError}</span>
                    </div>
                )}
                {packingList && (
                    <div className="mt-4 p-4 bg-slate-900/70 border border-slate-700 rounded-lg animate-fade-in">
                        <div className="flex justify-between items-center mb-3">
                            <h4 className="font-bold text-lg text-cyan-300 uppercase tracking-wider">Your Packing List</h4>
                            <button onClick={() => handleDownloadPdf(packingList, 'EdenAI_Packing_List.pdf')} title="Download Packing List as PDF" className="p-2 text-cyan-300 hover:bg-cyan-400/20 rounded-full transition">
                                <Icon name="download" className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="text-slate-300 whitespace-pre-wrap font-light text-sm leading-relaxed">
                            {packingList}
                        </div>
                    </div>
                )}
            </div>
          </div>

          {/* Booking */}
          <div className="bg-slate-800/50 p-6 rounded-lg border border-cyan-400/20">
            {isBooked ? (
                <div className="text-center animate-fade-in flex flex-col items-center">
                    <Icon name="clock" className="w-16 h-16 text-yellow-400" />
                    <h3 className="text-2xl mt-4 font-bold text-slate-100 uppercase tracking-wide text-glow">Booking Reserved</h3>
                    <p className="text-slate-300 mt-2 max-w-sm">A payment link has been sent to your email. Please make payment within 15 min to secure your stay.</p>
                    <button onClick={handleDownloadBookingDetails} className="mt-6 flex items-center justify-center w-full max-w-xs mx-auto px-4 py-2 bg-cyan-500/20 text-cyan-300 rounded-md border border-cyan-500 hover:bg-cyan-500/40 focus:outline-none transition-all">
                        <Icon name="download" className="w-5 h-5 mr-2" />
                        Download Reservation Details
                    </button>
                    <p className="text-xs text-slate-500 mt-4">Reservation ID: #AI-2099-RELAX</p>
                </div>
            ) : (
            <>
                <h3 className="text-xl font-bold text-slate-200 uppercase tracking-wider">Find Where You Belong</h3>
                <p className="text-slate-400 mt-1 text-sm">Discover unique stays from local hosts for your getaway.</p>
                <div className="mt-6">
                  {isLoadingAccommodations ? (
                    <div className="flex flex-col items-center justify-center text-center p-4">
                      <Spinner />
                      <p className="mt-3 text-slate-300">AI is scanning for unique stays...</p>
                    </div>
                  ) : accommodations ? (
                    <div className="space-y-4 animate-fade-in">
                      <h4 className="font-semibold text-slate-300">Unique Stays by Local Hosts:</h4>
                      {accommodations.map((hotel, index) => (
                        <div key={index} className={`p-4 rounded-lg border transition-all ${selectedAccommodation?.name === hotel.name ? 'bg-cyan-900/50 border-cyan-500' : 'bg-slate-900/50 border-slate-700 hover:border-slate-500'}`}>
                          <div className="flex justify-between items-start">
                            <div>
                              <h5 className="font-bold text-slate-200">{hotel.name}</h5>
                              <p className="text-sm text-slate-400 italic">Hosted by {hotel.hostedBy}</p>
                              <div className="flex items-center gap-x-2 text-xs mt-1">
                                <span className="text-yellow-400">{hotel.rating.toFixed(1)} stars</span>
                                {!isGuest && (
                                  <>
                                    <span className="text-slate-600">·</span>
                                    <span className="text-cyan-400 font-medium">✨ {getMatchScore(`${suggestion.id}-${index}`)}% Match</span>
                                  </>
                                )}
                              </div>
                              <p className="text-xs text-slate-400 mt-2">{hotel.description}</p>
                            </div>
                            <div className="text-right flex-shrink-0 ml-4">
                              <p className="text-lg font-bold text-slate-100">${hotel.pricePerNight}</p>
                              <p className="text-xs text-slate-500">/ night</p>
                            </div>
                          </div>
                          <div className="mt-3 text-right">
                            <button onClick={() => setSelectedAccommodation(hotel)} disabled={selectedAccommodation?.name === hotel.name} className="px-4 py-1 text-sm font-medium rounded-md border disabled:cursor-not-allowed enabled:hover:bg-cyan-500/40 bg-cyan-500/20 text-cyan-300 border-cyan-500 disabled:bg-cyan-500/40 disabled:border-cyan-400 disabled:text-cyan-100">
                              {selectedAccommodation?.name === hotel.name ? 'Selected' : 'Select'}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null}

                  {accommodationError && (
                    <div className="mt-4 text-center bg-red-900/50 border border-red-500 text-red-300 px-4 py-3 rounded-md" role="alert">
                      {accommodationError}
                    </div>
                  )}

                  {selectedAccommodation && (
                    <div className="animate-fade-in mt-6">
                      <button onClick={handleBookNow} disabled={isBooking} className="w-full flex items-center justify-center h-12 px-6 py-2 bg-green-500/20 text-green-300 rounded-md border border-green-500 hover:bg-green-500/40 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-all">
                        {isBooking ? <Spinner /> : `Book ${selectedAccommodation.name}`}
                      </button>
                    </div>
                  )}
                </div>
            </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RelaxationPlanner;